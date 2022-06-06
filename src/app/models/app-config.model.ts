export interface IAppConfig {
  env: {
    name: string;
    domain: string;
    spotifyApiUrl: string;
    albumColorUrl: string;
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
