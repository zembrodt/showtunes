import { AppConfig } from '../../app.config';

export class SpotifyEndpoints {

  static isInitialized(): boolean {
    return !!AppConfig.settings;
  }

  static getSpotifyApiUrl(): string {
    if (!AppConfig.settings || !AppConfig.settings.env || !AppConfig.settings.env.spotifyApiUrl) {
      console.warn('Retrieving Spotify API URL but it has not been initialized');
      return null;
    }
    return AppConfig.settings.env.spotifyApiUrl;
  }

  static getSpotifyAccountsUrl(): string {
    if (!AppConfig.settings || !AppConfig.settings.env || !AppConfig.settings.env.spotifyAccountsUrl) {
      console.warn('Retrieving Spotify Accounts URL but it has not been initialized');
      return null;
    }
    return AppConfig.settings.env.spotifyAccountsUrl;
  }

  static getUserEndpoint(): string {
    return SpotifyEndpoints.getSpotifyApiUrl() + '/me';
  }

  static getPlaybackEndpoint(): string {
    return SpotifyEndpoints.getUserEndpoint() + '/player';
  }

  static getPlayEndpoint(): string {
    return SpotifyEndpoints.getPlaybackEndpoint() + '/play';
  }

  static getPauseEndpoint(): string {
    return SpotifyEndpoints.getPlaybackEndpoint() + '/pause';
  }

  static getNextEndpoint(): string {
    return SpotifyEndpoints.getPlaybackEndpoint() + '/next';
  }

  static getPreviousEndpoint(): string {
    return SpotifyEndpoints.getPlaybackEndpoint() + '/previous';
  }

  static getVolumeEndpoint(): string {
    return SpotifyEndpoints.getPlaybackEndpoint() + '/volume';
  }

  static getShuffleEndpoint(): string {
    return SpotifyEndpoints.getPlaybackEndpoint() + '/shuffle';
  }

  static getRepeatEndpoint(): string {
    return SpotifyEndpoints.getPlaybackEndpoint() + '/repeat';
  }

  static getSeekEndpoint(): string {
    return SpotifyEndpoints.getPlaybackEndpoint() + '/seek';
  }

  static getDevicesEndpoint(): string {
    return SpotifyEndpoints.getPlaybackEndpoint() + '/devices';
  }

  static getSavedTracksEndpoint(): string {
    return SpotifyEndpoints.getUserEndpoint() + '/tracks';
  }

  static getCheckSavedEndpoint(): string {
    return SpotifyEndpoints.getSavedTracksEndpoint() + '/contains';
  }

  static getPlaylistsEndpoint(): string {
    return SpotifyEndpoints.getSpotifyApiUrl() + '/playlists';
  }

  static getAuthorizeEndpoint(): string {
    return SpotifyEndpoints.getSpotifyAccountsUrl() + '/authorize';
  }

  static getTokenEndpoint(): string {
    return SpotifyEndpoints.getSpotifyAccountsUrl() + '/api/token';
  }
}
