"use babel";

module.exports = {
    gistClient: { create },
};

const GIST_BASE_URL = "https://api.github.com/gists";

async function create(token, { files, description, isPublic }) {
    return fetch(GIST_BASE_URL, {
        method: "POST",
        headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `token ${token}`,
        },
        body: JSON.stringify({
            files,
            description,
            isPublic,
        }),
    }).then((res) => {
        if (res.status != 201) throw new Error(res);

        return res.json();
    });
}
