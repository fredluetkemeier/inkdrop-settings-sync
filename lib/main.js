"use babel";

import crypto from "crypto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { store } from "./store";
import { gistClient } from "./api/gist-client";
import { sync } from "./sync";
import { getLocalSettings } from "./settings";

import WelcomeDialog, { commands as welcomeCmds } from "./ui/WelcomeDialog";
import StatusBanner from "./ui/StatusBanner";

import keys from "./keys.json";

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
    inkdrop.commands.add(document.body, welcomeCmds.tokenSet, syncSettings);

    inkdrop.components.registerClass(WelcomeDialog);
    inkdrop.components.registerClass(StatusBanner);
    inkdrop.layouts.addComponentToLayout("modal", "WelcomeDialog");
    inkdrop.layouts.insertComponentToLayoutBefore(
        "sidebar",
        "SideBarSyncStatusView",
        "StatusBanner"
    );

    syncSettings();
}

function deactivate() {
    inkdrop.layouts.removeComponentFromLayout("modal", "WelcomeDialog");
    inkdrop.layouts.removeComponentFromLayout("sidebar", "StatusBanner");
    inkdrop.components.deleteClass(WelcomeDialog);
    inkdrop.components.deleteClass(StatusBanner);

    syncSettings();
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

async function syncSettings() {
    const token = store.get(keys.githubAccessToken);

    const gistDesc = buildGistDesc();
    const searchResult = await searchGistsByDesc(token, gistDesc);

    if (searchResult == null) {
        console.log("Existing gist not found, creating...");

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
        console.log("Gist created!");
    } else {
        store.set(keys.gistId, searchResult.id);

        await sync();

        store.set(keys.lastSynced, dayjs.utc().format());
        console.log("Sync complete!");
    }
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
