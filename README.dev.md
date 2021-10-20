## SpotifyDisplay Dev Information

### music-display-api
An instance of music-display-api must be running.
The url of this instance must be provided in `src/assets/config/config.dev.json`
under `"auth" / "tokenUrl"`

Example: `"tokenUrl": "https://music-display-api.herokuapp.com/api/auth/tokens"`

### Spotify Callbacks
The Spotify API must have a callback URL for authentications. This cannot be a localhost
running this application locally. One solution for this is to use [ngrok](https://ngrok.com/)
to point an external IP address to your localhost application. To do so:
- Install ngrok, set it up with your account, and configure locally
- Launch ngrok in a command window to point at your Angular app's port (default 4200): `ngrok http 4200`
- Copy the forwarding URL (example: `http://{generated subdomain}.ngrok.io`)
- Add url to `config.dev.json` under `"env" / "domain"`
- Log into Spotify developer dashboard https://developer.spotify.com/dashboard
- Create app or select current one, edit settings, add `{ngrok URL}/callback` under "Redirect URIs" and save
- Launch Angular application as `ng serve --host 0.0.0.0 --disable-host-check`
- Access Angular application with ngrok URL to test changes locally
