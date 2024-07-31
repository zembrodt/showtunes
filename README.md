# ShowTunes

[![Netlify Status](https://api.netlify.com/api/v1/badges/cdba6611-162b-41e3-a14e-bef25c09dfce/deploy-status)](https://app.netlify.com/sites/showtunes/deploys)
[![CircleCI Status](https://circleci.com/gh/zembrodt/showtunes.svg?branch=develop&style=shield)](https://app.circleci.com/pipelines/github/zembrodt/showtunes?branch=main&filter=all)
[![codecov](https://codecov.io/gh/zembrodt/showtunes/branch/main/graph/badge.svg?token=6K7HVKV1UG)](https://codecov.io/gh/zembrodt/showtunes)

Angular web application used to display your currently playing Spotify track with a web player.

Application deployed to https://showtunes.app.

Feel free to open a ticket if any issues are found.

## Authentication

Three methods are supported for Spotify authentication:
* PKCE (recommended)
* Non-PKCE (not recommended)
* Backend server

### PKCE

Send auth token requests directly to Spotify's authorization endpoint.

This will be the default authentication method if nothing is configured. It will also be used if `"auth" / "tokenUrl"` and `"auth" / "clientSecret"` are not set or
`"auth" / "forcePkce"` is set to `true`.

Required configurations will be:
- `"auth" / "cliendId"` - always required
- `"env" / "domain"` - needed to create callback URL
- `"auth" / "scopes"` - API scopes to give ShowTunes access to

This method is the recommended authentication method from Spotify and follows their flow outlines in: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow. 

### Non-PKCE (not recommended)

Send auth token requests directly to Spotify's authorization endpoint.

This will be set as the authentication method if `"auth" / "clientSecret"` is configured, `"auth" / "tokenUrl"` is not configured, and `"auth" / "forcePkce"` is set to `false`.

The required configurations will be the same as PCKE, along with `clientSecret`:
- `"auth" / "cliendId"`
- `"auth" / "clientSecret"`
- `"env" / "domain"`
- `"auth" / "scopes"`

This method is not recommended by Spotify. It should not be used in production to reveal access to your Spotify client secret.
See https://developer.spotify.com/documentation/web-api/tutorials/code-flow for the flow used.

### Backend Server

A backend server can be used (an example implementation is provided at https://github.com/zembrodt/showtunes-api). 
With this method, only the Spotify API client ID is needed to be stored in this application, with the client secret stored on the backend server.

The authentication API calls need to match requests/responses used with the official Spotify API. The only difference
is the official Spotify API returns an authentication token with the value `expires_in` as an integer value for the amount of time in milliseconds until
the token expires. This application also supports a response using `expiry` instead, as a string date for when the token will expire. The backend server can respond with either value.

The backend server will be set as the authentication method if `"auth" / "tokenUrl"` is configured and `"auth" / "forcePkce"` is set to `false`.

The required configurations will be the same as PKCE, with the addition of the third party URL as `tokenUrl`:
- `"auth" / "cliendId"`
- `"auth" / "tokenUrl"` - the full endpoint URL for the third party token endpoint
- `"env" / "domain"`
- `"auth" / "scopes"`

## Configurations

The config model can be found in the file `app-config-model.ts`. The config will be set up in a json file located in `src/assets/config`.
The name of the file needs to follow the format `config.{env_name}.json` where `env_name` is set in the environment variable `SHOWTUNES_ENV`.
If this environment variable is not set, the default value of `dev` will be used.

Explanation of configurations (**^** denotes required config): 
- `"env"`
  - `"name"` - (*string*) the name of the environment
  - **^**`"domain"` - (*string*) the domain this app is running on
  - **^**`"spotifyApiUrl"` - (*string*) Spotify's API url
  - **^**`"spotifyAccountsUrl"` - (*string*) Spotify's Accounts url
  - `"playbackPolling"` - (*number*) polling interval (in ms) to Spotify when a track is currently playing (default: 1000)
  - `"idlePolling"` -(*number*) polling interval (in ms) to Spotify when no track is currently playing (default: 5000)
- `"auth"`
  - **^**`"clientId"` (*string*) the client ID for accessing Spotify's API
  - `"clientSecret"` - (*string*) the client secret for accessing Spotify's API (if using non-PKCE method)
  - **^**`"scopes"` - (*string*) space-separated list of API Spotify scopes needed to grant the application access during OAuth 
  - `"tokenUrl"` - (*string*) the 3rd party backend URL for authentication if not using direct authorization with Spotify
  - `"forcePkce"` - (*boolean*) used to force the application to use PKCE for authentication disregarding what other configs are set
  - `"showDialog"` - (*boolean*) determines if Spotify's OAuth page is opened in a new window or not
  - `"expiryThreshold"` - (*number*) the threshold (in ms) between the current time and an auth token's expiry time to attempt to refresh the token before it expires (default: 0)

These configurations can also be set as environment variables instead of a json file. The names for each config will be `SHOWTUNES_{configName}` where `configName` will be in
upper camel case. For example: `spotifyApiUrl` as an environment variable will be `SHOWTUNES_SPOTIFY_API_URL`.
See `gulpfile.js` for exact usage.

Environment variables will always overwrite anything in the config file.

## Deployment

When deploying the application, run the command `npm run build -- -c {environment}`.

Current possible environments:
- `production`
- `staging`

Omitting the environment configuration will default to a development release.
