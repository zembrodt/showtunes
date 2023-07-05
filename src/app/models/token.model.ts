export interface TokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expiry: string;
  expires_in: number;
  refresh_token: string;
}
