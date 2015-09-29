module.exports = function(config) {
  config.set({
    browsers: ['Chrome'],
    frameworks: ['jasmine'],
    files: [
      'www/scripts/js/**/*.js',
      'test/**/*js'
    ]
  });
};