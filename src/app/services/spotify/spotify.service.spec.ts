/* tslint:disable:no-string-literal */

import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { Router } from '@angular/router';
import { NgxsModule, Store } from '@ngxs/store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { AppConfig } from '../../app.config';
import { SetAuthToken } from '../../core/auth/auth.actions';
import { AuthToken } from '../../core/auth/auth.model';
import { NgxsSelectorMock } from '../../core/testing/ngxs-selector-mock';
import { CurrentPlaybackResponse } from '../../models/current-playback.model';
import { TokenResponse } from '../../models/token.model';
import { StorageService } from '../storage/storage.service';

import { SpotifyService } from './spotify.service';

const TEST_AUTH_TOKEN: AuthToken = {
  accessToken: 'test-access',
  tokenType: 'test-type',
  expiry: new Date(Date.UTC(9999, 1, 1, )).toString(),
  scope: 'test-scope',
  refreshToken: 'test-refresh'
};

const TEST_PLAYBACK_RESPONSE: CurrentPlaybackResponse = {
  item: null,
  context: null,
  device: null,
  is_playing: false,
  currently_playing_type: 'test-type',
  progress_ms: 100,
  repeat_state: 'test-state',
  shuffle_state: true,
  timestamp: 10
};

function generateResponse<T>(body: T, status: number): HttpResponse<T> {
  return new HttpResponse<T>({
    body,
    headers: null,
    status,
    statusText: 'test-status',
    url: 'test-url'
  });
}

