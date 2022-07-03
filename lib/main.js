"use babel";

import crypto from "crypto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { store } from "./store";
import { gistClient } from "./api/gist-client";
import keys from "./keys.json";

import WelcomeDialog, { commands as welcomeCmds } from "./ui/WelcomeDialog";

dayjs.extend(utc);

const config = {};

module.exports = {
    activate,
    deactivate,
    config,
};

//
// LIFECYCLE HOOKS
//
async function activate() {
    inkdrop.commands.add(document.body, welcomeCmds.ready, handleWelcomeReady);
    inkdrop.commands.add(document.body, welcomeCmds.tokenSet, handleTokenSet);

    handleTokenSet();
    inkdrop.components.registerClass(WelcomeDialog);
    inkdrop.layouts.addComponentToLayout("modal", "WelcomeDialog");
}

function deactivate() {
    inkdrop.layouts.removeComponentFromLayout("modal", "WelcomeDialog");
    inkdrop.components.deleteClass(WelcomeDialog);
}

//
// HANDLERS
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

async function handleTokenSet() {
    const token = store.get(keys.githubAccessToken);

    const gistDesc = buildGistDesc();
    const searchResult = await searchGistsByDesc(token, gistDesc);

    if (searchResult == null) {
        const createResult = await gistClient.create(token, {
            files: {
                settings: {
                    content: await getLocalSettings().then((settings) =>
                        JSON.stringify(settings, null, 2)
                    ),
                },
            },
            description: gistDesc,
            isPublic: false,
        });

        store.set(keys.gistId, createResult.id);
        store.set(keys.lastSynced, createResult.updated_at);
    } else {
        store.set(keys.gistId, searchResult.id);

        sync()
            .then(() => store.set(keys.lastSynced, dayjs.utc().format()))
            .then(() => console.log("Sync complete!"));
    }
}

async function sync() {
    console.log("Syncing settings...");

    const token = store.get(keys.githubAccessToken);
    const gistId = store.get(keys.gistId);

    const remote = await gistClient.get(token, gistId).then((res) => ({
        lastSynced: res.updated_at,
        description: res.description,
        settings: JSON.parse(res.files.settings.content),
    }));
    const localSettings = await getLocalSettings();

    if (compare(localSettings, remote.settings)) {
        console.log("Local is same as remote, no sync needed");
        return Promise.resolve();
    }

    const lastSynced = store.get(keys.lastSynced);
    if (dayjs(lastSynced).isBefore(remote.lastSynced)) {
        console.log("Remote changes detected, setting them locally..");
        return setLocalSettings(remote.settings);
    }

    console.log("Pushing changes to remote...");

    return gistClient.update(token, gistId, {
        description: remote.description,
        files: {
            settings: {
                content: JSON.stringify(localSettings, null, 2),
            },
        },
    });
}

async function getLocalSettings() {
    const { user } = await inkdrop.ipm.getInstalled();
    const enabledThemes = await inkdrop.themes.getEnabledThemeNames();

    const installedPackages = user.map(({ name, version, theme = false }) => ({
        name,
        version,
        isTheme: !!theme,
    }));

    return {
        packages: installedPackages,
        themes: enabledThemes,
    };
}

async function setLocalSettings(changed) {
    const current = await getLocalSettings();

    const { packages: currentPackages } = current;
    const { packages: changedPackages, themes: changedThemes } = changed;

    const { added: addedPackages, removed: removedPackages } = packageDiff(
        currentPackages,
        changedPackages
    );

    // Install added packages
    await Promise.all(
        addedPackages.map(({ name, version, isTheme }) =>
            inkdrop.ipm.install({ name, version, theme: isTheme })
        )
    );

    // Uninstall removed packages
    await Promise.all(
        removedPackages.map(({ name }) => inkdrop.ipm.uninstall({ name }))
    );

    // Set themes
    inkdrop.config.settings.core.themes = changedThemes;

    // Apply updated themes to take effect in the GUI
    await inkdrop.themes.activateThemes();
}

function packageDiff(current, changed) {
    const added = changed.filter((x) => !current.some((y) => compare(x, y)));
    const removed = current.filter((x) => !changed.some((y) => compare(x, y)));

    return { added, removed };
}

function themeDiff(current, changed) {
    const added = changed.filter((x) => !current.some((y) => x == y));
    const removed = current.filter((x) => !changed.some((y) => x == y));

    return { added, removed };
}

function compare(objA, objB) {
    return JSON.stringify(objA) === JSON.stringify(objB);
}

function buildGistDesc() {
    const userIdHash = hashUserId();

    return `inkdrop:settings-sync:${userIdHash}`;
}

function hashUserId() {
    const userId = inkdrop.main.account._userId;
    return crypto.createHash("sha256").update(userId).digest("hex");
}

async function searchGistsByDesc(token, searchDesc, page = 1) {
    const PER_PAGE = 100;
    const gists = await gistClient.list(token, { page, perPage: PER_PAGE });

    if (gists.length == 0) return null;

    const searchResult = gists.find(
        ({ description }) => description == searchDesc
    );

    if (searchResult) return searchResult;

    if (gists.length < PER_PAGE) return null;

    return searchGistsByDesc(token, searchDesc, page + 1);
}
