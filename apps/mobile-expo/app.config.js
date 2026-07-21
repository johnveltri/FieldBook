const { validateReleaseEnvironment } = require('./release-env');

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  // Expo/EAS loads .env files before evaluating dynamic config. Refuse to
  // generate a store build when a developer-local override points at a local
  // backend or enables analytics' rich debug payloads.
  validateReleaseEnvironment(process.env);

  return {
    ...require('./app.json').expo,
    ...config,
  };
};
