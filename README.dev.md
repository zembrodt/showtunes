## ShowTunes Dev Information

### Spotify Callbacks
The Spotify API must have a callback URL for authentications. This CAN be done via localhost.

- Add url (`http://localhost:{port}` for example) to `config.dev.json` under `"env" / "domain"`
- Log into Spotify developer dashboard https://developer.spotify.com/dashboard
- Create app or select current one, edit settings, add `{domain URL}/callback` under "Redirect URIs" and save

### Launching the application
- Launch Angular application as `ng serve --disable-host-check`
- Access Angular application with the localhost URL to test changes locally

### Testing the application
- Use `ng test` to run all unit tests
- Use `ng test --include='**/{directory}/*.spec.ts` to run all tests within a specific directory
