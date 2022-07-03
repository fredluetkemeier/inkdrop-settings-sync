module.exports = {
    cmd,
};

const PLUGIN_NAME = "settings-sync";

function cmd(command) {
    return `${PLUGIN_NAME}:${command}`;
}
