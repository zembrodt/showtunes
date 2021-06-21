const gulp = require('gulp');
const fs = require('fs');

gulp.task('generate-config', () => {
  return new Promise((resolve, reject) => {

    // Get current environment
    let env = 'dev'; // default environment
    if ('MD_ENV' in process.env) {
      env = process.env.MD_ENV;
    }

    let configJson = {};
    // Get values from current config file if exists
    const configFile = fs.readFileSync(`./src/assets/config/config.${env}.json`);
    if (configFile) {
      configJson = JSON.parse(configFile);
      console.log('In gulp :: Read from file: ' + JSON.stringify(configJson));
    }
    // Overwrite config with environment variables
    if ('MD_DOMAIN' in process.env) {
      configJson.env.domain = process.env.MD_DOMAIN;
    }
    if ('MD_CLIENT_ID' in process.env) {
      configJson.auth.clientId = process.env.MD_CLIENT_ID;
    }
    if ('MD_CLIENT_SECRET' in process.env) {
      configJson.auth.clientSecret = process.env.MD_CLIENT_SECRET;
    }
    if ('MD_TOKEN_URL' in process.env) {
      configJson.auth.tokenUrl = process.env.MD_TOKEN_URL;
    }
    if ('MD_DIRECT_REQ' in process.env) {
      configJson.auth.isDirectSpotifyRequest = process.env.MD_DIRECT_REQ === 'true';
    }
    console.log('In gulp :: After OS Env: ' + JSON.stringify(configJson));
    // Rewrite json config to dist
    fs.writeFileSync(`./dist/music-display/assets/config/config.${env}.json`, JSON.stringify(configJson));
    resolve();
  });
});
