module.exports = {
    getVerificationCode,
};

function getVerificationCode() {
    const queryString = "client_id=4e584ae2beef0baad913&scope=gist";

    return fetch(`https://github.com/login/device/code?${queryString}`, {
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
