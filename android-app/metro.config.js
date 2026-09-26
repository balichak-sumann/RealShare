const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable Package Exports for better compatibility with modern packages
config.resolver.unstable_enablePackageExports = true;
config.resolver.sourceExts.push('mjs', 'cjs', 'jsx', 'js', 'tsx', 'ts');

module.exports = config;
