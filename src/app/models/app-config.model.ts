export interface IAppConfig {
  env: {
    name: string;
    domain: string;
  };
  auth: {
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
    isDirectSpotifyRequest: boolean;
  };
  logging: {
    level: string;
  };
}
