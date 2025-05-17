module.exports = {
  env: {
    'react-native/react-native': true,
  },
  root: true,
  extends: '@react-native',
  rules: {
    'react-native/no-inline-styles': 'off',
    'react/no-unstable-nested-components': 'off',
    'quotes': ['single', 'double', { avoidEscape: true }],
    'no-unused-vars': ['warn'],
  },
};