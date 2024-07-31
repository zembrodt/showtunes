import { expect } from '@angular/flex-layout/_private-utils/testing';
import { AppConfig } from '../../app.config';
import { getTestAppConfig } from '../testing/test-responses';
import { SpotifyEndpoints } from './spotify-endpoints';

describe('SpotifyEndpoints', () => {
  beforeEach(() => {
    AppConfig.settings = getTestAppConfig();
    spyOn(console, 'warn');
  });

  it('should be initialized if AppConfig.settings is set', () => {
    expect(SpotifyEndpoints.isInitialized()).toBeTrue();
  });

  it('should not be initialized if AppConfig.settings is not set', () => {
    AppConfig.settings = null;
    expect(SpotifyEndpoints.isInitialized()).toBeFalse();

    AppConfig.settings = undefined;
    expect(SpotifyEndpoints.isInitialized()).toBeFalse();
  });

  it('should return the spotifyApiUrl when set', () => {
    expect(SpotifyEndpoints.getSpotifyApiUrl()).toEqual(AppConfig.settings.env.spotifyApiUrl);
  });

  it('should log a warning when the spotifyApiUrl is not set', () => {
    AppConfig.settings = null;
    expect(SpotifyEndpoints.getSpotifyApiUrl()).toBeNull();

    AppConfig.settings = getTestAppConfig();
    AppConfig.settings.env = null;
    expect(SpotifyEndpoints.getSpotifyApiUrl()).toBeNull();

    AppConfig.settings = getTestAppConfig();
    AppConfig.settings.env.spotifyApiUrl = null;
    expect(SpotifyEndpoints.getSpotifyApiUrl()).toBeNull();

    expect(console.warn).toHaveBeenCalledTimes(3);
  });

  it('should return the spotifyAccountsUrl when set', () => {
    expect(SpotifyEndpoints.getSpotifyAccountsUrl()).toEqual(AppConfig.settings.env.spotifyAccountsUrl);
  });

  it('should log a warning when the spotifyAccountsUrl is not set', () => {
    AppConfig.settings = null;
    expect(SpotifyEndpoints.getSpotifyAccountsUrl()).toBeNull();

    AppConfig.settings = getTestAppConfig();
    AppConfig.settings.env = null;
    expect(SpotifyEndpoints.getSpotifyAccountsUrl()).toBeNull();

    AppConfig.settings = getTestAppConfig();
    AppConfig.settings.env.spotifyAccountsUrl = null;
    expect(SpotifyEndpoints.getSpotifyAccountsUrl()).toBeNull();

    expect(console.warn).toHaveBeenCalledTimes(3);
  });
});
