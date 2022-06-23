module.exports = {};

async function getInstalledPackages() {
    const installedPackages = inkdrop.ipm.getInstalled().then(console.log);
}

async function installPackage(pluginName, isTheme, version = null) {
    return inkdrop.ipm.install({ name: pluginName, version, theme: isTheme });
}
