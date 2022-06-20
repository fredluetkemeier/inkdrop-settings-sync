"use babel";

import open from "open";
import { getVerificationCode, getAccessToken } from "./github-oauth";
import { gistClient } from "./gist-client";
import { store } from "./store";

import WelcomeModal from "./components/WelcomeModal";

const CLIENT_ID = "4e584ae2beef0baad913";

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

    inkdrop.components.registerClass(WelcomeModal);
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
    inkdrop.components.deleteClass(WelcomeModal);
}

async function createEmptyGist() {
    const accessToken = store.exists(config.githubAccessToken.title)
        ? store.get(config.githubAccessToken.title)
        : await getVerificationCode(CLIENT_ID).then(
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

    const { id } = await gistClient
        .create(accessToken, {
            files: {},
            description: "test",
            isPublic: false,
        })
        .then((res) => {
            console.log(res);

            return res;
        });
}
