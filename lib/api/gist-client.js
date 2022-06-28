"use babel";

module.exports = {
    gistClient: { create, list, get },
};

const GIST_BASE_URL = "https://api.github.com/gists";
const GIST_CONTENT_TYPE = "application/vnd.github.v3+json";

async function create(token, { files, description, isPublic }) {
    return fetch(GIST_BASE_URL, {
        method: "POST",
        headers: {
            Accept: GIST_CONTENT_TYPE,
            Authorization: `token ${token}`,
        },
        body: JSON.stringify({
            files,
            description,
            isPublic,
        }),
    }).then((res) => jsonFromRes(res, 201));
}

async function list(token) {
    return fetch(GIST_BASE_URL, {
        method: "GET",
        headers: {
            Accept: GIST_CONTENT_TYPE,
            Authorization: `token ${token}`,
        },
    }).then(jsonFromRes);
}

async function get(token, id) {
    return fetch(`${GIST_BASE_URL}/${id}`, {
        method: "GET",
        headers: {
            Accept: GIST_CONTENT_TYPE,
            Authorization: `token ${token}`,
        },
    }).then(jsonFromRes);
}

function jsonFromRes(res, successCode = 200) {
    if (res.status != successCode) throw new Error(res.status);

    return res.json();
}