describe('SpotifyService', () => {
  const mockSelectors = new NgxsSelectorMock<SpotifyService>();
  let service: SpotifyService;
  let http: HttpClient;
  let storage: StorageService;
  let router: Router;
  let store: Store;
  let tokenProducer: BehaviorSubject<AuthToken>;

  beforeEach(() => {
    AppConfig.settings = {
      env: {
        name: 'test-name',
        domain: 'test-domain',
        albumColorUrl: 'album-url'
      },
      auth: {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        tokenUrl: 'token-url',
        isDirectSpotifyRequest: false
      },
      logging: null
    };
    SpotifyService.initialize();

    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([], {developmentMode: true})
      ],
      providers: [
        SpotifyService,
        MockProvider(HttpClient),
        MockProvider(StorageService),
        MockProvider(Router),
        MockProvider(Store)
      ]
    });
    service = TestBed.inject(SpotifyService);
    http = TestBed.inject(HttpClient);
    storage = TestBed.inject(StorageService);
    router = TestBed.inject(Router);
    store = TestBed.inject(Store);
    // Set test auth token as initial default for tests
    tokenProducer = mockSelectors.defineNgxsSelector<AuthToken>(service, 'token$', TEST_AUTH_TOKEN);
    service.initSubscriptions();
    spyOn(console, 'error');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should requestAuthToken with POST request for non-refresh', () => {
    const tokenResponse: TokenResponse = {
      access_token: 'test-access-token',
      token_type: 'test-type',
      expiry: 'test-expiry',
      scope: 'test-scope',
      refresh_token: 'test-refresh-token',
    };
    const response = new HttpResponse({
      body: tokenResponse,
      headers: null,
      status: 200,
      statusText: 'OK',
      url: 'test-url'
    });
    const body = new URLSearchParams();
    body.set('code', 'test-code');
    body.set('grant_type', 'authorization_code');
    body.set('redirect_uri', AppConfig.settings.env.domain + '/callback');
    http.post = jasmine.createSpy().and.returnValue(of(response));

    service.requestAuthToken('test-code', false)
      .then((res) => {
        expect(res.accessToken).toEqual(tokenResponse.access_token);
        expect(res.tokenType).toEqual(tokenResponse.token_type);
        expect(res.expiry).toEqual(tokenResponse.expiry);
        expect(res.scope).toEqual(tokenResponse.scope);
        expect(res.refreshToken).toEqual(tokenResponse.refresh_token);
      });
    expect(http.post).toHaveBeenCalledOnceWith(
      AppConfig.settings.auth.tokenUrl,
      body.toString(),
      {
        headers: new HttpHeaders().set(
          'Content-Type', 'application/x-www-form-urlencoded'
        ),
        observe: 'response'
      });
    expect(http.put).not.toHaveBeenCalled();
  });

  it('should requestAuthToken with PUT request for refresh', () => {
    const tokenResponse: TokenResponse = {
      access_token: 'test-access-token',
      token_type: 'test-type',
      expiry: 'test-expiry',
      scope: 'test-scope',
      refresh_token: 'test-refresh-token',
    };
    const response = new HttpResponse({
      body: tokenResponse,
      headers: null,
      status: 200,
      statusText: 'OK',
      url: 'test-url'
    });
    const body = new URLSearchParams();
    body.set('code', 'test-code');
    body.set('grant_type', 'authorization_code');
    http.put = jasmine.createSpy().and.returnValue(of(response));

    service.requestAuthToken('test-code', true)
      .then((res) => {
        expect(res.accessToken).toEqual(tokenResponse.access_token);
        expect(res.tokenType).toEqual(tokenResponse.token_type);
        expect(res.expiry).toEqual(tokenResponse.expiry);
        expect(res.scope).toEqual(tokenResponse.scope);
        expect(res.refreshToken).toEqual(tokenResponse.refresh_token);
      });
    expect(http.put).toHaveBeenCalledOnceWith(
      AppConfig.settings.auth.tokenUrl,
      body.toString(),
      {
        headers: new HttpHeaders().set(
          'Content-Type', 'application/x-www-form-urlencoded'
        ),
        observe: 'response'
      });
    expect(http.post).not.toHaveBeenCalled();
  });

  it('should return CurrentPlaybackResponse response on successful request', () => {
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, 200);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.getCurrentTrack().subscribe((res) => {
      expect(res).toEqual(TEST_PLAYBACK_RESPONSE);
    });
    expect(http.get).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player',
      {
        headers: jasmine.any(HttpHeaders),
        observe: 'response'
      });
  });

  it('should return null CurrentPlaybackResponse when playback not available', () => {
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, 204);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.getCurrentTrack().subscribe((res) => {
      expect(res).toBeNull();
    });
    expect(http.get).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player',
      {
        headers: jasmine.any(HttpHeaders),
        observe: 'response'
      });
  });

  it('should log an error for CurrentPlaybackResponse when unhandled status code', () => {
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, 405);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    console.error = jasmine.createSpy();

    service.getCurrentTrack().subscribe((res) => {
      expect(res).toBeNull();
    });
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player',
      {
        headers: jasmine.any(HttpHeaders),
        observe: 'response'
      });
  });

  it('should send track position request', () => {
    service.setTrackPosition(100);
    expect(http.put).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player/seek',
      {},
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams)
      });
    const spyParams = (http.put as jasmine.Spy).calls.mostRecent().args[2].params as HttpParams;
    expect(spyParams.keys().length).toEqual(1);
    expect(spyParams.get('position_ms')).toEqual('100');
  });

  it('should send play request when isPlaying', () => {
    service.setPlaying(true);
    expect(http.put).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player/play',
      {},
      { headers: jasmine.any(HttpHeaders) }
    );
  });

  it('should send pause request when not isPlaying', () => {
    service.setPlaying(false);
    expect(http.put).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player/pause',
      {},
      { headers: jasmine.any(HttpHeaders) }
    );
  });

  it('should send skip next request', () => {
    service.skipNext();
    expect(http.post).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player/next',
      {},
      { headers: jasmine.any(HttpHeaders) }
    );
  });

  it('should send skip previous request', () => {
    service.skipPrevious();
    expect(http.post).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player/previous',
      {},
      { headers: jasmine.any(HttpHeaders) }
    );
  });

  it('should send shuffle on request when isShuffle', () => {
    service.toggleShuffle(true);
    expect(http.put).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player/shuffle',
      {},
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams)
      });
    const spyParams = (http.put as jasmine.Spy).calls.mostRecent().args[2].params as HttpParams;
    expect(spyParams.keys().length).toEqual(1);
    expect(spyParams.get('state')).toEqual('true');
  });

  it('should send shuffle off request when not isShuffle', () => {
    service.toggleShuffle(false);
    expect(http.put).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player/shuffle',
      {},
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams)
      });
    const spyParams = (http.put as jasmine.Spy).calls.mostRecent().args[2].params as HttpParams;
    expect(spyParams.keys().length).toEqual(1);
    expect(spyParams.get('state')).toEqual('false');
  });

  it('should send volume request', () => {
    service.setVolume(50);
    expect(http.put).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player/volume',
      {},
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams)
      });
    const spyParams = (http.put as jasmine.Spy).calls.mostRecent().args[2].params as HttpParams;
    expect(spyParams.keys().length).toEqual(1);
    expect(spyParams.get('volume_percent')).toEqual('50');
  });

  it('should send repeat state request', () => {
    service.setRepeatState('context');
    expect(http.put).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player/repeat',
      {},
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams)
      });
    const spyParams = (http.put as jasmine.Spy).calls.mostRecent().args[2].params as HttpParams;
    expect(spyParams.keys().length).toEqual(1);
    expect(spyParams.get('state')).toEqual('context');
  });

  it('should send isTrackSaved request', () => {
    service.isTrackSaved('test-id');
    expect(http.get).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/tracks/contains',
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams)
      });
    const spyParams = (http.get as jasmine.Spy).calls.mostRecent().args[1].params as HttpParams;
    expect(spyParams.keys().length).toEqual(1);
    expect(spyParams.get('ids')).toEqual('test-id');
  });

  it('should send add save track request', () => {
    service.setSavedTrack('test-id', true);
    expect(http.put).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/tracks',
      {},
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams)
      });
    const spyParams = (http.put as jasmine.Spy).calls.mostRecent().args[2].params as HttpParams;
    expect(spyParams.keys().length).toEqual(1);
    expect(spyParams.get('ids')).toEqual('test-id');
  });

  it('should send remove save track request', () => {
    service.setSavedTrack('test-id', false);
    expect(http.delete).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/tracks',
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams)
      });
    const spyParams = (http.delete as jasmine.Spy).calls.mostRecent().args[1].params as HttpParams;
    expect(spyParams.keys().length).toEqual(1);
    expect(spyParams.get('ids')).toEqual('test-id');
  });

  it('should send get playlist request', () => {
    service.getPlaylist('playlist-id');
    expect(http.get).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/playlists/playlist-id',
      { headers: jasmine.any(HttpHeaders) }
    );
  });

  it('should send get devices request', () => {
    service.getDevices();
    expect(http.get).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player/devices',
      { headers: jasmine.any(HttpHeaders) }
    );
  });

  it('should send set device playing request', () => {
    service.setDevice('device-id', true);
    expect(http.put).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player',
      {
        device_ids: ['device-id'],
        play: true
      },
      { headers: jasmine.any(HttpHeaders) }
    );
  });

  it('should send set device not playing request', () => {
    service.setDevice('device-id', false);
    expect(http.put).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player',
      {
        device_ids: ['device-id'],
        play: false
      },
      { headers: jasmine.any(HttpHeaders) }
    );
  });

  it('should create the authorize request url', () => {
    service['state'] = 'test-state';
    const expectedUrl = 'https://accounts.spotify.com/authorize' +
      '?response_type=code' +
      `&client_id=${AppConfig.settings.auth.clientId}` +
      '&scope=user-library-read%20user-library-modify%20user-read-playback-state%20user-modify-playback-state' +
      `&redirect_uri=${AppConfig.settings.env.domain}/callback` +
      `&state=test-state` +
      '&show_dialog=true';
    const actualUrl = service.getAuthorizeRequestUrl();
    expect(actualUrl).toEqual(expectedUrl);
  });

  it('should retrieve album color from env url if exists', () => {
    http.get = jasmine.createSpy().and.returnValue(of('test-color'));
    service.getAlbumColor('cover-art-url').subscribe((color) => {
      expect(color).toEqual('test-color');
    });
    expect(http.get).toHaveBeenCalledOnceWith(
      AppConfig.settings.env.albumColorUrl,
      { params: jasmine.any(HttpParams) }
    );
    const spyParams = (http.get as jasmine.Spy).calls.mostRecent().args[1].params as HttpParams;
    expect(spyParams.keys().length).toEqual(1);
    expect(spyParams.get('url')).toEqual('cover-art-url');
  });

  it('should return null for album color if env url does not exist', () => {
    AppConfig.settings.env.albumColorUrl = null;
    SpotifyService.initialize();
    service.getAlbumColor('cover-art-url').subscribe((color) => {
      expect(color).toBeNull();
    });
    expect(http.get).not.toHaveBeenCalled();
  });

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
    expect(service['state']).toBeNull();
    expect(service['authToken']).toBeNull();
    expect(storage.remove).toHaveBeenCalledOnceWith('STATE');
    expect(storage.removeAuthToken).toHaveBeenCalledTimes(1);
  });

  it('should toggle isAuthenticating value', () => {
    expect(service['isAuthenticating']).toBeFalse();
    service.toggleIsAuthenticating();
    expect(service['isAuthenticating']).toBeTrue();
    service.toggleIsAuthenticating();
    expect(service['isAuthenticating']).toBeFalse();
  });

  it('should request and set new AuthToken if expired', async () => {
    const expiredToken = {...TEST_AUTH_TOKEN};
    service.requestAuthToken = jasmine.createSpy().and.returnValue(Promise.resolve(expiredToken));
    expiredToken.expiry = (new Date(Date.UTC(1999, 1, 1))).toString();
    tokenProducer.next(expiredToken);
    await service.setPlaying(true);
    expect(store.dispatch).toHaveBeenCalledOnceWith(jasmine.any(SetAuthToken));
  });

  it('should navigate to /login page if no AuthToken exists', () => {
    tokenProducer.next(null);
    service.setPlaying(true);
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/login');
  });

  it('should keep current token if not expired', async () => {
    service.requestAuthToken = jasmine.createSpy().and.returnValue(Promise.resolve(null));
    tokenProducer.next(TEST_AUTH_TOKEN);
    await service.setPlaying(true);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(service.requestAuthToken).not.toHaveBeenCalled();
    expect(service['authToken']).toEqual(TEST_AUTH_TOKEN);
  });

  it('should navigate to /login if error requesting AuthToken with refresh token', fakeAsync(() => {
    const expiredToken = {...TEST_AUTH_TOKEN};
    service.requestAuthToken = jasmine.createSpy().and.returnValue(Promise.reject('error'));
    service.logout = jasmine.createSpy().and.callThrough();
    expiredToken.expiry = (new Date(Date.UTC(1999, 1, 1))).toString();
    tokenProducer.next(expiredToken);
    service.setPlaying(true);
    flushMicrotasks(); // complete the Promise catch
    expect(store.dispatch).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(service.logout).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/login');
  }));

  it('should set state from storage if exists', () => {
    service['state'] = null;
    storage.get = jasmine.createSpy().withArgs('STATE').and.returnValue('test-state');
    service.getAuthorizeRequestUrl(); // calls setState
    expect(service['state']).toEqual('test-state');
  });

  it('should generate new state and save to storage if doesn\'t exist in storage', () => {
    service['state'] = null;
    storage.get = jasmine.createSpy().withArgs('STATE').and.returnValue(null);
    service.getAuthorizeRequestUrl(); // calls setState
    expect(service['state']).toMatch('^[A-Za-z0-9]{40}$');
    expect(storage.set).toHaveBeenCalledWith('STATE', service['state']);
  });
});
