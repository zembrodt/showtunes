import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { AppConfig } from './app.config';
import { getTestAppConfig } from './core/testing/test-models';

const IDLE_POLLING_DEFAULT = 3000;
const PLAYBACK_POLLING_DEFAULT = 1000;
const THROTTLE_DELAY_DEFAULT = 1000;
const EXPIRY_THRESHOLD_DEFAULT = 0;

describe('AppConfig', () => {
  let appConfig: AppConfig;
  let http: HttpClient;

  beforeEach(() => {
    AppConfig.settings = null;
    TestBed.configureTestingModule({
      providers: [
        AppConfig,
        MockProvider(HttpClient)
      ]
    });
    appConfig = TestBed.inject(AppConfig);
    http = TestBed.inject(HttpClient);

    http.get = jasmine.createSpy().and.returnValue(of(null));
  });

  it('should be truthy', () => {
    expect(appConfig).toBeTruthy();
  });

  it('should return true for env initialized when env is set', () => {
    AppConfig.settings = getTestAppConfig();
    expect(AppConfig.isEnvInitialized()).toBeTrue();
  });

  it('should return false for env initialized when env is null', () => {
    AppConfig.settings = getTestAppConfig();
    AppConfig.settings.env = null;
    expect(AppConfig.isEnvInitialized()).toBeFalse();
  });

  it('should return false for env initialized when settings is null', () => {
    AppConfig.settings = null;
    expect(AppConfig.isEnvInitialized()).toBeFalse();
  });

  it('should return true for auth initialized when auth is set', () => {
    AppConfig.settings = getTestAppConfig();
    expect(AppConfig.isAuthInitialized()).toBeTrue();
  });

  it('should return false for auth initialized when auth is null', () => {
    AppConfig.settings = getTestAppConfig();
    AppConfig.settings.auth = null;
    expect(AppConfig.isAuthInitialized()).toBeFalse();
  });

  it('should return false for auth initialized when settings is null', () => {
    AppConfig.settings = null;
    expect(AppConfig.isAuthInitialized()).toBeFalse();
  });

  it('should resolve when a valid config is loaded', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {},
      auth: {}
    }));
    appConfig.load().then(() => expect(AppConfig.settings).toBeTruthy());
  });

  it('should reject the promise when an error occurs loading the config', () => {
    http.get = jasmine.createSpy().and.throwError('test-error');
    appConfig.load().catch((err) => {
      expect(err).toBeTruthy();
      expect(AppConfig.settings).toBeFalsy();
    });
  });

  it('should set all values of the AppConfig', () => {
    const expectedName = 'test-name';
    const expectedDomain = 'test-domain';
    const expectedSpotifyApiUrl = 'test-spotify-api';
    const expectedSpotifyAccountsUrl = 'test-spotify-accounts';
    const expectedPlaybackPolling = 5;
    const expectedIdlePolling = 10;
    const expectedClientId = 'test-client-id';
    const expectedClientSecret = 'test-client-secret';
    const expectedScopes = 'test-scopes';
    const expectedTokenUrl = 'test-token-url';
    const expectedForcePkce = true;
    const expectedShowDialog = true;
    const expectedExpiryThreshold = 20;
    const expectedLoggingLevel = 'test-log-level';

    http.get = jasmine.createSpy().and.returnValue(of({
      env: {
        name: expectedName,
        domain: expectedDomain,
        spotifyApiUrl: expectedSpotifyApiUrl,
        spotifyAccountsUrl: expectedSpotifyAccountsUrl,
        playbackPolling: expectedPlaybackPolling,
        idlePolling: expectedIdlePolling
      },
      auth: {
        clientId: expectedClientId,
        clientSecret: expectedClientSecret,
        scopes: expectedScopes,
        tokenUrl: expectedTokenUrl,
        forcePkce: expectedForcePkce,
        showDialog: expectedShowDialog,
        expiryThreshold: expectedExpiryThreshold
      },
      logging: {
        level: expectedLoggingLevel
      }
    }));

    appConfig.load().then(() => {
      expect(AppConfig.settings.env.name).toEqual(expectedName);
      expect(AppConfig.settings.env.domain).toEqual(expectedDomain);
      expect(AppConfig.settings.env.spotifyApiUrl).toEqual(expectedSpotifyApiUrl);
      expect(AppConfig.settings.env.spotifyAccountsUrl).toEqual(expectedSpotifyAccountsUrl);
      expect(AppConfig.settings.env.playbackPolling).toEqual(expectedPlaybackPolling);
      expect(AppConfig.settings.env.idlePolling).toEqual(expectedIdlePolling);
      expect(AppConfig.settings.auth.clientId).toEqual(expectedClientId);
      expect(AppConfig.settings.auth.clientSecret).toEqual(expectedClientSecret);
      expect(AppConfig.settings.auth.scopes).toEqual(expectedScopes);
      expect(AppConfig.settings.auth.tokenUrl).toEqual(expectedTokenUrl);
      expect(AppConfig.settings.auth.forcePkce).toEqual(expectedForcePkce);
      expect(AppConfig.settings.auth.showDialog).toEqual(expectedShowDialog);
      expect(AppConfig.settings.auth.expiryThreshold).toEqual(expectedExpiryThreshold);
      expect(AppConfig.settings.logging.level).toEqual(expectedLoggingLevel);
    });
  });

  it('should handle idlePolling as a number', () => {
    const expectedValue = 10;
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {
        idlePolling: expectedValue
      },
      auth: {}
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.env.idlePolling).toEqual(expectedValue);
    });
  });

  it('should parse idlePolling to an int', () => {
    const expectedValue = 10;
    const strValue = '10';
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {
        idlePolling: strValue
      },
      auth: {}
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.env.idlePolling).toEqual(expectedValue);
    });
  });

  it('should handle idlePolling as an invalid string and set to default value', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {
        idlePolling: 'test'
      },
      auth: {}
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.env.idlePolling).toEqual(IDLE_POLLING_DEFAULT);
    });
  });

  it('should handle idlePolling as an invalid type and set to default value', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {
        idlePolling: {}
      },
      auth: {}
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.env.idlePolling).toEqual(IDLE_POLLING_DEFAULT);
    });
  });

  it('should handle an absent idlePolling and set to default value', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {},
      auth: {}
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.env.idlePolling).toEqual(IDLE_POLLING_DEFAULT);
    });
  });

  it('should handle playbackPolling as a number', () => {
    const expectedValue = 10;
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {
        playbackPolling: expectedValue
      },
      auth: {}
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.env.playbackPolling).toEqual(expectedValue);
    });
  });

  it('should parse playbackPolling to an int', () => {
    const expectedValue = 10;
    const strValue = '10';
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {
        playbackPolling: strValue
      },
      auth: {}
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.env.playbackPolling).toEqual(expectedValue);
    });
  });

  it('should handle playbackPolling as an invalid string and set to default value', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {
        playbackPolling: 'test'
      },
      auth: {}
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.env.playbackPolling).toEqual(PLAYBACK_POLLING_DEFAULT);
    });
  });

  it('should handle playbackPolling as an invalid type and set to default value', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {
        playbackPolling: {}
      },
      auth: {}
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.env.playbackPolling).toEqual(PLAYBACK_POLLING_DEFAULT);
    });
  });

  it('should handle an absent playbackPolling and set to default value', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {},
      auth: {}
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.env.playbackPolling).toEqual(PLAYBACK_POLLING_DEFAULT);
    });
  });

  it('should parse throttleDelay to an int', () => {
    const expectedValue = 10;
    const strValue = '10';
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {
        throttleDelay: strValue
      },
      auth: {}
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.env.throttleDelay).toEqual(expectedValue);
    });
  });

  it('should handle throttleDelay as an invalid string and set to default value', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {
        throttleDelay: 'test'
      },
      auth: {}
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.env.throttleDelay).toEqual(THROTTLE_DELAY_DEFAULT);
    });
  });

  it('should handle throttleDelay as an invalid type and set to default value', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {
        throttleDelay: {}
      },
      auth: {}
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.env.throttleDelay).toEqual(THROTTLE_DELAY_DEFAULT);
    });
  });

  it('should handle an absent throttleDelay and set to default value', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {},
      auth: {}
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.env.throttleDelay).toEqual(THROTTLE_DELAY_DEFAULT);
    });
  });

  it('should handle forcePkce as a boolean', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {},
      auth: {
        forcePkce: true
      }
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.auth.forcePkce).toBeTrue();
    });
  });

  it('should parse forcePkce to a boolean', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {},
      auth: {
        forcePkce: 'True'
      }
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.auth.forcePkce).toBeTrue();
    });
  });

  it('should handle forcePkce as an invalid string to be false', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {},
      auth: {
        forcePkce: 'test'
      }
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.auth.forcePkce).toBeFalse();
    });
  });

  it('should handle forcePkce as an invalid type to be false', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {},
      auth: {
        forcePkce: {}
      }
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.auth.forcePkce).toBeFalse();
    });
  });

  it('should handle an absent forcePkce to be false', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {},
      auth: {}
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.auth.forcePkce).toBeFalse();
    });
  });

  it('should handle showDialog as a boolean', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {},
      auth: {
        showDialog: true
      }
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.auth.showDialog).toBeTrue();
    });
  });

  it('should parse showDialog to a boolean', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {},
      auth: {
        showDialog: 'True'
      }
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.auth.showDialog).toBeTrue();
    });
  });

  it('should handle showDialog as an invalid string to be false', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {},
      auth: {
        showDialog: 'test'
      }
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.auth.showDialog).toBeFalse();
    });
  });

  it('should handle showDialog as an invalid type to be false', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {},
      auth: {
        showDialog: {}
      }
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.auth.showDialog).toBeFalse();
    });
  });

  it('should handle an absent showDialog to be false', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {},
      auth: {}
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.auth.showDialog).toBeFalse();
    });
  });

  it('should handle expiryThreshold as a number', () => {
    const expectedValue = 10;
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {},
      auth: {
        expiryThreshold: expectedValue
      }
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.auth.expiryThreshold).toEqual(expectedValue);
    });
  });

  it('should parse expiryThreshold to an int', () => {
    const expectedValue = 10;
    const strValue = '10';
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {},
      auth: {
        expiryThreshold: strValue
      }
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.auth.expiryThreshold).toEqual(expectedValue);
    });
  });

  it('should handle expiryThreshold as an invalid string and set to default value', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {},
      auth: {
        expiryThreshold: 'test'
      }
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.auth.expiryThreshold).toEqual(EXPIRY_THRESHOLD_DEFAULT);
    });
  });

  it('should handle expiryThreshold as an invalid type and set to default value', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {},
      auth: {
        expiryThreshold: {}
      }
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.auth.expiryThreshold).toEqual(EXPIRY_THRESHOLD_DEFAULT);
    });
  });

  it('should handle an absent expiryThreshold and set to default value', () => {
    http.get = jasmine.createSpy().and.returnValue(of({
      env: {},
      auth: {}
    }));
    appConfig.load().then(() => {
      expect(AppConfig.settings.auth.expiryThreshold).toEqual(EXPIRY_THRESHOLD_DEFAULT);
    });
  });
});
