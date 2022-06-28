"use babel";

import crypto from "crypto";
import { store } from "./store";
import { gistClient } from "./api/gist-client";

import WelcomeDialog, { commands as welcomeCmds } from "./ui/WelcomeDialog";

import keys from "./keys.json";

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

    var installedPackages = await inkdrop.ipm.getInstalled();

    console.log(installedPackages);

    const gistId = buildGistId();
    const result = await gistClient
        .get(token, gistId)
        .catch(async ({ status }) => {
            if (status == 404) {
                return await gistClient.create(token, {
                    files: {
                        "settings.txt": {
                            content: "test",
                        },
                    },
                    description: gistId,
                    isPublic: false,
                });
            }
        });
    console.log(result);
}

function buildGistId() {
    const userIdHash = hashUserId();

    return `inkdrop:settings-sync:${userIdHash}`;
}

function hashUserId() {
    const userId = inkdrop.main.account._userId;
    return crypto.createHash("sha256").update(userId).digest("hex");
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
