"use babel";

const KEY_PREFIX = "inkdrop-settings-sync";

module.exports = {
    store: {
        get,
        set,
        exists,
    },
};

function get(key) {
    const pluginKey = buildKey(key);
    return localStorage.getItem(pluginKey);
}

function set(key, value) {
    const pluginKey = buildKey(key);
    localStorage.setItem(pluginKey, value);
}

function exists(key) {
    return !!get(key);
}

function buildKey(key) {
    return `${KEY_PREFIX}.${key}`;
}
