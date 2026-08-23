const { validateReleaseEnvironment } = require('./release-env');

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  // Expo/EAS loads environment variables before evaluating dynamic config.
  // Refuse accidental local-to-production connections and mismatched store
  // build configuration before native build or Metro bundling begins.
  validateReleaseEnvironment(process.env);

  return {
    ...require('./app.json').expo,
    ...config,
  };
};
