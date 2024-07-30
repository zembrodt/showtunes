/* tslint:disable:no-string-literal */
import { HttpClient, HttpHeaders, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { Router } from '@angular/router';
import { NgxsModule, Store } from '@ngxs/store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { AppConfig } from '../../../app.config';
import { SetAuthToken } from '../../../core/auth/auth.actions';
import { AuthToken } from '../../../core/auth/auth.model';
import { SetPlayerState } from '../../../core/playback/playback.actions';
import { PlayerState } from '../../../core/playback/playback.model';
import { SpotifyEndpoints } from '../../../core/spotify/spotify-endpoints';
import { NgxsSelectorMock } from '../../../core/testing/ngxs-selector-mock';
import { getTestAuthToken } from '../../../core/testing/test-models';
import { getTestAppConfig } from '../../../core/testing/test-responses';
import { generateErrorResponse, generateResponse } from '../../../core/testing/test-util';
import { AuthType, SpotifyAPIResponse } from '../../../core/types';
import { StorageService } from '../../storage/storage.service';
import { SpotifyAuthService } from './spotify-auth.service';
import anything = jasmine.anything;

describe('SpotifyAuthService', () => {
  const mockSelectors = new NgxsSelectorMock<SpotifyAuthService>();
  let service: SpotifyAuthService;
  let http: HttpClient;
  let router: Router;
  let store: Store;
  let storage: StorageService;

  let tokenProducer: BehaviorSubject<AuthToken>;

  beforeEach(() => {
    AppConfig.settings = getTestAppConfig();
    SpotifyAuthService.initialize();

    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([], {developmentMode: true}),
        HttpClientTestingModule
      ],
      providers: [
        SpotifyAuthService,
        MockProvider(HttpClient),
        MockProvider(Router),
        MockProvider(Store),
        MockProvider(StorageService)
      ]
    });
    service = TestBed.inject(SpotifyAuthService);
    http = TestBed.inject(HttpClient);
    router = TestBed.inject(Router);
    store = TestBed.inject(Store);
    storage = TestBed.inject(StorageService);

    tokenProducer = mockSelectors.defineNgxsSelector<AuthToken>(service, 'authToken$', getTestAuthToken());

    service.initSubscriptions();
    spyOn(console, 'error');
    spyOn(console, 'warn');
    store.dispatch = jasmine.createSpy().and.returnValue(of(null));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fail to initialize if no configured clientId', () => {
    AppConfig.settings.auth.clientId = null;
    expect(SpotifyAuthService.initialize()).toBeFalse();
    expect(console.error).toHaveBeenCalled();
  });

  it('should set tokenUrl on initialization when configured', () => {
    AppConfig.settings.auth.tokenUrl = 'test-token-url';
    expect(SpotifyAuthService.initialize()).toBeTrue();
    expect(SpotifyAuthService['tokenUrl']).toBeTruthy();
  });

  it('should set clientSecret on initialization when configured', () => {
    AppConfig.settings.auth.clientSecret = 'test-client-secret';
    expect(SpotifyAuthService.initialize()).toBeTrue();
    expect(SpotifyAuthService['clientSecret']).toBeTruthy();
  });

  it('should set scopes on initialization when configured', () => {
    expect(SpotifyAuthService.initialize()).toBeTrue();
    expect(SpotifyAuthService['scopes']).toBeTruthy();
  });

  it('should set showAuthDialog on initialization when configured', () => {
    expect(SpotifyAuthService.initialize()).toBeTrue();
    expect(SpotifyAuthService['showAuthDialog']).toBeTrue();
  });

  it('should set auth type to PKCE if no configured tokenUrl and clientSecret', () => {
    expect(SpotifyAuthService.initialize()).toBeTrue();
    expect(SpotifyAuthService['authType']).toEqual(AuthType.PKCE);
  });

  it('should set auth type to PKCE if forcePkce is true', () => {
    AppConfig.settings.auth.forcePkce = true;
    expect(SpotifyAuthService.initialize()).toBeTrue();
    expect(SpotifyAuthService['authType']).toEqual(AuthType.PKCE);
  });

  it('should set auth type to ThirdParty if tokenUrl is configured and clientSecret not configured', () => {
    AppConfig.settings.auth.tokenUrl = 'test-token-url';
    expect(SpotifyAuthService.initialize()).toBeTrue();
    expect(SpotifyAuthService['authType']).toEqual(AuthType.ThirdParty);
  });

  it('should set auth type to Secret if tokenUrl not configured and clientSecret is configured', () => {
    AppConfig.settings.auth.clientSecret = 'test-client-secret';
    expect(SpotifyAuthService.initialize()).toBeTrue();
    expect(SpotifyAuthService['authType']).toEqual(AuthType.Secret);
  });

  it('should fail to initialize if no configured spotifyApiUrl', () => {
    AppConfig.settings.env.spotifyApiUrl = null;
    expect(SpotifyAuthService.initialize()).toBeFalse();
    expect(console.error).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  it('should fail to initialize if no configured spotifyAccountsUrl', () => {
    AppConfig.settings.env.spotifyAccountsUrl = null;
    expect(SpotifyAuthService.initialize()).toBeFalse();
    expect(console.error).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  it('should fail to initialize if no configured domain', () => {
    AppConfig.settings.env.domain = null;
    expect(SpotifyAuthService.initialize()).toBeFalse();
    expect(console.error).toHaveBeenCalled();
  });

  it('should fail to initialize if issue retrieving AppConfig', () => {
    AppConfig.settings.env = null;
    expect(SpotifyAuthService.initialize()).toBeFalse();
    expect(console.error).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();

    AppConfig.settings.auth = null;
    expect(SpotifyAuthService.initialize()).toBeFalse();
    expect(console.error).toHaveBeenCalled();

    AppConfig.settings = null;
    expect(SpotifyAuthService.initialize()).toBeFalse();
    expect(console.error).toHaveBeenCalled();
  });

  it('should add Authorization header when requesting auth token and auth type is secret', fakeAsync(() => {
    SpotifyAuthService['authType'] = AuthType.Secret;
    http.post = jasmine.createSpy().and.returnValue(of(new HttpResponse({body: {}, status: HttpStatusCode.Ok, statusText: 'OK'})));

    service.requestAuthToken('test-code', false);
    flushMicrotasks();
    expect(http.post).toHaveBeenCalledOnceWith(
      jasmine.any(String),
      jasmine.any(URLSearchParams),
      {
        headers: new HttpHeaders().set(
          'Content-Type', 'application/x-www-form-urlencoded'
        ).set(
          'Authorization', `Basic ${new Buffer(`${SpotifyAuthService['clientId']}:${SpotifyAuthService['clientSecret']}`).toString('base64')}`
        ),
        observe: 'response'
      });
  }));

  it('should NOT add Authorization header when requesting auth token and auth type is PKCE', fakeAsync(() => {
    SpotifyAuthService['authType'] = AuthType.PKCE;
    http.post = jasmine.createSpy().and.returnValue(of(new HttpResponse({body: {}, status: HttpStatusCode.Ok, statusText: 'OK'})));

    service.requestAuthToken('test-code', false);
    flushMicrotasks();
    expect(http.post).toHaveBeenCalledOnceWith(
      jasmine.any(String),
      jasmine.any(URLSearchParams),
      {
        headers: new HttpHeaders().set(
          'Content-Type', 'application/x-www-form-urlencoded'
        ),
        observe: 'response'
      });
  }));

  it('should NOT add Authorization header when requesting auth token and auth type is ThirdParty', fakeAsync(() => {
    SpotifyAuthService['authType'] = AuthType.ThirdParty;
    SpotifyAuthService['tokenUrl'] = 'test-token-url';
    http.post = jasmine.createSpy().and.returnValue(of(new HttpResponse({body: {}, status: HttpStatusCode.Ok, statusText: 'OK'})));

    service.requestAuthToken('test-code', false);
    flushMicrotasks();
    expect(http.post).toHaveBeenCalledOnceWith(
      jasmine.any(String),
      jasmine.any(URLSearchParams),
      {
        headers: new HttpHeaders().set(
          'Content-Type', 'application/x-www-form-urlencoded'
        ),
        observe: 'response'
      });
  }));

  it(`should use Spotify's token endpoint if auth type is PKCE when requesting an auth token`, fakeAsync(() => {
    SpotifyAuthService['authType'] = AuthType.PKCE;
    http.post = jasmine.createSpy().and.returnValue(of(new HttpResponse({body: {}, status: HttpStatusCode.Ok, statusText: 'OK'})));

    service.requestAuthToken('test-code', false);
    flushMicrotasks();
    expect(http.post).toHaveBeenCalledOnceWith(
      SpotifyEndpoints.getTokenEndpoint(),
      jasmine.any(URLSearchParams),
      jasmine.any(Object)
    );
  }));

  it(`should use Spotify's token endpoint if auth type is Secret when requesting an auth token`, fakeAsync(() => {
    SpotifyAuthService['authType'] = AuthType.Secret;
    http.post = jasmine.createSpy().and.returnValue(of(new HttpResponse({body: {}, status: HttpStatusCode.Ok, statusText: 'OK'})));

    service.requestAuthToken('test-code', false);
    flushMicrotasks();
    expect(http.post).toHaveBeenCalledOnceWith(
      SpotifyEndpoints.getTokenEndpoint(),
      jasmine.any(URLSearchParams),
      jasmine.any(Object)
    );
  }));

  it(`should use the configured token URL endpoint is auth type is ThirdParty when requesting an auth token`, fakeAsync(() => {
    SpotifyAuthService['authType'] = AuthType.ThirdParty;
    http.post = jasmine.createSpy().and.returnValue(of(new HttpResponse({body: {}, status: HttpStatusCode.Ok, statusText: 'OK'})));

    service.requestAuthToken('test-code', false);
    flushMicrotasks();
    expect(http.post).toHaveBeenCalledOnceWith(
      SpotifyAuthService['tokenUrl'],
      jasmine.any(URLSearchParams),
      jasmine.any(Object)
    );
  }));

  it('should send correct request parameters for requesting a new auth token', fakeAsync(() => {
    service['codeVerifier'] = 'test-code-verifier';
    http.post = jasmine.createSpy().and.returnValue(of(new HttpResponse({body: {}, status: HttpStatusCode.Ok, statusText: 'OK'})));
    const expectedBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: SpotifyAuthService['clientId'],
      code: 'test-code',
      redirect_uri: SpotifyAuthService['redirectUri'],
      code_verifier: 'test-code-verifier'
    });

    service.requestAuthToken('test-code', false);
    flushMicrotasks();
    expect(http.post).toHaveBeenCalledOnceWith(
      jasmine.any(String),
      expectedBody,
      jasmine.any(Object)
    );
  }));

  it('should send correct request parameters for refreshing an existing auth token', fakeAsync(() => {
    http.post = jasmine.createSpy().and.returnValue(of(new HttpResponse({body: {}, status: HttpStatusCode.Ok, statusText: 'OK'})));
    const expectedBody = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: SpotifyAuthService['clientId'],
      refresh_token: 'test-code'
    });

    service.requestAuthToken('test-code', false);
    flushMicrotasks();
    expect(http.post).toHaveBeenCalledOnceWith(
      jasmine.any(String),
      expectedBody,
      jasmine.any(Object)
    );
  }));

  it('should set the auth token with response from requesting a new auth token and handle expires_in response', fakeAsync(() => {
    const response = new HttpResponse({
      body: {
        access_token: 'test-access-token',
        token_type: 'test-type',
        expires_in: Date.now(),
        scope: 'test-scope',
        refresh_token: 'test-refresh-token'
      },
      status: HttpStatusCode.Ok,
      statusText: 'OK'
    });
    http.post = jasmine.createSpy().and.returnValue(of(response));

    service.requestAuthToken('test-code', false);
    flushMicrotasks();
    expect(http.post).toHaveBeenCalledOnceWith(
      jasmine.any(String),
      jasmine.any(URLSearchParams),
      jasmine.any(Object)
    );
    const expiryResponse = new Date();
    expiryResponse.setSeconds(expiryResponse.getSeconds() + response.body.expires_in);
    expect(store.dispatch).toHaveBeenCalledWith(new SetAuthToken({
      accessToken: response.body.access_token,
      tokenType: response.body.token_type,
      scope: response.body.scope,
      expiry: expiryResponse,
      refreshToken: response.body.refresh_token
    }));
  }));

  it('should set the auth token with response from requesting a new auth token using third party and handle expiry response',
    fakeAsync(() => {
      SpotifyAuthService['authType'] = AuthType.ThirdParty;
      SpotifyAuthService['tokenUrl'] = 'test-token-url';
      const response = new HttpResponse({
        body: {
          access_token: 'test-access-token',
          token_type: 'test-type',
          expiry: new Date().toString(),
          scope: 'test-scope',
          refresh_token: 'test-refresh-token'
        },
        status: HttpStatusCode.Ok,
        statusText: 'OK'
      });
      http.post = jasmine.createSpy().and.returnValue(of(response));

      service.requestAuthToken('test-code', false);
      flushMicrotasks();
      expect(http.post).toHaveBeenCalledOnceWith(
        jasmine.any(String),
        jasmine.any(URLSearchParams),
        jasmine.any(Object)
      );
      expect(store.dispatch).toHaveBeenCalledWith(new SetAuthToken({
        accessToken: response.body.access_token,
        tokenType: response.body.token_type,
        scope: response.body.scope,
        expiry: new Date(response.body.expiry),
        refreshToken: response.body.refresh_token
      }));
    }));

  it('should set the auth token with response from requesting a new auth token using third party and handle expires_in response',
    fakeAsync(() => {
      SpotifyAuthService['authType'] = AuthType.ThirdParty;
      SpotifyAuthService['tokenUrl'] = 'test-token-url';
      const response = new HttpResponse({
        body: {
          access_token: 'test-access-token',
          token_type: 'test-type',
          expires_in: Date.now(),
          scope: 'test-scope',
          refresh_token: 'test-refresh-token'
        },
        status: HttpStatusCode.Ok,
        statusText: 'OK'
      });
      http.post = jasmine.createSpy().and.returnValue(of(response));

      service.requestAuthToken('test-code', false);
      flushMicrotasks();
      expect(http.post).toHaveBeenCalledOnceWith(
        jasmine.any(String),
        jasmine.any(URLSearchParams),
        jasmine.any(Object)
      );
      const expiryResponse = new Date();
      expiryResponse.setSeconds(expiryResponse.getSeconds() + response.body.expires_in);
      expect(store.dispatch).toHaveBeenCalledWith(new SetAuthToken({
        accessToken: response.body.access_token,
        tokenType: response.body.token_type,
        scope: response.body.scope,
        expiry: expiryResponse,
        refreshToken: response.body.refresh_token
      }));
    }));

  it('should output error when requestAuthToken fails', fakeAsync(() => {
    http.post = jasmine.createSpy().and.returnValue(throwError({status: HttpStatusCode.MethodNotAllowed}));
    let error;
    service.requestAuthToken('test-code', false)
      .catch((err) => error = err);
    flushMicrotasks();
    expect(error).toBeTruthy();
    expect(http.post).toHaveBeenCalled();
    expect(store.dispatch).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  }));

  it('should create the authorize request url with correct params when auth type is Secret', fakeAsync(() => {
    SpotifyAuthService['authType'] = AuthType.Secret;
    service['state'] = 'test-state';
    const expectedParams = new URLSearchParams({
      response_type: 'code',
      client_id: SpotifyAuthService['clientId'],
      scope: 'test-scope',
      redirect_uri: `${AppConfig.settings.env.domain}/callback`,
      state: 'test-state',
      show_dialog: 'true'
    });
    const expectedUrl = `${SpotifyEndpoints.getAuthorizeEndpoint()}?${expectedParams.toString()}`;
    let actualUrl;
    service.getAuthorizeRequestUrl().then((url) => actualUrl = url);

    flushMicrotasks();
    expect(actualUrl).toEqual(expectedUrl);
  }));

  it('should create the authorize request url with code challenge params when auth type is PKCE', fakeAsync(() => {
    spyOn(window.crypto.subtle, 'digest').and.returnValue(Promise.resolve(new ArrayBuffer(8)));
    service['state'] = 'test-state';
    service['codeVerifier'] = 'test-code-verifier';
    const expectedParams = new URLSearchParams({
      response_type: 'code',
      client_id: SpotifyAuthService['clientId'],
      scope: 'test-scope',
      redirect_uri: `${AppConfig.settings.env.domain}/callback`,
      state: 'test-state',
      show_dialog: 'true',
      code_challenge_method: 'S256',
      code_challenge: 'AAAAAAAAAAA'
    });
    const expectedUrl = `${SpotifyEndpoints.getAuthorizeEndpoint()}?${expectedParams.toString()}`;
    let actualUrl;
    service.getAuthorizeRequestUrl().then((url) => actualUrl = url);

    flushMicrotasks();
    expect(actualUrl).toEqual(expectedUrl);
  }));

  it('should compare states to true when current state not null and equal', () => {
    service['state'] = 'test-state';
    expect(service.compareState('test-state')).toBeTrue();
  });

  it('should compare states to false when current state not null and not equal', () => {
    expect(service.compareState('blah')).toBeFalse();
  });

  it('should compare states to false when current state is null and passed state not null', () => {
    service['state'] = null;
    expect(service.compareState('blah')).toBeFalse();
  });

  it('should compare states to false when current state is null and passed state is null', () => {
    service['state'] = null;
    expect(service.compareState(null)).toBeFalse();
  });

  it('should compare states to false when current state is undefined and passed state not null', () => {
    service['state'] = undefined;
    expect(service.compareState('blah')).toBeFalse();
  });

  it('should compare states to false when current state is undefined and passed state is undefined', () => {
    service['state'] = undefined;
    expect(service.compareState(undefined)).toBeFalse();
  });

  it('should remove all state and auth token values on logout', () => {
    service['state'] = 'test-state';
    service.logout();
    expect(store.dispatch).toHaveBeenCalledWith(new SetAuthToken(null));
    expect(service['state']).toBeNull();
    expect(service['codeVerifier']).toBeNull();
    expect(service['authToken']).toBeNull();
    expect(storage.remove).toHaveBeenCalledOnceWith(SpotifyAuthService['STATE_KEY']);
    expect(storage.removeAuthToken).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('should get current state if not null', () => {
    service['state'] = 'test-state';
    storage.get = jasmine.createSpy();
    expect(service['getState']()).toEqual('test-state');
    expect(storage.get).not.toHaveBeenCalled();
  });

  it('should set state from storage if exists', () => {
    service['state'] = null;
    storage.get = jasmine.createSpy().withArgs(SpotifyAuthService['STATE_KEY']).and.returnValue('test-state');
    service['setState']();
    expect(service['state']).toEqual('test-state');
  });

  it('should generate new state and save to storage if it does not exist in storage', () => {
    service['state'] = null;
    storage.get = jasmine.createSpy().withArgs('STATE').and.returnValue(null);
    service['setState']();
    expect(service['state']).toMatch(`^[A-Za-z0-9]{${SpotifyAuthService['STATE_LENGTH']}}$`);
    expect(storage.set).toHaveBeenCalledWith(SpotifyAuthService['STATE_KEY'], service['state']);
  });

  it('should get current codeVerifier if not null', () => {
    service['codeVerifier'] = 'test-code-verifier';
    storage.get = jasmine.createSpy();
    expect(service['getCodeVerifier']()).toEqual('test-code-verifier');
    expect(storage.get).not.toHaveBeenCalled();
  });

  it('should set codeVerifier from storage if exists', () => {
    service['codeVerifier'] = null;
    storage.get = jasmine.createSpy().withArgs(SpotifyAuthService['CODE_VERIFIER_KEY']).and.returnValue('test-code-verifier');
    service['setCodeVerifier']();
    expect(service['codeVerifier']).toEqual('test-code-verifier');
  });

  it('should generate new codeVerifier and save to storage if it does not exist in storage', () => {
    service['codeVerifier'] = null;
    storage.get = jasmine.createSpy().withArgs(SpotifyAuthService['CODE_VERIFIER_KEY']).and.returnValue(null);
    service['setCodeVerifier']();
    expect(service['codeVerifier']).toBeTruthy();
    expect(storage.set).toHaveBeenCalledWith(SpotifyAuthService['CODE_VERIFIER_KEY'], service['codeVerifier']);
  });

  it('should reauthenticate when error response is an expired token', fakeAsync(() => {
    spyOn(service, 'requestAuthToken').and.returnValue(Promise.resolve(null));
    const expiredToken = {
      ...getTestAuthToken(),
      expiry: new Date(Date.UTC(1999, 1, 1))
    };
    tokenProducer.next(expiredToken);
    let apiResponse;
    service.checkErrorResponse(generateErrorResponse(HttpStatusCode.Unauthorized)).then((response) => apiResponse = response);

    flushMicrotasks();
    expect(service.requestAuthToken).toHaveBeenCalledWith(expiredToken.refreshToken, true);
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlayerState(PlayerState.Refreshing));
    expect(apiResponse).toEqual(SpotifyAPIResponse.ReAuthenticated);
  }));

  it('should logout when an error occurs requesting a new auth token after auth token has expired', fakeAsync(() => {
    spyOn(service, 'requestAuthToken').and.returnValue(Promise.reject('test-error'));
    spyOn(service, 'logout');
    const expiredToken = {
      ...getTestAuthToken(),
      expiry: new Date(Date.UTC(1999, 1, 1))
    };
    tokenProducer.next(expiredToken);
    let apiResponse;
    service.checkErrorResponse(generateErrorResponse(HttpStatusCode.Unauthorized)).then((response) => apiResponse = response);

    flushMicrotasks();
    expect(service.requestAuthToken).toHaveBeenCalledWith(expiredToken.refreshToken, true);
    expect(console.error).toHaveBeenCalledOnceWith(jasmine.any(String));
    expect(service.logout).toHaveBeenCalled();
    expect(apiResponse).toEqual(SpotifyAPIResponse.Error);
  }));

  it('should reject the promise when no refresh token is present after auth token has expired', fakeAsync(() => {
    spyOn(service, 'requestAuthToken');
    spyOn(service, 'logout');
    const expiredToken = {
      ...getTestAuthToken(),
      refreshToken: null
    };
    tokenProducer.next(expiredToken);
    let apiError;
    service.checkErrorResponse(generateErrorResponse(HttpStatusCode.Unauthorized)).catch((err) => apiError = err);

    flushMicrotasks();
    expect(service.requestAuthToken).not.toHaveBeenCalled();
    expect(service.logout).not.toHaveBeenCalled();
    expect(apiError).not.toBeNull();
  }));

  it('should reject the promise when no auth token is present after auth token has expired', fakeAsync(() => {
    spyOn(service, 'requestAuthToken');
    spyOn(service, 'logout');
    tokenProducer.next(null);
    let apiError;
    service.checkErrorResponse(generateErrorResponse(HttpStatusCode.Unauthorized)).catch((err) => apiError = err);

    flushMicrotasks();
    expect(service.requestAuthToken).not.toHaveBeenCalled();
    expect(service.logout).not.toHaveBeenCalled();
    expect(apiError).not.toBeNull();
  }));

  it('should logout when error response is a bad OAuth request and cannot re-authenticate', fakeAsync(() => {
    http.get = jasmine.createSpy().and.returnValue(of(generateResponse({}, HttpStatusCode.Forbidden)));
    spyOn(service, 'logout');
    let apiResponse;
    service.checkErrorResponse(generateErrorResponse(HttpStatusCode.Forbidden)).then((response) => apiResponse = response);

    flushMicrotasks();
    expect(service.logout).toHaveBeenCalled();
    expect(http.get).toHaveBeenCalledWith(SpotifyEndpoints.getUserEndpoint(), anything());
    expect(console.error).toHaveBeenCalled();
    expect(apiResponse).toEqual(SpotifyAPIResponse.Error);
  }));

  it('should not logout when error response is a bad OAuth request and can still authenticate', fakeAsync(() => {
    http.get = jasmine.createSpy().and.returnValue(of(generateResponse({}, HttpStatusCode.Ok)));
    spyOn(service, 'logout');
    let apiResponse;
    service.checkErrorResponse(generateErrorResponse(HttpStatusCode.Forbidden)).then((response) => apiResponse = response);

    flushMicrotasks();
    expect(service.logout).not.toHaveBeenCalled();
    expect(http.get).toHaveBeenCalledWith(SpotifyEndpoints.getUserEndpoint(), anything());
    expect(apiResponse).toEqual(SpotifyAPIResponse.Error);
  }));

  it('should not logout when error response is a bad OAuth request for a violated restriction', fakeAsync(() => {
    spyOn(service, 'logout');
    let apiResponse;
    service.checkErrorResponse(generateErrorResponse(HttpStatusCode.Forbidden, 'Restriction Violated'))
      .then((response) => apiResponse = response);

    flushMicrotasks();
    expect(service.logout).not.toHaveBeenCalled();
    expect(http.get).not.toHaveBeenCalled();
    expect(apiResponse).toEqual(SpotifyAPIResponse.Restricted);
  }));

  it('should not logout when error response is Spotify rate limits exceeded and cannot re-authenticate', fakeAsync(() => {
    http.get = jasmine.createSpy().and.returnValue(of(generateResponse({}, HttpStatusCode.Forbidden)));
    spyOn(service, 'logout');
    let apiResponse;
    service.checkErrorResponse(generateErrorResponse(HttpStatusCode.TooManyRequests)).then((response) => apiResponse = response);

    flushMicrotasks();
    expect(service.logout).toHaveBeenCalled();
    expect(http.get).toHaveBeenCalledWith(SpotifyEndpoints.getUserEndpoint(), anything());
    expect(console.error).toHaveBeenCalledTimes(2);
    expect(apiResponse).toEqual(SpotifyAPIResponse.Error);
  }));

  it('should logout when error response is Spotify rate limits exceeded and can still authenticate', fakeAsync(() => {
    http.get = jasmine.createSpy().and.returnValue(of(generateResponse({}, HttpStatusCode.Ok)));
    spyOn(service, 'logout');
    let apiResponse;
    service.checkErrorResponse(generateErrorResponse(HttpStatusCode.TooManyRequests)).then((response) => apiResponse = response);

    flushMicrotasks();
    expect(service.logout).not.toHaveBeenCalled();
    expect(http.get).toHaveBeenCalledWith(SpotifyEndpoints.getUserEndpoint(), anything());
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(apiResponse).toEqual(SpotifyAPIResponse.Error);
  }));

  it('should logout when error response is unknown and cannot re-authenticate', fakeAsync(() => {
    http.get = jasmine.createSpy().and.returnValue(of(generateResponse({}, HttpStatusCode.Forbidden)));
    spyOn(service, 'logout');
    let apiResponse;
    service.checkErrorResponse(generateErrorResponse(HttpStatusCode.NotFound)).then((response) => apiResponse = response);

    flushMicrotasks();
    expect(service.logout).toHaveBeenCalled();
    expect(http.get).toHaveBeenCalledWith(SpotifyEndpoints.getUserEndpoint(), anything());
    expect(console.error).toHaveBeenCalledTimes(2);
    expect(apiResponse).toEqual(SpotifyAPIResponse.Error);
  }));

  it('should not logout when error response is unknown and can still authenticate', fakeAsync(() => {
    http.get = jasmine.createSpy().and.returnValue(of(generateResponse({}, HttpStatusCode.Ok)));
    spyOn(service, 'logout');
    let apiResponse;
    service.checkErrorResponse(generateErrorResponse(HttpStatusCode.NotFound)).then((response) => apiResponse = response);

    flushMicrotasks();
    expect(service.logout).not.toHaveBeenCalled();
    expect(http.get).toHaveBeenCalledWith(SpotifyEndpoints.getUserEndpoint(), anything());
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(apiResponse).toEqual(SpotifyAPIResponse.Error);
  }));

  it('should refresh auth token when expiry is within the threshold', fakeAsync(() => {
    spyOn(service, 'requestAuthToken').and.returnValue(Promise.resolve());
    spyOn(service, 'logout');
    const date = new Date();
    date.setMilliseconds(date.getMilliseconds() + AppConfig.settings.auth.expiryThreshold);
    const authToken = {
      ...getTestAuthToken(),
      expiry: date
    };
    tokenProducer.next(authToken);
    let apiResponse;
    service.checkAuthTokenWithinExpiryThreshold().then((response) => apiResponse = response);

    flushMicrotasks();
    expect(service.requestAuthToken).toHaveBeenCalled();
    expect(service.logout).not.toHaveBeenCalled();
    expect(apiResponse).toEqual(SpotifyAPIResponse.ReAuthenticated);
  }));

  it('should refresh auth token when token is already expired', fakeAsync(() => {
    spyOn(service, 'requestAuthToken').and.returnValue(Promise.resolve());
    spyOn(service, 'logout');
    const date = new Date();
    date.setMilliseconds(date.getMilliseconds() - AppConfig.settings.auth.expiryThreshold);
    const authToken = {
      ...getTestAuthToken(),
      expiry: date
    };
    tokenProducer.next(authToken);
    let apiResponse;
    service.checkAuthTokenWithinExpiryThreshold().then((response) => apiResponse = response);

    flushMicrotasks();
    expect(service.requestAuthToken).toHaveBeenCalled();
    expect(service.logout).not.toHaveBeenCalled();
    expect(apiResponse).toEqual(SpotifyAPIResponse.ReAuthenticated);
  }));

  it('should reject the promise when no expiry date is present on the token', fakeAsync(() => {
    spyOn(service, 'requestAuthToken');
    spyOn(service, 'logout');
    const authToken = {
      ...getTestAuthToken(),
      expiry: null
    };
    tokenProducer.next(authToken);
    let apiError;
    service.checkAuthTokenWithinExpiryThreshold().catch((err) => apiError = err);

    flushMicrotasks();
    expect(service.requestAuthToken).not.toHaveBeenCalled();
    expect(service.logout).not.toHaveBeenCalled();
    expect(apiError).not.toBeNull();
  }));

  it('should not refresh the auth token when it is not within the expiry', fakeAsync(() => {
    spyOn(service, 'requestAuthToken');
    spyOn(service, 'logout');
    const date = new Date();
    date.setMilliseconds(date.getMilliseconds() + (2 * AppConfig.settings.auth.expiryThreshold));
    const authToken = {
      ...getTestAuthToken(),
      expiry: date
    };
    tokenProducer.next(authToken);
    let apiResponse;
    service.checkAuthTokenWithinExpiryThreshold().then((response) => apiResponse = response);

    flushMicrotasks();
    expect(service.requestAuthToken).not.toHaveBeenCalled();
    expect(service.logout).not.toHaveBeenCalled();
    expect(apiResponse).toEqual(SpotifyAPIResponse.Success);
  }));

  it('should not refresh the auth token when no auth token present', fakeAsync(() => {
    spyOn(service, 'requestAuthToken');
    spyOn(service, 'logout');
    tokenProducer.next(null);
    let apiResponse;
    service.checkAuthTokenWithinExpiryThreshold().then((response) => apiResponse = response);

    flushMicrotasks();
    expect(service.requestAuthToken).not.toHaveBeenCalled();
    expect(service.logout).not.toHaveBeenCalled();
    expect(apiResponse).toEqual(SpotifyAPIResponse.Success);
  }));
});
