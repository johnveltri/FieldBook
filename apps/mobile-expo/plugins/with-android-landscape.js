const { AndroidConfig, withAndroidManifest } = require('@expo/config-plugins');

const SCREEN_ORIENTATION_ATTRIBUTE = 'android:screenOrientation';

function setMainActivityOrientationUnspecified(androidManifest) {
  const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(androidManifest);
  mainActivity.$[SCREEN_ORIENTATION_ATTRIBUTE] = 'unspecified';
  return androidManifest;
}

/**
 * Keep the global Expo orientation locked to portrait for iOS while allowing
 * Android tablets and phones to use the device's current orientation.
 */
function withAndroidLandscape(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults = setMainActivityOrientationUnspecified(config.modResults);
    return config;
  });
}

module.exports = withAndroidLandscape;
module.exports.setMainActivityOrientationUnspecified = setMainActivityOrientationUnspecified;
