"use babel";

module.exports = {
    getLocalSettings,
    setLocalSettings,
};

async function getLocalSettings() {
    const { user } = await inkdrop.ipm.getInstalled();
    const enabledThemes = await inkdrop.themes.getEnabledThemeNames();
    const acrylicEnabled = inkdrop.config.get("core.mainWindow.acrylicEnabled");

    const installedPackages = user
        .filter((x) => !packageIsSelf(x))
        .map(({ name, theme = false }) => ({
            name,
            isTheme: !!theme,
        }));

    return {
        packages: installedPackages,
        themes: enabledThemes,
        acrylicEnabled,
    };
}

async function setLocalSettings(changed) {
    const current = await getLocalSettings();

    const { packages: currentPackages, themes: currentThemes } = current;
    const {
        packages: changedPackages,
        themes: changedThemes,
        acrylicEnabled: changedAcrylicEnabled,
    } = {
        ...changed,
        packages: changed.packages.filter((x) => !packageIsSelf(x)),
    };

    const { added: addedPackages, removed: removedPackages } = packageDiff(
        currentPackages,
        changedPackages
    );
    const { added: addedThemes } = themeDiff(currentThemes, changedThemes);

    // Set application settings
    inkdrop.config.set("core.mainWindow.acrylicEnabled", changedAcrylicEnabled);

    // Install added packages
    await Promise.all(
        addedPackages.map(
            async ({ name, isTheme }) =>
                await inkdrop.ipm
                    .install({ name, theme: isTheme })
                    .then(() => safeActivate({ name, isTheme }))
                    .catch(console.error)
        )
    );

    // Uninstall removed packages
    await Promise.all(
        removedPackages.map(
            async ({ name }) =>
                await inkdrop.ipm.uninstall({ name }).catch(console.error)
        )
    );

    // Enable changed themes
    addedThemes.forEach((theme) => inkdrop.packages.enablePackage(theme));

    // Set themes
    inkdrop.config.settings.core.themes = changedThemes;

    // Apply updated themes to take effect in the GUI
    await inkdrop.themes.activateThemes();
}

function safeActivate({ name, isTheme }) {
    if (isTheme) return;

    const isDisabled = inkdrop.packages.isPackageDisabled(name);
    if (isDisabled) inkdrop.packages.enablePackage(name);
}

function packageIsSelf({ name }) {
    return name == "settings-sync";
}

function packageDiff(current, changed) {
    const added = changed.filter((x) => !current.some((y) => x.name == y.name));
    const removed = current.filter(
        (x) => !changed.some((y) => x.name == y.name)
    );

    return { added, removed };
}

function themeDiff(current, changed) {
    const added = changed.filter((x) => !current.some((y) => x == y));

    return { added };
}
