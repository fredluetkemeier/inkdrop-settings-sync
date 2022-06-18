"use babel";

import open from "open";
import { GistClient } from "gist-client";
import InkdropSettingsSyncMessageDialog from "./components/inkdrop-settings-sync-message-dialog";
import { getVerificationCode, getAccessToken } from "./github-oauth";

const CLIENT_ID = "4e584ae2beef0baad913";

module.exports = {
    activate,
    deactivate,
};

//
// LIFECYCLE HOOKS
//
async function activate() {
    //const gistClient = new GistClient();
    //gistClient.getOneById("6884f7e5fc92f9a9af5b5a3a16e0a79c").then(console.log);

    //open("https://google.com");

    const accessToken = await getVerificationCode(CLIENT_ID).then(
        ({
            device_code,
            expires_in,
            interval,
            user_code,
            verification_uri,
        }) => {
            console.log("USER_CODE", user_code);

            open(verification_uri);

            return getAccessToken({
                clientId: CLIENT_ID,
                deviceCode: device_code,
                interval,
            });
        }
    );

    console.log(accessToken);

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
