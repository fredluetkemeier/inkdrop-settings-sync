"use babel";

import open from "open";
import { getVerificationCode, getAccessToken } from "./github-oauth";
import { gistClient } from "./gist-client";
import { store } from "./store";

import WelcomeDialog from "./ui/WelcomeDialog";

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

    inkdrop.commands.add(
        document.body,
        "inkdrop-settings-sync:welcome-modal:ready",
        () => {
            console.log("READY");

            inkdrop.commands.dispatch(
                document.body,
                "inkdrop-settings-sync:welcome-modal:show"
            );
        }
    );

    inkdrop.components.registerClass(WelcomeDialog);
    inkdrop.layouts.addComponentToLayout("modal", "WelcomeDialog");

    console.log(inkdrop.components.classes);
    console.log(inkdrop.store.getState().layouts);
}

function deactivate() {
    inkdrop.layouts.removeComponentFromLayout("modal", "WelcomeDialog");
    inkdrop.components.deleteClass(WelcomeDialog);
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
