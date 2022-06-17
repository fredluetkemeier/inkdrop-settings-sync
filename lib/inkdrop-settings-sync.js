"use babel";

import open from "open";
import { GistClient } from "gist-client";
import InkdropSettingsSyncMessageDialog from "./components/inkdrop-settings-sync-message-dialog";
import { getVerificationCode } from "./github-oauth";

module.exports = {
    activate,
    deactivate,
};

// Lifecycle hooks
function activate() {
    //const gistClient = new GistClient();
    //gistClient.getOneById("6884f7e5fc92f9a9af5b5a3a16e0a79c").then(console.log);

    //open("https://google.com");

    getVerificationCode().then(
        ({
            device_code,
            expires_in,
            interval,
            user_code,
            verification_uri,
        }) => {
            open(verification_uri);
        }
    );

    inkdrop.components.registerClass(InkdropSettingsSyncMessageDialog);
    inkdrop.layouts.addComponentToLayout(
        "modal",
        "InkdropSettingsSyncMessageDialog"
    );
}

function deactivate() {
    inkdrop.layouts.removeComponentFromLayout(
        "modal",
        "InkdropSettingsSyncMessageDialog"
    );
    inkdrop.components.deleteClass(InkdropSettingsSyncMessageDialog);
}
