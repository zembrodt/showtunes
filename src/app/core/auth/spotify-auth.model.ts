export const SPOTIFY_AUTH_STATE_NAME = 'SHOWTUNES_SPOTIFY_AUTH';

export interface SpotifyAuthModel {
  token: SpotifyAuthToken;
  isAuthenticated: boolean;
}

export const DEFAULT_SPOTIFY_AUTH: SpotifyAuthModel = {
  token: null,
  isAuthenticated: false
};

export interface SpotifyAuthToken {
  accessToken: string;
  tokenType: string;
  scope: string;
  expiry: Date;
  refreshToken: string;
}
