"use babel";

import crypto from "crypto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { store } from "./store";
import { gistClient } from "./api/gist-client";
import { sync } from "./sync";
import { getLocalSettings } from "./settings";
import { poll } from "./utils/poll";

import WelcomeDialog, { commands as welcomeCmds } from "./ui/WelcomeDialog";
import StatusBanner, { commands as statusCmds } from "./ui/StatusBanner";

import keys from "./keys.json";
import statuses from "./sync-statuses.json";

dayjs.extend(utc);

module.exports = {
    activate,
    deactivate,
    config: {
        syncInterval: {
            title: "Sync Interval",
            description:
                "Time in seconds to check for upstream changes. Local settings changes will be detected automatically, regardless of the Sync Interval.",
            type: "number",
            default: 15 * 60, // 15 minutes
            minimum: 1,
        },
    },
};

let refs = [];
let syncStatus = store.get(keys.syncStatus);
let poller = null;

//
// LIFECYCLE HOOKS
//
async function activate() {
    // Register commands
    const cmdsRef = inkdrop.commands.add(document.body, {
        [welcomeCmds.ready]: handleWelcomeReady,
        [welcomeCmds.tokenSet]: handleTokenSet,
        [statusCmds.needsAuth]: () => handleStatusChange(statuses.needsAuth),
        [statusCmds.syncing]: () => handleStatusChange(statuses.syncing),
        [statusCmds.synced]: () => handleStatusChange(statuses.synced),
        [statusCmds.error]: () => handleStatusChange(statuses.error),
        [statusCmds.offline]: () => handleStatusChange(statuses.offline),
    });

    if (store.exists(keys.githubAccessToken)) {
        if (navigator.onLine) {
            inkdrop.commands.dispatch(document.body, statusCmds.synced);
        } else {
            inkdrop.commands.dispatch(document.body, statusCmds.offline);
        }

        syncSettings();
    } else {
        inkdrop.commands.dispatch(document.body, statusCmds.needsAuth);
    }

    // Package events
    const pkgLoadRef = inkdrop.packages.onDidLoadPackage(() => syncSettings());
    const pkgUnloadRef = inkdrop.packages.onDidUnloadPackage(() =>
        syncSettings()
    );

    // Theme events
    const themeChangeRef = inkdrop.themes.onDidChangeActiveThemes(() =>
        syncSettings()
    );

    // Settings events
    const acrylicEnabledRef = inkdrop.config.observe(
        "core.mainWindow.acrylicEnabled",
        () => syncSettings()
    );

    // Network events
    const networkStatusRef = registerNetworkEvents();

    // Polling
    poller = poll();
    poller.loop(
        syncSettings,
        () => inkdrop.config.get("settings-sync.syncInterval") * 1000
    );

    const configRef = inkdrop.config.observe("settings-sync.syncInterval", () =>
        poller?.restart()
    );

    // Store refs
    refs = [
        configRef,
        cmdsRef,
        pkgLoadRef,
        pkgUnloadRef,
        themeChangeRef,
        acrylicEnabledRef,
        networkStatusRef,
        poller,
    ];

    // Register UI components
    inkdrop.components.registerClass(WelcomeDialog);
    inkdrop.components.registerClass(StatusBanner);
    inkdrop.layouts.addComponentToLayout("modal", "WelcomeDialog");
    inkdrop.layouts.insertComponentToLayoutBefore(
        "sidebar",
        "SideBarSyncStatusView",
        "StatusBanner"
    );
}

function deactivate() {
    inkdrop.layouts.removeComponentFromLayout("modal", "WelcomeDialog");
    inkdrop.layouts.removeComponentFromLayout("sidebar", "StatusBanner");
    inkdrop.components.deleteClass(WelcomeDialog);
    inkdrop.components.deleteClass(StatusBanner);

    for (let i = 0; i < refs.length; i++) {
        refs[i]?.dispose();
    }

    poller = null;
    refs = [];
}
//
//
//

function handleWelcomeReady() {
    if (store.exists(keys.githubAccessToken)) return;

    if (store.exists(keys.hasBeenWelcomed)) {
        inkdrop.commands.dispatch(
            document.body,
            "settings-sync:auth-modal:show"
        );
    } else {
        inkdrop.commands.dispatch(document.body, welcomeCmds.show);
    }
}

function handleTokenSet() {
    handleStatusChange(statuses.synced);
    syncSettings();
}

