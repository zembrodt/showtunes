export const DISCOGS_AUTH_STATE_NAME = 'SHOWTUNES_DISCOGS_AUTH';

export interface DiscogsAuthModel {
  requestToken: string;
  accessToken: DiscogsAccessToken;
  isAuthenticated: boolean;
}

export const DEFAULT_DISCOGS_AUTH: DiscogsAuthModel = {
  requestToken: null,
  accessToken: null,
  isAuthenticated: false
};

export interface DiscogsAccessToken {
  oauthToken: string;
  oauthTokenSecret: string;
}
