const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
// Prefer this app's node_modules first, but still allow Metro to walk nested
// package trees for expo-router peers (@expo/metro-runtime, @radix-ui/*, etc.).
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
