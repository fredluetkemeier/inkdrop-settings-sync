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
    return inkdrop.config.get(pluginKey);
}

function set(key, value) {
    const pluginKey = buildKey(key);
    inkdrop.config.set(pluginKey, value);
}

function exists(key) {
    return !!get(key);
}

function buildKey(key) {
    return `${KEY_PREFIX}.${key}`;
}
