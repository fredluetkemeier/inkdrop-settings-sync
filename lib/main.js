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

    //console.log(inkdrop.components.classes);
    //console.log(inkdrop.store.getState().layouts);
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

        console.log(createResult);

        store.set(keys.gistId, createResult.id);
        store.set(keys.lastSynced, createResult.updated_at);
    } else {
        sync();
    }
}

async function sync() {
    const token = store.get(keys.githubAccessToken);
    const gistId = store.get(keys.gistId);

    const remote = await gistClient.get(token, gistId).then((res) => ({
        lastSynced: res.updated_at,
        settings: JSON.parse(res.files.settings.content),
    }));

    console.log(remote);

    const lastSynced = store.get(keys.lastSynced);
    // if (dayjs(lastSynced).isBefore(remote.lastSynced)) {
    if (true) {
        const localSettings = await getLocalSettings().then((settings) => ({
            ...settings,
            packages: [
                ...settings.packages,
                { name: "bar", version: "0.0.1" },
                { name: "baz", version: "0.0.1" },
            ],
        }));

        const newSettings = mergeSettings(localSettings, remote.settings);
    }
}

async function getLocalSettings() {
    const { user } = await inkdrop.ipm.getInstalled();
    const enabledThemes = await inkdrop.themes.getEnabledThemeNames();

    const installedPackages = user.map(({ name, version }) => ({
        name,
        version,
    }));

    return {
        packages: installedPackages,
        themes: enabledThemes,
    };
}

function mergeSettings(local, remote) {
    const mergedPackages = mergePackages(local.packages, remote.packages);

    return { packages: mergedPackages, themes: remote.themes };
}

function mergePackages(localPackages, remotePackages) {
    const all = [...remotePackages, ...localPackages];
    const namesSet = new Set(all.map(({ name }) => name));

    return [...namesSet].map((name) => all.find((x) => x.name == name));
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

// async function createEmptyGist() {
//     const { id } = await gistClient
//         .create(accessToken, {
//             files: {},
//             description: "test",
//             isPublic: false,
//         })
//         .then((res) => {
//             console.log(res);

//             return res;
//         });
// }
