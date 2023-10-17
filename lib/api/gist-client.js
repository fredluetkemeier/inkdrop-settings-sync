"use babel";

module.exports = {
    gistClient: { create, list, get, update },
};

const GIST_BASE_URL = "https://api.github.com/gists";
const GIST_CONTENT_TYPE = "application/vnd.github.v3+json";

async function create(token, { files, description, isPublic }) {
    return fetch(GIST_BASE_URL, {
        method: "POST",
        headers: buildHeaders(token),
        body: JSON.stringify({
            files,
            description,
            isPublic,
        }),
    }).then((res) => jsonFromRes(res, 201));
}

async function list(token, { perPage = null, page = null, since = null } = {}) {
    const qs = new URLSearchParams({ per_page: perPage, page, since });
    qs.forEach((value, key) => {
        const parsedValue = JSON.parse(value);

        if (parsedValue === null || parsedValue === "") {
            qs.delete(key);
        }
    });

    return fetch(`${GIST_BASE_URL}?${qs.toString()}`, {
        method: "GET",
        headers: buildHeaders(token),
        cache: "no-cache",
    }).then(jsonFromRes);
}

async function get(token, id) {
    return fetch(`${GIST_BASE_URL}/${id}`, {
        method: "GET",
        headers: buildHeaders(token),
        cache: "no-cache",
    }).then(jsonFromRes);
}

async function update(token, id, { files, description }) {
    return fetch(`${GIST_BASE_URL}/${id}`, {
        method: "PATCH",
        headers: buildHeaders(token),
        body: JSON.stringify({
            files,
            description,
        }),
    }).then(jsonFromRes);
}

function buildHeaders(token) {
    return {
        Accept: GIST_CONTENT_TYPE,
        Authorization: `token ${token}`,
    };
}

function jsonFromRes(res, successCode = 200) {
    if (res.status != successCode) return Promise.reject(res);

    return res.json();
}
