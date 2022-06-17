"use babel";

import queryString from "query-string";
import { poll } from "poll";

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

function getAccessToken({ clientId, deviceCode, interval }) {
    const qs = queryString.stringify({
        client_id: clientId,
        device_code: deviceCode,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    });

    return new Promise((resolve, reject) => {
        // let pollingRate = (interval + 1) * 1000;
        let pollingRate = 1000;

        const userConfirmInterval = setInterval(() => {
            fetch(`https://github.com/login/oauth/access_token?${qs}`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                },
            })
                .then((res) => {
                    if (res.status != 200)
                        throw new Error("POST to get access token FAILED");

                    return res.json();
                })
                .then((result) => {
                    if (result.access_token) return result.access_token;

                    if (result.error == "slow_down")
                        pollingRate = result.interval * 1000;
                })
                .catch(reject);
        }, pollingRate);
    });
}

function refresh() {}
