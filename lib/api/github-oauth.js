"use babel";

import queryString from "query-string";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

module.exports = {
    getVerificationCode,
    getAccessToken,
};

function getVerificationCode(clientId) {
    const qs = queryString.stringify({
        client_id: clientId,
        scope: "gist",
    });

    return fetch(`https://github.com/login/device/code?${qs}`, {
        method: "POST",
        headers: {
            Accept: "application/json",
        },
    })
        .then((res) => {
            if (res.status != 200)
                throw new Error(
                    "POST to get device/user verification codes FAILED"
                );

            return res.json();
        })
        .catch(console.error);
}

function getAccessToken({ clientId, deviceCode, interval, expiresIn }) {
    let pollingRate = interval * 1000;
    let accessToken = null;

    const expiryUtc = dayjs.utc().add(expiresIn, "seconds");

    return new Promise(async (resolve, reject) => {
        await poll(
            async () =>
                await fetchAccessToken({ clientId, deviceCode })
                    .then((result) => {
                        if (result.access_token)
                            accessToken = result.access_token;

                        if (result.error == "slow_down")
                            pollingRate = result.interval * 1000;
                    })
                    .catch(reject),
            () => pollingRate,
            () => !!accessToken || dayjs.utc().isAfter(expiryUtc)
        );

        if (dayjs.utc().isAfter(expiryUtc)) reject("expired");

        resolve(accessToken);
    });
}

function fetchAccessToken({ clientId, deviceCode }) {
    const qs = queryString.stringify({
        client_id: clientId,
        device_code: deviceCode,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    });

    return fetch(`https://github.com/login/oauth/access_token?${qs}`, {
        method: "POST",
        headers: {
            Accept: "application/json",
        },
    }).then((res) => {
        if (res.status != 200)
            throw new Error("POST to get access token FAILED");

        return res.json();
    });
}

async function poll(fn, delayOrDelayCallback, shouldStopPolling = () => false) {
    do {
        await fn();

        if (await shouldStopPolling()) {
            break;
        }

        const delay =
            typeof delayOrDelayCallback === "number"
                ? delayOrDelayCallback
                : delayOrDelayCallback();
        await new Promise((resolve) => setTimeout(resolve, Math.max(0, delay)));
    } while (!(await shouldStopPolling()));
}
