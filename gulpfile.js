gulp.task('generate-service-worker', function(callback) {
    var path = require('path');
    var swPrecache = require('sw-precache');
    var rootDir = 'ratp-pwa';
  
    swPrecache.write(path.join(rootDir, 'sw.js'), {
      staticFileGlobs: [rootDir + '/**/*.{js,html,css,png,jpg,gif}'],
      stripPrefix: rootDir
    }, callback);
  });