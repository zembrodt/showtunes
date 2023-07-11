export interface IAppConfig {
  env: {
    name: string;
    domain: string;
    spotifyApiUrl: string;
  };
  auth: {
    clientId: string;
    clientSecret: string;
    scopes: string;
    tokenUrl: string;
    forcePkce: boolean;
    showDialog: boolean;
  };
  logging: {
    level: string;
  };
}
