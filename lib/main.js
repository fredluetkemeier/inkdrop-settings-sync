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

//
// LIFECYCLE HOOKS
//
let refs = [];
let syncStatus = store.get(keys.syncStatus);

async function activate() {
    // UI Events
    const cmdsRef = inkdrop.commands.add(document.body, {
        [welcomeCmds.ready]: handleWelcomeReady,
        [welcomeCmds.tokenSet]: handleTokenSet,
        [statusCmds.needsAuth]: () => handleStatusChange(statuses.needsAuth),
        [statusCmds.syncing]: () => handleStatusChange(statuses.syncing),
        [statusCmds.synced]: () => handleStatusChange(statuses.synced),
        [statusCmds.error]: () => handleStatusChange(statuses.error),
    });

    if (store.exists(keys.githubAccessToken)) {
        inkdrop.commands.dispatch(document.body, statusCmds.synced);
        syncSettings();
    } else {
        inkdrop.commands.dispatch(document.body, statusCmds.needsAuth);
    }

    // Register UI components
    inkdrop.components.registerClass(WelcomeDialog);
    inkdrop.components.registerClass(StatusBanner);
    inkdrop.layouts.addComponentToLayout("modal", "WelcomeDialog");
    inkdrop.layouts.insertComponentToLayoutBefore(
        "sidebar",
        "SideBarSyncStatusView",
        "StatusBanner"
    );

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

    // Polling
    const poller = poll();
    poller.loop(
        syncSettings,
        () => inkdrop.config.get("settings-sync.syncInterval") * 1000
    );

    const configRef = inkdrop.config.observe("settings-sync.syncInterval", () =>
        poller.cancelTimeout()
    );

    // Store refs
    refs = [
        configRef,
        cmdsRef,
        pkgLoadRef,
        pkgUnloadRef,
        themeChangeRef,
        acrylicEnabledRef,
        poller,
    ];
}

function deactivate() {
    inkdrop.layouts.removeComponentFromLayout("modal", "WelcomeDialog");
    inkdrop.layouts.removeComponentFromLayout("sidebar", "StatusBanner");
    inkdrop.components.deleteClass(WelcomeDialog);
    inkdrop.components.deleteClass(StatusBanner);

    for (let i = 0; i < refs.length; i++) {
        refs[i].dispose();
    }

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

function handleApiError({ status }) {
    if (status == 401) {
        inkdrop.commands.dispatch(document.body, statusCmds.needsAuth);
    }
}

async function syncSettings() {
    if (isSyncingLocked(syncStatus)) return;

    inkdrop.commands.dispatch(document.body, statusCmds.syncing);

    const token = store.get(keys.githubAccessToken);

    const gistDesc = buildGistDesc();
    const searchResult = await searchGistsByDesc(token, gistDesc).catch(
        handleApiError
    );

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
            .catch(handleApiError);

        store.set(keys.gistId, createResult.id);
        store.set(keys.lastSynced, createResult.updated_at);

        console.log("Gist created!");
    } else {
        store.set(keys.gistId, searchResult.id);

        await sync().catch(handleApiError);

        store.set(keys.lastSynced, dayjs.utc().format());

        console.log("Sync complete!");
    }

    inkdrop.commands.dispatch(document.body, statusCmds.synced);

    return Promise.resolve();
}

function isSyncingLocked(status) {
    return status == statuses.needsAuth || status == statuses.syncing;
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
    const gists = await gistClient.list(token, { page, perPage: 5 });

    if (gists.length == 0) return null;

    const searchResult = gists.find(
        ({ description }) => description == searchDesc
    );

    if (searchResult) return searchResult;

    return searchGistsByDesc(token, searchDesc, page + 1);
}
