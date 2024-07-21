export interface IAppConfig {
  env: {
    name?: string;
    domain: string;
    spotifyApiUrl: string;
    spotifyAccountsUrl: string;
    playbackPolling?: number;
    idlePolling?: number;
  };
  auth: {
    clientId: string;
    clientSecret?: string;
    scopes: string;
    tokenUrl?: string;
    forcePkce?: boolean;
    showDialog?: boolean;
    expiryThreshold?: number;
  };
  logging?: {
    level: string;
  };
}
