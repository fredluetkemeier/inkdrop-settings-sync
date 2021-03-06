"use babel";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { store } from "./store";
import { gistClient } from "./api/gist-client";
import { getLocalSettings, setLocalSettings } from "./settings";
import { compare } from "./utils/compare";

import keys from "./keys.json";
import { compareArrays } from "./utils/array-compare";

dayjs.extend(utc);

module.exports = { sync };

async function sync() {
    console.log("Syncing settings...");

    const token = store.get(keys.githubAccessToken);
    const gistId = store.get(keys.gistId);

    const remote = await gistClient.get(token, gistId).then((res) => ({
        lastSynced: res.updated_at,
        description: res.description,
        settings: JSON.parse(res.files.settings.content),
    }));
    const localSettings = await getLocalSettings();

    if (compareSettings(localSettings, remote.settings)) {
        console.log("Local is same as remote, no sync needed");
        return Promise.resolve();
    }

    const lastSynced = store.get(keys.lastSynced);
    if (!lastSynced || dayjs(lastSynced).isBefore(remote.lastSynced)) {
        console.log("Remote changes detected, setting them locally..");
        return setLocalSettings(remote.settings);
    }

    console.log("Pushing changes to remote...");

    await gistClient.update(token, gistId, {
        description: remote.description,
        files: {
            settings: {
                content: JSON.stringify(localSettings, null, 2),
            },
        },
    });
}

function compareSettings(
    { themes: localThemes, ...localRest },
    { themes: remoteThemes, ...remoteRest }
) {
    const themesAreEqual = compareArrays(localThemes, remoteThemes);

    return themesAreEqual && compare(localRest, remoteRest);
}
