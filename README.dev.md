## SpotifyDisplay Dev Information

### music-display-api
An instance of music-display-api must be running.
The url of this instance must be provided in `src/assets/config/config.dev.json`
under `"auth" / "tokenUrl"`

Example: `"tokenUrl": "https://music-display-api.herokuapp.com/api/auth/tokens"`

### Spotify Callbacks
The Spotify API must have a callback URL for authentications. This CAN be done via localhost,
but can also be done using a tool such as [ngrok](https://ngrok.com/) to point an external IP
to your localhost port.

To use ngrok:
- Install ngrok, set it up with your account, and configure locally
- Launch ngrok in a command window to point at your Angular app's port (default 4200): `ngrok http 4200`
- Copy the forwarding URL (example: `http://{generated subdomain}.ngrok.io`) for config

To launch the application:
- Add url (either `http://localhost:{port}` or ngrok url) to `config.dev.json` under `"env" / "domain"`
- Log into Spotify developer dashboard https://developer.spotify.com/dashboard
- Create app or select current one, edit settings, add `{ngrok/localhost URL}/callback` under "Redirect URIs" and save
- Add the Client ID from Spotify developer dashboard in config file as `"auth" / "clientId"`
- Launch Angular application as `ng serve --disable-host-check`
  - Add parameter `--host 0.0.0.0` if using ngrok
- Access Angular application with ngrok or localhost URL to test changes locally
