module.exports = {
    cmd,
};

const PLUGIN_NAME = "inkdrop-settings-sync";

function cmd(command) {
    return `${PLUGIN_NAME}:${command}`;
}
