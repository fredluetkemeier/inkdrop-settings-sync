"use babel";

import { store } from "./store";
import WelcomeDialog from "./ui/WelcomeDialog";

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
    inkdrop.commands.add(document.body, WelcomeDialog.subs.ready, () => {
        if (store.exists(keys.githubAccessToken)) return;

        if (store.exists(keys.hasBeenWelcomed)) {
            inkdrop.commands.dispatch(
                document.body,
                "inkdrop-settings-sync:auth-modal:show"
            );
        } else {
            inkdrop.commands.dispatch(
                document.body,
                WelcomeDialog.commands.show
            );
        }
    });

    inkdrop.components.registerClass(WelcomeDialog);
    inkdrop.layouts.addComponentToLayout("modal", "WelcomeDialog");

    //console.log(inkdrop.components.classes);
    //console.log(inkdrop.store.getState().layouts);
}

function deactivate() {
    inkdrop.layouts.removeComponentFromLayout("modal", "WelcomeDialog");
    inkdrop.components.deleteClass(WelcomeDialog);
}
