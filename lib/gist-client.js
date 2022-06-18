module.exports = {
    gistClient: { create },
};

const GIST_BASE_URL = "https://api.github.com/gists";

async function create(token, { files, description, public }) {
    return fetch(GIST_BASE_URL, {
        method: "POST",
        headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `token ${token}`,
        },
        body: JSON.stringify({
            files,
            description,
            public,
        }),
    });
}
