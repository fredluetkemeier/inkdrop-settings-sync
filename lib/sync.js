"use babel";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { store } from "./store";
import { gistClient } from "./api/gist-client";
import { getLocalSettings, setLocalSettings } from "./settings";
import R from "ramda";

import keys from "./keys.json";

dayjs.extend(utc);

module.exports = { sync };

async function sync(remote) {
    console.log("Syncing settings...");

    const token = store.get(keys.githubAccessToken);
    const gistId = store.get(keys.gistId);
    const syncThemes = inkdrop.config.get("settings-sync.syncThemes");
    const localSettings = await getLocalSettings();

    if (areSettingsEqual(localSettings, remote.settings, { syncThemes })) {
        console.log("Local is same as remote, no sync needed");
        return Promise.resolve();
    }

    const lastSynced = store.get(keys.lastSynced);

    const isLocalOutOfDate = dayjs
        .utc(lastSynced)
        .isBefore(dayjs.utc(remote.lastSynced));

    if (!lastSynced || isLocalOutOfDate) {
        console.log("Remote changes detected, setting them locally..");
        return setLocalSettings(remote.settings);
    }

    console.log("Pushing changes to remote...");

    return await gistClient.update(token, gistId, {
        description: remote.description,
        files: {
            settings: {
                content: JSON.stringify(
                    filterSyncableProperties(localSettings, { syncThemes }),
                    null,
                    2
                ),
            },
        },
    });
}

function areSettingsEqual(local, remote, { syncThemes }) {
    const comparableLocal = filterSyncableProperties(local, { syncThemes });
    const comparableRemote = filterSyncableProperties(remote, { syncThemes });

    return R.equals(comparableLocal, comparableRemote);
}

function filterSyncableProperties(settings, { syncThemes }) {
    return R.pickBy((_value, key) => {
        if (key === "themes") {
            return syncThemes;
        }

        return true;
    }, settings);
}
