module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-paper/babel',
  ],
  env: {
    production: {
      plugins: [
        'react-native-paper/babel',
      ],
    },
  },
};