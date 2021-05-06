"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withNotificationsAndroid = exports.setNotificationSounds = exports.setNotificationIconColorAsync = exports.setNotificationIconAsync = exports.getNotificationColor = exports.getNotificationIcon = exports.withNotificationSounds = exports.withNotificationManifest = exports.withNotificationIconColor = exports.withNotificationIcons = exports.NOTIFICATION_ICON_COLOR_RESOURCE = exports.NOTIFICATION_ICON_COLOR = exports.NOTIFICATION_ICON_RESOURCE = exports.NOTIFICATION_ICON = exports.META_DATA_NOTIFICATION_ICON_COLOR = exports.META_DATA_NOTIFICATION_ICON = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const Resources_1 = require("@expo/config-plugins/build/android/Resources");
const XML_1 = require("@expo/config-plugins/build/utils/XML");
const image_utils_1 = require("@expo/image-utils");
const fs_1 = require("fs");
const path_1 = require("path");
const { Colors } = config_plugins_1.AndroidConfig;
const { ANDROID_RES_PATH, dpiValues } = config_plugins_1.AndroidConfig.Icon;
const { addMetaDataItemToMainApplication, getMainApplicationOrThrow, removeMetaDataItemFromMainApplication, } = config_plugins_1.AndroidConfig.Manifest;
const BASELINE_PIXEL_SIZE = 24;
const ERROR_MSG_PREFIX = 'An error occurred while configuring Android notifications. ';
exports.META_DATA_NOTIFICATION_ICON = 'expo.modules.notifications.default_notification_icon';
exports.META_DATA_NOTIFICATION_ICON_COLOR = 'expo.modules.notifications.default_notification_color';
exports.NOTIFICATION_ICON = 'notification_icon';
exports.NOTIFICATION_ICON_RESOURCE = `@drawable/${exports.NOTIFICATION_ICON}`;
exports.NOTIFICATION_ICON_COLOR = 'notification_icon_color';
exports.NOTIFICATION_ICON_COLOR_RESOURCE = `@color/${exports.NOTIFICATION_ICON_COLOR}`;
exports.withNotificationIcons = (config, { icon }) => {
    // If no icon provided in the config plugin props, fallback to value from app.json
    icon = icon || getNotificationIcon(config);
    return config_plugins_1.withDangerousMod(config, [
        'android',
        async (config) => {
            await setNotificationIconAsync(config.modRequest.projectRoot, icon);
            return config;
        },
    ]);
};
exports.withNotificationIconColor = (config, { color }) => {
    // If no color provided in the config plugin props, fallback to value from app.json
    color = color || getNotificationColor(config);
    return config_plugins_1.withDangerousMod(config, [
        'android',
        async (config) => {
            await setNotificationIconColorAsync(config.modRequest.projectRoot, color);
            return config;
        },
    ]);
};
exports.withNotificationManifest = (config, { icon, color }) => {
    // If no icon or color provided in the config plugin props, fallback to value from app.json
    icon = icon || getNotificationIcon(config);
    color = color || getNotificationColor(config);
    return config_plugins_1.withAndroidManifest(config, config => {
        config.modResults = setNotificationConfig({ icon, color }, config.modResults);
        return config;
    });
};
exports.withNotificationSounds = (config, { sounds }) => {
    return config_plugins_1.withDangerousMod(config, [
        'android',
        config => {
            setNotificationSounds(config.modRequest.projectRoot, sounds);
            return config;
        },
    ]);
};
function getNotificationIcon(config) {
    var _a;
    return ((_a = config.notification) === null || _a === void 0 ? void 0 : _a.icon) || null;
}
exports.getNotificationIcon = getNotificationIcon;
function getNotificationColor(config) {
    var _a;
    return ((_a = config.notification) === null || _a === void 0 ? void 0 : _a.color) || null;
}
exports.getNotificationColor = getNotificationColor;
/**
 * Applies notification icon configuration for expo-notifications
 */
