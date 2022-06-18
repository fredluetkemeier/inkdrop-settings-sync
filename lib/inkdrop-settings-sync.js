"use babel";

import open from "open";
import InkdropSettingsSyncMessageDialog from "./components/inkdrop-settings-sync-message-dialog";
import { getVerificationCode, getAccessToken } from "./github-oauth";
import { gistClient } from "./gist-client";

const CLIENT_ID = "4e584ae2beef0baad913";

module.exports = {
    activate,
    deactivate,
};

//
// LIFECYCLE HOOKS
//
async function activate() {
    const accessToken = await getVerificationCode(CLIENT_ID).then(
        ({
            device_code,
            expires_in,
            interval,
            user_code,
            verification_uri,
        }) => {
            open(verification_uri);

            console.log(user_code);

            return getAccessToken({
                clientId: CLIENT_ID,
                deviceCode: device_code,
                interval,
            });
        }
    );

    gistClient.create(accessToken, {
        files: {
            "testFile.md": {
                content: "# Test\ntest",
            },
        },
        description: "test",
        public: false,
    });

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