function handleStatusChange(status) {
    store.set(keys.syncStatus, status);
    syncStatus = status;
}

function registerNetworkEvents() {
    const abortController = new AbortController();

    window.addEventListener("online", handleNetworkStatusChange, {
        signal: abortController.signal,
    });
    window.addEventListener("offline", handleNetworkStatusChange, {
        signal: abortController.signal,
    });

    return {
        dispose: () => abortController.abort(),
    };
}

function handleNetworkStatusChange() {
    if (navigator.onLine) {
        poller?.resume();
        inkdrop.commands.dispatch(document.body, statusCmds.synced);
        syncSettings();
        return;
    }

    poller?.pause();
    inkdrop.commands.dispatch(document.body, statusCmds.offline);
}

async function syncSettings() {
    if (isSyncingLocked(syncStatus)) return;

    inkdrop.commands.dispatch(document.body, statusCmds.syncing);

    const token = store.get(keys.githubAccessToken);
    const gistId = store.get(keys.gistId);
    let gist = await getGist(token, gistId);

    if (gist instanceof Response && gist.status == 404) {
        const gistDesc = buildGistDesc();

        const searchResult = await searchGistsByDesc(token, gistDesc)
            .then(async (searchResult) => {
                if (searchResult) {
                    store.set(keys.gistId, searchResult.id);
                    gist = await getGist(token, searchResult.id);
                }

                return searchResult;
            })
            .catch(handleApiError);

        if (searchResult instanceof Error) {
            return Promise.reject(searchResult.message);
        }

        if (searchResult == null) {
            console.log("Existing gist not found, creating...");

            const createResult = await gistClient
                .create(token, {
                    files: {
                        settings: {
                            content: await getLocalSettings().then((settings) =>
                                JSON.stringify(settings, null, 2)
                            ),
                        },
                    },
                    description: gistDesc,
                    isPublic: false,
                })
                .then((result) => {
                    store.set(keys.gistId, result.id);
                    store.set(keys.lastSynced, result.updated_at);
                    inkdrop.commands.dispatch(document.body, statusCmds.synced);
                })
                .catch(handleApiError);

            if (createResult instanceof Error)
                return Promise.reject(createResult.message);

            console.log("Gist created!");

            return Promise.resolve();
        }
    }

    if (gist instanceof Error) return Promise.reject(gist.message);

    const syncResult = await sync(gist)
        .then((patchResult) => {
            const lastSyncTime =
                patchResult?.updated_at ?? dayjs.utc().format();

            store.set(keys.lastSynced, lastSyncTime);
            console.log("Sync complete!");
            inkdrop.commands.dispatch(document.body, statusCmds.synced);
        })
        .catch(handleApiError);

    if (syncResult instanceof Error) return Promise.reject(syncResult.message);

    return Promise.resolve();
}

function isSyncingLocked(status) {
    switch (status) {
        case statuses.needsAuth:
        case statuses.syncing:
        case statuses.offline:
            return true;
        default:
            return false;
    }
}

async function getGist(token, gistId) {
    return await gistClient
        .get(token, gistId)
        .then((res) => ({
            lastSynced: res.updated_at,
            description: res.description,
            settings: JSON.parse(res.files.settings.content),
        }))
        .catch(handleApiError);
}

function handleApiError(error) {
    const { status } = error;

    switch (status) {
        case 401:
            inkdrop.commands.dispatch(document.body, statusCmds.needsAuth);
            break;
        case 404:
            break;
        default:
            inkdrop.commands.dispatch(document.body, statusCmds.error);
    }

    return error;
}

function buildGistDesc() {
    const userIdHash = hashUserId();
    const isDev = inkdrop.config.get("core.devMode");

    const baseDesc = `inkdrop:settings-sync:${userIdHash}`;
    return isDev ? `${baseDesc}-dev` : baseDesc;
}

function hashUserId() {
    const userId = inkdrop.main.account._userId;
    return crypto.createHash("sha256").update(userId).digest("hex");
}

async function searchGistsByDesc(token, searchDesc, page = 1) {
    const gists = await gistClient.list(token, { page, perPage: 50 });

    if (gists.length == 0) return null;

    const searchResult = gists.find(
        ({ description }) => description == searchDesc
    );

    if (searchResult) return searchResult;

    return searchGistsByDesc(token, searchDesc, page + 1);
}
