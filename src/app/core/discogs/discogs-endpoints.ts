import { AppConfig } from '../../app.config';

export class DiscogsEndpoints {
  static isInitialized(): boolean {
    return !!AppConfig.settings;
  }

  static getDiscogsOAuthUrl(): string {
    if (!AppConfig.settings || !AppConfig.settings.env || !AppConfig.settings.env.discogsOAuthUrl) {
      console.warn('Retrieving Discogs OAuth API URL but it has not been initialized');
      return null;
    }
    return AppConfig.settings.env.discogsOAuthUrl;
  }

  static getAuthorizeEndpoint(): string {
    return DiscogsEndpoints.getDiscogsOAuthUrl() + '/authorize';
}

  static getRequestTokenEndpoint(): string {
    return DiscogsEndpoints.getDiscogsOAuthUrl() + '/request_token';
  }

  static getAccessTokenEndpoint(): string {
    return DiscogsEndpoints.getDiscogsOAuthUrl() + '/access_token';
  }

  static getIdentityEndpoint(): string {
    return DiscogsEndpoints.getDiscogsOAuthUrl() + '/identity';
  }
}
