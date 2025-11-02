module.exports = function(api) {
  api.cache(true);
  
  // For Jest, use a simpler config without reanimated
  if (process.env.NODE_ENV === 'test') {
    return {
      presets: ['babel-preset-expo'],
    };
  }
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // NativeWind v4 uses Metro plugin instead of Babel plugin
      'react-native-reanimated/plugin'
    ],
  };
};

