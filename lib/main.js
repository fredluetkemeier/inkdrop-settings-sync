"use babel";

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
            "inkdrop-settings-sync:auth-modal:show"
        );
    } else {
        inkdrop.commands.dispatch(document.body, welcomeCmds.show);
    }
}

async function handleTokenSet() {
    console.log("token was set");

    var installedPackages = await inkdrop.ipm.getInstalled();

    console.log(installedPackages);

    // gistClient
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