async function setNotificationIconAsync(projectRoot, icon) {
    if (icon) {
        await writeNotificationIconImageFilesAsync(icon, projectRoot);
    }
    else {
        removeNotificationIconImageFiles(projectRoot);
    }
}
exports.setNotificationIconAsync = setNotificationIconAsync;
function setNotificationConfig(props, manifest) {
    const mainApplication = getMainApplicationOrThrow(manifest);
    if (props.icon) {
        addMetaDataItemToMainApplication(mainApplication, exports.META_DATA_NOTIFICATION_ICON, exports.NOTIFICATION_ICON_RESOURCE, 'resource');
    }
    else {
        removeMetaDataItemFromMainApplication(mainApplication, exports.META_DATA_NOTIFICATION_ICON);
    }
    if (props.color) {
        addMetaDataItemToMainApplication(mainApplication, exports.META_DATA_NOTIFICATION_ICON_COLOR, exports.NOTIFICATION_ICON_COLOR_RESOURCE, 'resource');
    }
    else {
        removeMetaDataItemFromMainApplication(mainApplication, exports.META_DATA_NOTIFICATION_ICON_COLOR);
    }
    return manifest;
}
async function setNotificationIconColorAsync(projectRoot, color) {
    const colorsXmlPath = await Colors.getProjectColorsXMLPathAsync(projectRoot);
    let colorsJson = await Resources_1.readResourcesXMLAsync({ path: colorsXmlPath });
    if (color) {
        const colorItemToAdd = Resources_1.buildResourceItem({ name: exports.NOTIFICATION_ICON_COLOR, value: color });
        colorsJson = Colors.setColorItem(colorItemToAdd, colorsJson);
    }
    else {
        colorsJson = Colors.removeColorItem(exports.NOTIFICATION_ICON_COLOR, colorsJson);
    }
    await XML_1.writeXMLAsync({ path: colorsXmlPath, xml: colorsJson });
}
exports.setNotificationIconColorAsync = setNotificationIconColorAsync;
async function writeNotificationIconImageFilesAsync(icon, projectRoot) {
    await Promise.all(Object.values(dpiValues).map(async ({ folderName, scale }) => {
        const drawableFolderName = folderName.replace('mipmap', 'drawable');
        const dpiFolderPath = path_1.resolve(projectRoot, ANDROID_RES_PATH, drawableFolderName);
        if (!fs_1.existsSync(dpiFolderPath)) {
            fs_1.mkdirSync(dpiFolderPath, { recursive: true });
        }
        const iconSizePx = BASELINE_PIXEL_SIZE * scale;
        try {
            const resizedIcon = (await image_utils_1.generateImageAsync({ projectRoot, cacheType: 'android-notification' }, {
                src: icon,
                width: iconSizePx,
                height: iconSizePx,
                resizeMode: 'cover',
                backgroundColor: 'transparent',
            })).source;
            fs_1.writeFileSync(path_1.resolve(dpiFolderPath, exports.NOTIFICATION_ICON + '.png'), resizedIcon);
        }
        catch (e) {
            throw new Error(ERROR_MSG_PREFIX + 'Encountered an issue resizing Android notification icon: ' + e);
        }
    }));
}
function removeNotificationIconImageFiles(projectRoot) {
    Object.values(dpiValues).forEach(async ({ folderName }) => {
        const drawableFolderName = folderName.replace('mipmap', 'drawable');
        const dpiFolderPath = path_1.resolve(projectRoot, ANDROID_RES_PATH, drawableFolderName);
        fs_1.unlinkSync(path_1.resolve(dpiFolderPath, exports.NOTIFICATION_ICON + '.png'));
    });
}
/**
 * Save sound files to `<project-root>/android/app/src/main/res/raw`
 */
function setNotificationSounds(projectRoot, sounds) {
    if (!Array.isArray(sounds)) {
        throw new Error(ERROR_MSG_PREFIX +
            `Must provide an array of sound files in your app config, found ${typeof sounds}.`);
    }
    for (const soundFileRelativePath of sounds) {
        writeNotificationSoundFile(soundFileRelativePath, projectRoot);
    }
}
exports.setNotificationSounds = setNotificationSounds;
/**
 * Copies the input file to the `<project-root>/android/app/src/main/res/raw` directory if
 * there isn't already an existing file under that name.
 */
function writeNotificationSoundFile(soundFileRelativePath, projectRoot) {
    const rawResourcesPath = path_1.resolve(projectRoot, ANDROID_RES_PATH, 'raw');
    const inputFilename = path_1.basename(soundFileRelativePath);
    if (inputFilename) {
        try {
            const sourceFilepath = path_1.resolve(projectRoot, soundFileRelativePath);
            const destinationFilepath = path_1.resolve(rawResourcesPath, inputFilename);
            if (!fs_1.existsSync(rawResourcesPath)) {
                fs_1.mkdirSync(rawResourcesPath, { recursive: true });
            }
            fs_1.copyFileSync(sourceFilepath, destinationFilepath);
        }
        catch (e) {
            throw new Error(ERROR_MSG_PREFIX + 'Encountered an issue copying Android notification sounds: ' + e);
        }
    }
}
exports.withNotificationsAndroid = (config, { icon = null, color = null, sounds = [] }) => {
    config = exports.withNotificationIconColor(config, { color });
    config = exports.withNotificationIcons(config, { icon });
    config = exports.withNotificationManifest(config, { icon, color });
    config = exports.withNotificationSounds(config, { sounds });
    return config;
};
