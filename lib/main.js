"use babel";

import WelcomeDialog from "./ui/WelcomeDialog";

const config = {
    githubAccessToken: {
        title: "githubAccessToken",
        type: "string",
        default: null,
    },
    gistId: {
        title: "gistId",
        type: "string",
        default: null,
    },
};

module.exports = {
    activate,
    deactivate,
    config,
};

//
// LIFECYCLE HOOKS
//
async function activate() {
    //if (!store.exists(config.gistId.title)) createEmptyGist();

    inkdrop.commands.add(
        document.body,
        "inkdrop-settings-sync:welcome-modal:ready",
        () =>
            inkdrop.commands.dispatch(
                document.body,
                "inkdrop-settings-sync:welcome-modal:show"
            )
    );

    inkdrop.components.registerClass(WelcomeDialog);
    inkdrop.layouts.addComponentToLayout("modal", "WelcomeDialog");

    //console.log(inkdrop.components.classes);
    //console.log(inkdrop.store.getState().layouts);
}

function deactivate() {
    inkdrop.layouts.removeComponentFromLayout("modal", "WelcomeDialog");
    inkdrop.components.deleteClass(WelcomeDialog);
}
