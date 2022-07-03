"use babel";

import { compare } from "./utils/compare";

module.exports = {
    getLocalSettings,
    setLocalSettings,
};

async function getLocalSettings() {
    const { user } = await inkdrop.ipm.getInstalled();
    const enabledThemes = await inkdrop.themes.getEnabledThemeNames();

    const installedPackages = user.map(({ name, version, theme = false }) => ({
        name,
        version,
        isTheme: !!theme,
    }));

    return {
        packages: installedPackages,
        themes: enabledThemes,
    };
}

async function setLocalSettings(changed) {
    const current = await getLocalSettings();

    const { packages: currentPackages, themes: currentThemes } = current;
    const { packages: changedPackages, themes: changedThemes } = changed;

    const { added: addedPackages, removed: removedPackages } = packageDiff(
        currentPackages,
        changedPackages
    );
    const { added: addedThemes } = themeDiff(currentThemes, changedThemes);

    // Install added packages
    await Promise.all(
        addedPackages.map(({ name, version, isTheme }) =>
            inkdrop.ipm.install({ name, version, theme: isTheme })
        )
    );

    // Uninstall removed packages
    await Promise.all(
        removedPackages.map(({ name }) => inkdrop.ipm.uninstall({ name }))
    );

    // Enable changed themes
    addedThemes.forEach((theme) => inkdrop.packages.enablePackage(theme));

    // Set themes
    inkdrop.config.settings.core.themes = changedThemes;

    // Apply updated themes to take effect in the GUI
    await inkdrop.themes.activateThemes();
}

function packageDiff(current, changed) {
    const added = changed.filter((x) => !current.some((y) => compare(x, y)));
    const removed = current.filter((x) => !changed.some((y) => compare(x, y)));

    return { added, removed };
}

function themeDiff(current, changed) {
    const added = changed.filter((x) => !current.some((y) => x == y));

    return { added };
}
