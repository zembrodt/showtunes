export interface AuthModel {
  token: AuthToken;
  isAuthenticated: boolean;
}

export const DEFAULT_AUTH: AuthModel = {
  token: null,
  isAuthenticated: false
};

export interface AuthToken {
  accessToken: string;
  tokenType: string;
  scope: string;
  expiry: string;
  refreshToken: string;
}
