import {SpotifyAuthToken} from './spotify-auth.model';

const SPOTIFY_AUTH_ACTION_NAME = '[Spotify Authentication]';

export class SetAuthToken {
  static readonly type = `${SPOTIFY_AUTH_ACTION_NAME} Set Auth Token`;
  constructor(public token: SpotifyAuthToken) { }
}

export class SetIsAuthenticated {
  static readonly type = `${SPOTIFY_AUTH_ACTION_NAME} Set Is Authenticated`;
  constructor(public isAuthenticated: boolean) { }
}
