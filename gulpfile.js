const gulp = require('gulp');
const fs = require('fs');

gulp.task('generate-config', () => {
  return new Promise((resolve, reject) => {

    // Get current environment
    let env = 'dev'; // default environment
    if ('SHOWTUNES_ENV' in process.env) {
      env = process.env.SHOWTUNES_ENV;
    }

    let configJson = {};
    // Get values from current config file if exists
    const configFilepath = `./src/assets/config/config.${env}.json`;
    if (fs.existsSync(configFilepath)) {
      configJson = JSON.parse(fs.readFileSync(configFilepath));
      console.log('In gulp :: Read from file: ' + JSON.stringify(configJson));
    }

    // Check config objects exist
    if (!configJson.env) {
      configJson.env = {};
    }
    if (!configJson.auth) {
      configJson.auth = {};
    }

    // Overwrite config with environment variables
    if ('SHOWTUNES_DOMAIN' in process.env) {
      configJson.env.domain = process.env.SHOWTUNES_DOMAIN;
    }
    if ('SHOWTUNES_SPOTIFY_API_URL' in process.env) {
      configJson.env.spotifyApiUrl = process.env.SHOWTUNES_SPOTIFY_API_URL;
    }
    if ('SHOWTUNES_ALBUM_COLOR_URL' in process.env) {
      configJson.env.albumColorUrl = process.env.SHOWTUNES_ALBUM_COLOR_URL;
    }
    if ('SHOWTUNES_CLIENT_ID' in process.env) {
      configJson.auth.clientId = process.env.SHOWTUNES_CLIENT_ID;
    }
    if ('SHOWTUNES_CLIENT_SECRET' in process.env) {
      configJson.auth.clientSecret = process.env.SHOWTUNES_CLIENT_SECRET;
    }
    if ('SHOWTUNES_TOKEN_URL' in process.env) {
      configJson.auth.tokenUrl = process.env.SHOWTUNES_TOKEN_URL;
    }
    if ('SHOWTUNES_DIRECT_REQ' in process.env) {
      configJson.auth.isDirectSpotifyRequest = process.env.SHOWTUNES_DIRECT_REQ === 'true';
    }
    console.log('In gulp :: After OS Env: ' + JSON.stringify(configJson));

    if (!configJson.env.name) {
      configJson.env.name = env;
    }

    // Rewrite json config to dist
    fs.writeFileSync(`./dist/showtunes/assets/config/config.${env}.json`, JSON.stringify(configJson));
    resolve();
  });
});
