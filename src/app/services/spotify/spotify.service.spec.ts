/* tslint:disable:no-string-literal */

import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { Router } from '@angular/router';
import { NgxsModule, Store } from '@ngxs/store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { AppConfig } from '../../app.config';
import { SetAuthToken } from '../../core/auth/auth.actions';
import { AuthToken } from '../../core/auth/auth.model';
import {
  ChangeAlbum,
  ChangeDevice,
  ChangeDeviceIsActive,
  ChangeDeviceVolume,
  ChangePlaylist,
  ChangeRepeatState,
  ChangeTrack,
  SetAvailableDevices,
  SetLiked,
  SetPlayerState,
  SetPlaying,
  SetProgress,
  SetShuffle
} from '../../core/playback/playback.actions';
import { AlbumModel, DeviceModel, PlayerState, PlaylistModel, TrackModel } from '../../core/playback/playback.model';
import { NgxsSelectorMock } from '../../core/testing/ngxs-selector-mock';
import { parseAlbum, parseDevice, parsePlaylist, parseTrack } from '../../core/util';
import { AlbumResponse } from '../../models/album.model';
import { ArtistResponse } from '../../models/artist.model';
import { CurrentPlaybackResponse } from '../../models/current-playback.model';
import { DeviceResponse, MultipleDevicesResponse } from '../../models/device.model';
import { PlaylistResponse } from '../../models/playlist.model';
import { TrackResponse } from '../../models/track.model';
import { StorageService } from '../storage/storage.service';
import { AuthType, SpotifyAPIResponse, SpotifyService } from './spotify.service';

const TEST_AUTH_TOKEN: AuthToken = {
  accessToken: 'test-access',
  tokenType: 'test-type',
  expiry: new Date(Date.UTC(9999, 1, 1, )),
  scope: 'test-scope',
  refreshToken: 'test-refresh'
};

const TEST_ARTIST_RESPONSE_1: ArtistResponse = {
  id: 'artist-id-1',
  name: 'artist-1',
  type: 'artist-type-1',
  uri: 'artist-uri-1',
  external_urls: {
    spotify: 'artist-url-1'
  }
};

const TEST_ARTIST_RESPONSE_2: ArtistResponse = {
  id: 'artist-id-2',
  name: 'artist-2',
  type: 'artist-type-2',
  uri: 'artist-uri-2',
  external_urls: {
    spotify: 'artist-url-2'
  }
};

const TEST_ALBUM_RESPONSE: AlbumResponse = {
  id: 'album-id',
  name: 'test-album',
  type: 'album-type',
  total_tracks: 10,
  release_date: 'album-date',
  uri: 'album-uri',
  external_urls: {
    spotify: 'album-url'
  },
  album_type: 'album-type',
  images: [
    {url: 'album-img', height: 500, width: 500}
  ],
  artists: [
    TEST_ARTIST_RESPONSE_1,
    TEST_ARTIST_RESPONSE_2
  ]
};

const TEST_TRACK_RESPONSE: TrackResponse = {
  name: 'test-track',
  album: TEST_ALBUM_RESPONSE,
  track_number: 1,
  duration_ms: 1000,
  uri: 'test-uri',
  id: 'track-id',
  popularity: 100,
  type: 'type-test',
  explicit: true,
  external_urls: {
    spotify: 'spotify-url'
  },
  artists: [
    TEST_ARTIST_RESPONSE_1,
    TEST_ARTIST_RESPONSE_2
  ]
};

const TEST_PLAYLIST_RESPONSE: PlaylistResponse = {
  id: 'playlist-id',
  name: 'playlist-test',
  external_urls: {
    spotify: 'playlist-url'
  }
};

const TEST_DEVICE_RESPONSE: DeviceResponse = {
  id: 'device-id',
  volume_percent: 50,
  name: 'device-test',
  type: 'speaker',
  is_active: true,
  is_private_session: false,
  is_restricted: false
};

const TEST_PLAYBACK_RESPONSE: CurrentPlaybackResponse = {
  item: TEST_TRACK_RESPONSE,
  context: {
    type: 'playlist',
    href: 'context-url',
    uri: 'test:uri:playlist-id'
  },
  device: TEST_DEVICE_RESPONSE,
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

function generateErrorResponse(status: number): HttpErrorResponse {
  return new HttpErrorResponse({
    status
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
  let trackProducer: BehaviorSubject<TrackModel>;
  let albumProducer: BehaviorSubject<AlbumModel>;
  let playlistProducer: BehaviorSubject<PlaylistModel>;
  let deviceProducer: BehaviorSubject<DeviceModel>;
  let isPlayingProducer: BehaviorSubject<boolean>;
  let isShuffleProducer: BehaviorSubject<boolean>;
  let progressProducer: BehaviorSubject<number>;
  let durationProducer: BehaviorSubject<number>;
  let isLikedProducer: BehaviorSubject<boolean>;

  beforeEach(() => {
    AppConfig.settings = {
      env: {
        name: 'test-name',
        domain: 'test-domain',
        spotifyApiUrl: 'spotify-url',
        spotifyAccountsUrl: 'spotify-accounts'
      },
      auth: {
        clientId: 'test-client-id',
        scopes: 'test-scope',
        tokenUrl: null,
        forcePkce: false,
        showDialog: true,
        expiryThreshold: 5000
      }
    };
    SpotifyService.initialize();

    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([], {developmentMode: true}),
        HttpClientTestingModule
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
    tokenProducer = mockSelectors.defineNgxsSelector<AuthToken>(service, 'authToken$', TEST_AUTH_TOKEN);
    trackProducer = mockSelectors.defineNgxsSelector<TrackModel>(service, 'track$', parseTrack(TEST_TRACK_RESPONSE));
    albumProducer = mockSelectors.defineNgxsSelector<AlbumModel>(service, 'album$', parseAlbum(TEST_ALBUM_RESPONSE));
    playlistProducer = mockSelectors.defineNgxsSelector<PlaylistModel>(service, 'playlist$', parsePlaylist(TEST_PLAYLIST_RESPONSE));
    deviceProducer = mockSelectors.defineNgxsSelector<DeviceModel>(service, 'device$', parseDevice(TEST_DEVICE_RESPONSE));
    isPlayingProducer = mockSelectors.defineNgxsSelector<boolean>(service, 'isPlaying$', true);
    isShuffleProducer = mockSelectors.defineNgxsSelector<boolean>(service, 'isShuffle$', true);
    progressProducer = mockSelectors.defineNgxsSelector<number>(service, 'progress$', 10);
    durationProducer = mockSelectors.defineNgxsSelector<number>(service, 'duration$', 100);
    isLikedProducer = mockSelectors.defineNgxsSelector<boolean>(service, 'isLiked$', true);

    service.initSubscriptions();
    spyOn(console, 'error');
    store.dispatch = jasmine.createSpy().and.returnValue(of(null));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fail to initialize if no configured clientId', () => {
    AppConfig.settings.auth.clientId = null;
    expect(SpotifyService.initialize()).toBeFalse();
    expect(console.error).toHaveBeenCalled();
  });

  it('should set tokenUrl on initialization when configured', () => {
    AppConfig.settings.auth.tokenUrl = 'test-token-url';
    expect(SpotifyService.initialize()).toBeTrue();
    expect(SpotifyService['tokenUrl']).toBeTruthy();
  });

  it('should set clientSecret on initialization when configured', () => {
    AppConfig.settings.auth.clientSecret = 'test-client-secret';
    expect(SpotifyService.initialize()).toBeTrue();
    expect(SpotifyService['clientSecret']).toBeTruthy();
  });

  it('should set scopes on initialization when configured', () => {
    expect(SpotifyService.initialize()).toBeTrue();
    expect(SpotifyService['scopes']).toBeTruthy();
  });

  it('should set showAuthDialog on initialization when configured', () => {
    expect(SpotifyService.initialize()).toBeTrue();
    expect(SpotifyService['showAuthDialog']).toBeTrue();
  });

  it('should set auth type to PKCE if no configured tokenUrl and clientSecret', () => {
    expect(SpotifyService.initialize()).toBeTrue();
    expect(SpotifyService['authType']).toEqual(AuthType.PKCE);
  });

  it('should set auth type to PKCE if forcePkce is true', () => {
    AppConfig.settings.auth.forcePkce = true;
    expect(SpotifyService.initialize()).toBeTrue();
    expect(SpotifyService['authType']).toEqual(AuthType.PKCE);
  });

  it('should set auth type to ThirdParty if tokenUrl is configured and clientSecret not configured', () => {
    AppConfig.settings.auth.tokenUrl = 'test-token-url';
    expect(SpotifyService.initialize()).toBeTrue();
    expect(SpotifyService['authType']).toEqual(AuthType.ThirdParty);
  });

  it('should set auth type to Secret if tokenUrl not configured and clientSecret is configured', () => {
    AppConfig.settings.auth.clientSecret = 'test-client-secret';
    expect(SpotifyService.initialize()).toBeTrue();
    expect(SpotifyService['authType']).toEqual(AuthType.Secret);
  });

  it('should fail to initialize if no configured spotifyApiUrl', () => {
    AppConfig.settings.env.spotifyApiUrl = null;
    expect(SpotifyService.initialize()).toBeFalse();
    expect(console.error).toHaveBeenCalled();
  });

  it('should fail to initialize if no configured spotifyAccountsUrl', () => {
    AppConfig.settings.env.spotifyAccountsUrl = null;
    expect(SpotifyService.initialize()).toBeFalse();
    expect(console.error).toHaveBeenCalled();
  });

  it('should fail to initialize if no configured domain', () => {
    AppConfig.settings.env.domain = null;
    expect(SpotifyService.initialize()).toBeFalse();
    expect(console.error).toHaveBeenCalled();
  });

  it('should fail to initialize if issue retrieving AppConfig', () => {
    AppConfig.settings.env = null;
    expect(SpotifyService.initialize()).toBeFalse();
    expect(console.error).toHaveBeenCalled();

    AppConfig.settings.auth = null;
    expect(SpotifyService.initialize()).toBeFalse();
    expect(console.error).toHaveBeenCalled();

    AppConfig.settings = null;
    expect(SpotifyService.initialize()).toBeFalse();
    expect(console.error).toHaveBeenCalled();
  });

  it('should add Authorization header when requesting auth token and auth type is secret', fakeAsync(() => {
    SpotifyService['authType'] = AuthType.Secret;
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
          'Authorization', `Basic ${new Buffer(`${SpotifyService['clientId']}:${SpotifyService['clientSecret']}`).toString('base64')}`
        ),
        observe: 'response'
      });
  }));

  it('should NOT add Authorization header when requesting auth token and auth type is PKCE', fakeAsync(() => {
    SpotifyService['authType'] = AuthType.PKCE;
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
    SpotifyService['authType'] = AuthType.ThirdParty;
    SpotifyService['tokenUrl'] = 'test-token-url';
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
    SpotifyService['authType'] = AuthType.PKCE;
    http.post = jasmine.createSpy().and.returnValue(of(new HttpResponse({body: {}, status: HttpStatusCode.Ok, statusText: 'OK'})));

    service.requestAuthToken('test-code', false);
    flushMicrotasks();
    expect(http.post).toHaveBeenCalledOnceWith(
      SpotifyService.spotifyEndpoints.getTokenEndpoint(),
      jasmine.any(URLSearchParams),
      jasmine.any(Object)
    );
  }));

  it(`should use Spotify's token endpoint if auth type is Secret when requesting an auth token`, fakeAsync(() => {
    SpotifyService['authType'] = AuthType.Secret;
    http.post = jasmine.createSpy().and.returnValue(of(new HttpResponse({body: {}, status: HttpStatusCode.Ok, statusText: 'OK'})));

    service.requestAuthToken('test-code', false);
    flushMicrotasks();
    expect(http.post).toHaveBeenCalledOnceWith(
      SpotifyService.spotifyEndpoints.getTokenEndpoint(),
      jasmine.any(URLSearchParams),
      jasmine.any(Object)
    );
  }));

  it(`should use the configured token URL endpoint is auth type is ThirdParty when requesting an auth token`, fakeAsync(() => {
    SpotifyService['authType'] = AuthType.ThirdParty;
    http.post = jasmine.createSpy().and.returnValue(of(new HttpResponse({body: {}, status: HttpStatusCode.Ok, statusText: 'OK'})));

    service.requestAuthToken('test-code', false);
    flushMicrotasks();
    expect(http.post).toHaveBeenCalledOnceWith(
      SpotifyService['tokenUrl'],
      jasmine.any(URLSearchParams),
      jasmine.any(Object)
    );
  }));

  it('should send correct request parameters for requesting a new auth token', fakeAsync(() => {
    service['codeVerifier'] = 'test-code-verifier';
    http.post = jasmine.createSpy().and.returnValue(of(new HttpResponse({body: {}, status: HttpStatusCode.Ok, statusText: 'OK'})));
    const expectedBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: SpotifyService['clientId'],
      code: 'test-code',
      redirect_uri: SpotifyService['redirectUri'],
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
      client_id: SpotifyService['clientId'],
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
      SpotifyService['authType'] = AuthType.ThirdParty;
      SpotifyService['tokenUrl'] = 'test-token-url';
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
      SpotifyService['authType'] = AuthType.ThirdParty;
      SpotifyService['tokenUrl'] = 'test-token-url';
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
    SpotifyService['authType'] = AuthType.Secret;
    service['state'] = 'test-state';
    const expectedParams = new URLSearchParams({
      response_type: 'code',
      client_id: SpotifyService['clientId'],
      scope: 'test-scope',
      redirect_uri: `${AppConfig.settings.env.domain}/callback`,
      state: 'test-state',
      show_dialog: 'true'
    });
    const expectedUrl = `${SpotifyService.spotifyEndpoints.getAuthorizeEndpoint()}?${expectedParams.toString()}`;
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
      client_id: SpotifyService['clientId'],
      scope: 'test-scope',
      redirect_uri: `${AppConfig.settings.env.domain}/callback`,
      state: 'test-state',
      show_dialog: 'true',
      code_challenge_method: 'S256',
      code_challenge: 'AAAAAAAAAAA'
    });
    const expectedUrl = `${SpotifyService.spotifyEndpoints.getAuthorizeEndpoint()}?${expectedParams.toString()}`;
    let actualUrl;
    service.getAuthorizeRequestUrl().then((url) => actualUrl = url);

    flushMicrotasks();
    expect(actualUrl).toEqual(expectedUrl);
  }));

  it('should get current playback on pollCurrentPlayback', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);

    expect(http.get).toHaveBeenCalledOnceWith(
      SpotifyService.spotifyEndpoints.getPlaybackEndpoint(),
      {
        observe: 'response'
      });
  }));

  it('should change track if a new track', fakeAsync(() => {
    spyOn(service, 'isTrackSaved');
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    const currentTrack = parseTrack({
      ...TEST_TRACK_RESPONSE,
      id: 'old-id'
    });
    trackProducer.next(currentTrack);

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeTrack(parseTrack(TEST_TRACK_RESPONSE)));
    expect(service.isTrackSaved).toHaveBeenCalledOnceWith(TEST_TRACK_RESPONSE.id);
  }));

  it('should not change track if same track playing', fakeAsync(() => {
    spyOn(service, 'isTrackSaved');
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangeTrack));
    expect(service.isTrackSaved).not.toHaveBeenCalled();
  }));

  it('should change album if new album', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    const currentAlbum = parseAlbum({
      ...TEST_ALBUM_RESPONSE,
      id: 'old-id'
    });
    albumProducer.next(currentAlbum);

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeAlbum(parseAlbum(TEST_ALBUM_RESPONSE)));
  }));

  it('should not change album if same album', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangeAlbum));
  }));

  it('should change playlist if new playlist', fakeAsync(() => {
    spyOn(service, 'setPlaylist');
    const currentPlaylist = {
      ...parsePlaylist(TEST_PLAYLIST_RESPONSE),
      id: 'old-id'
    };
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    playlistProducer.next(currentPlaylist);

    service.pollCurrentPlayback(1000);
    expect(service.setPlaylist).toHaveBeenCalledWith(TEST_PLAYLIST_RESPONSE.id);
  }));

  it('should change to playback playlist if no current playlist', fakeAsync(() => {
    spyOn(service, 'setPlaylist');
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    playlistProducer.next(null);

    service.pollCurrentPlayback(1000);
    expect(service.setPlaylist).toHaveBeenCalledWith(TEST_PLAYLIST_RESPONSE.id);
  }));

  it('should not change playlist if playback playlist is current playlist', fakeAsync(() => {
    spyOn(service, 'setPlaylist');
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(service.setPlaylist).not.toHaveBeenCalled();
  }));

  it('should remove playlist if context is null and previously had playlist', fakeAsync(() => {
    spyOn(service, 'setPlaylist');
    const playbackResponse = {
      ...TEST_PLAYBACK_RESPONSE,
      context: null
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).toHaveBeenCalledWith(new ChangePlaylist(null));
  }));

  it('should remove playlist if context type is null and previously had playlist', fakeAsync(() => {
    const playbackResponse = {
      ...TEST_PLAYBACK_RESPONSE,
      context: {
        ...TEST_PLAYBACK_RESPONSE.context,
        type: null
      }
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).toHaveBeenCalledWith(new ChangePlaylist(null));
  }));

  it('should remove playlist if context type is not playlist and previously had playlist', fakeAsync(() => {
    const playbackResponse = {
      ...TEST_PLAYBACK_RESPONSE,
      context: {
        ...TEST_PLAYBACK_RESPONSE.context,
        type: 'test'
      }
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).toHaveBeenCalledWith(new ChangePlaylist(null));
  }));

  it('should not change playlist if no playback playlist and no previous playlist', fakeAsync(() => {
    const playbackResponse = {
      ...TEST_PLAYBACK_RESPONSE,
      context: {
        ...TEST_PLAYBACK_RESPONSE.context,
        type: 'test'
      }
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    playlistProducer.next(null);

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangePlaylist));
  }));

  it('should save previous volume value if playback muted and not previously muted', fakeAsync(() => {
    const playbackResponse = {
      ...TEST_PLAYBACK_RESPONSE,
      device: {
        ...TEST_DEVICE_RESPONSE,
        volume_percent: 0
      }
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    deviceProducer.next(parseDevice({...TEST_DEVICE_RESPONSE, volume_percent: 25}));

    service.pollCurrentPlayback(1000);
    expect(storage.set).toHaveBeenCalledWith(SpotifyService.PREVIOUS_VOLUME, '25');
  }));

  it('should not save previous volume value if playback muted and currently muted', fakeAsync(() => {
    const playbackResponse = {
      ...TEST_PLAYBACK_RESPONSE,
      device: {
        ...TEST_DEVICE_RESPONSE,
        volume_percent: 0
      }
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    deviceProducer.next(parseDevice({...TEST_DEVICE_RESPONSE, volume_percent: 0}));

    service.pollCurrentPlayback(1000);
    expect(storage.set).not.toHaveBeenCalledWith(SpotifyService.PREVIOUS_VOLUME, jasmine.anything());
  }));

  it('should not save previous volume value if playback not muted', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    deviceProducer.next(parseDevice({...TEST_DEVICE_RESPONSE, volume_percent: 0}));

    service.pollCurrentPlayback(1000);
    expect(storage.set).not.toHaveBeenCalledWith(SpotifyService.PREVIOUS_VOLUME, jasmine.anything());
  }));

  it('should not save previous volume value if playback device is null', fakeAsync(() => {
    const playbackResponse = {
      ...TEST_PLAYBACK_RESPONSE,
      device: null
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(storage.set).not.toHaveBeenCalledWith(SpotifyService.PREVIOUS_VOLUME, jasmine.anything());
  }));

  it('should change current device if playback device differs from current device', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    deviceProducer.next({...parseDevice(TEST_DEVICE_RESPONSE), id: 'old-id'});

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDevice(parseDevice(TEST_DEVICE_RESPONSE)));
  }));

  it('should not change current device if playback device is the current device', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangeDevice));
  }));

  it('should not change current device playback device is null', fakeAsync(() => {
    const playbackResponse = {
      ...TEST_PLAYBACK_RESPONSE,
      device: null
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangeDevice));
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangeDeviceIsActive));
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangeDeviceVolume));
  }));

  it('should set update rest of track playback states', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    trackProducer.next(parseTrack(TEST_TRACK_RESPONSE));

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDeviceIsActive(TEST_DEVICE_RESPONSE.is_active));
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDeviceVolume(TEST_DEVICE_RESPONSE.volume_percent));
    expect(store.dispatch).toHaveBeenCalledWith(new SetProgress(TEST_PLAYBACK_RESPONSE.progress_ms));
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlaying(TEST_PLAYBACK_RESPONSE.is_playing));
    expect(store.dispatch).toHaveBeenCalledWith(new SetShuffle(TEST_PLAYBACK_RESPONSE.shuffle_state));
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlayerState(PlayerState.Playing));
  }));

  it('should set playback to idle when playback not available', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, HttpStatusCode.NoContent);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlayerState(PlayerState.Idling));
  }));

  it('should set playback to idle when playback is null', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(null, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlayerState(PlayerState.Idling));
  }));

  it('should set playback to idle when playback track is null', fakeAsync(() => {
    const playbackResponse = {
      ...TEST_PLAYBACK_RESPONSE,
      item: null
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlayerState(PlayerState.Idling));
  }));

  it('should set track position when valid', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    service.setTrackPosition(50);
    expect(http.put).toHaveBeenCalledOnceWith(
      SpotifyService.spotifyEndpoints.getSeekEndpoint(),
      {},
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams),
        observe: 'response'
      });
    const spyParams = (http.put as jasmine.Spy).calls.mostRecent().args[2].params as HttpParams;
    expect(spyParams.keys().length).toEqual(1);
    expect(spyParams.get('position_ms')).toEqual('50');
    expect(store.dispatch).toHaveBeenCalledWith(new SetProgress(50));
  }));

  it('should set track position to duration when greater than', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    durationProducer.next(100);
    service.setTrackPosition(101);
    expect(store.dispatch).toHaveBeenCalledWith(new SetProgress(100));
  }));

  it('should set track position to 0 when negative', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    service.setTrackPosition(-1);
    expect(store.dispatch).toHaveBeenCalledWith(new SetProgress(0));
  }));

  it('should send play request when isPlaying', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    service.setPlaying(true);
    expect(http.put).toHaveBeenCalledOnceWith(
      SpotifyService.spotifyEndpoints.getPlayEndpoint(),
      {},
      { headers: jasmine.any(HttpHeaders), observe: 'response' }
    );
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlaying(true));
  }));

  it('should send pause request when not isPlaying', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    service.setPlaying(false);
    expect(http.put).toHaveBeenCalledOnceWith(
      SpotifyService.spotifyEndpoints.getPauseEndpoint(),
      {},
      { headers: jasmine.any(HttpHeaders), observe: 'response' }
    );
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlaying(false));
  }));

  it('should toggle playing off', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    isPlayingProducer.next(true);
    service.togglePlaying();
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlaying(false));
  }));

  it('should toggle playing on', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    isPlayingProducer.next(false);
    service.togglePlaying();
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlaying(true));
  }));

  it('should send skip previous request when within threshold', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.post = jasmine.createSpy().and.returnValue(of(response));
    progressProducer.next(2999);
    durationProducer.next(6001);
    service.skipPrevious(false);
    expect(http.post).toHaveBeenCalledOnceWith(
      SpotifyService.spotifyEndpoints.getPreviousEndpoint(),
      {},
      { headers: jasmine.any(HttpHeaders), observe: 'response' }
    );
  }));

  it('should set track position to 0 when not within threshold', fakeAsync(() => {
    http.post = jasmine.createSpy().and.returnValue(of(null));
    spyOn(service, 'setTrackPosition');
    progressProducer.next(3001);
    durationProducer.next(6001);
    service.skipPrevious(false);
    expect(service.setTrackPosition).toHaveBeenCalledOnceWith(0);
  }));

  it('should send skip previous request when duration is less than double the threshold', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.post = jasmine.createSpy().and.returnValue(of(response));
    progressProducer.next(3001);
    durationProducer.next(5999);
    service.skipPrevious(false);
    expect(http.post).toHaveBeenCalledOnceWith(
      SpotifyService.spotifyEndpoints.getPreviousEndpoint(),
      {},
      { headers: jasmine.any(HttpHeaders), observe: 'response' }
    );
  }));

  it('should send skip previous request when forced', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.post = jasmine.createSpy().and.returnValue(of(response));
    progressProducer.next(2999);
    durationProducer.next(6001);
    service.skipPrevious(true);
    expect(http.post).toHaveBeenCalledOnceWith(
      SpotifyService.spotifyEndpoints.getPreviousEndpoint(),
      {},
      { headers: jasmine.any(HttpHeaders), observe: 'response' }
    );
  }));

  it('should send skip next request', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.post = jasmine.createSpy().and.returnValue(of(response));
    service.skipNext();
    expect(http.post).toHaveBeenCalledOnceWith(
      SpotifyService.spotifyEndpoints.getNextEndpoint(),
      {},
      { headers: jasmine.any(HttpHeaders), observe: 'response' }
    );
  }));

  it('should send shuffle on request when isShuffle', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    service.setShuffle(true);
    expect(http.put).toHaveBeenCalledOnceWith(
      SpotifyService.spotifyEndpoints.getShuffleEndpoint(),
      {},
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams),
        observe: 'response'
      });
    const spyParams = (http.put as jasmine.Spy).calls.mostRecent().args[2].params as HttpParams;
    expect(spyParams.keys().length).toEqual(1);
    expect(spyParams.get('state')).toEqual('true');
    expect(store.dispatch).toHaveBeenCalledWith(new SetShuffle(true));
  }));

  it('should send shuffle off request when not isShuffle', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    service.setShuffle(false);
    expect(http.put).toHaveBeenCalledOnceWith(
      SpotifyService.spotifyEndpoints.getShuffleEndpoint(),
      {},
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams),
        observe: 'response'
      });
    const spyParams = (http.put as jasmine.Spy).calls.mostRecent().args[2].params as HttpParams;
    expect(spyParams.keys().length).toEqual(1);
    expect(spyParams.get('state')).toEqual('false');
    expect(store.dispatch).toHaveBeenCalledWith(new SetShuffle(false));
  }));

  it('should toggle shuffle off', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    isShuffleProducer.next(true);
    service.toggleShuffle();
    expect(store.dispatch).toHaveBeenCalledWith(new SetShuffle(false));
  }));

  it('should toggle shuffle on', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    isShuffleProducer.next(false);
    service.toggleShuffle();
    expect(store.dispatch).toHaveBeenCalledWith(new SetShuffle(true));
  }));

  it('should send volume request', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    service.setVolume(50);
    expect(http.put).toHaveBeenCalledOnceWith(
      SpotifyService.spotifyEndpoints.getVolumeEndpoint(),
      {},
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams),
        observe: 'response'
      });
    const spyParams = (http.put as jasmine.Spy).calls.mostRecent().args[2].params as HttpParams;
    expect(spyParams.keys().length).toEqual(1);
    expect(spyParams.get('volume_percent')).toEqual('50');
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDeviceVolume(50));
  }));

  it('should set volume to 100 when greater', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    service.setVolume(101);
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDeviceVolume(100));
  }));

  it('should set volume to 0 when negative', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    service.setVolume(-1);
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDeviceVolume(0));
  }));

  it('should send repeat state request', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    service.setRepeatState('context');
    expect(http.put).toHaveBeenCalledOnceWith(
      SpotifyService.spotifyEndpoints.getRepeatEndpoint(),
      {},
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams),
        observe: 'response'
      });
    const spyParams = (http.put as jasmine.Spy).calls.mostRecent().args[2].params as HttpParams;
    expect(spyParams.keys().length).toEqual(1);
    expect(spyParams.get('state')).toEqual('context');
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeRepeatState('context'));
  }));

  it('should send isTrackSaved request', fakeAsync(() => {
    const response = generateResponse<boolean[]>([true], HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    service.isTrackSaved('test-id');
    expect(http.get).toHaveBeenCalledOnceWith(
      SpotifyService.spotifyEndpoints.getCheckSavedEndpoint(),
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams),
        observe: 'response'
      });
    const spyParams = (http.get as jasmine.Spy).calls.mostRecent().args[1].params as HttpParams;
    expect(spyParams.keys().length).toEqual(1);
    expect(spyParams.get('ids')).toEqual('test-id');
    expect(store.dispatch).toHaveBeenCalledWith(new SetLiked(true));
  }));

  it('should send add save track request', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.Ok);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    service.setSavedTrack('test-id', true);
    expect(http.put).toHaveBeenCalledOnceWith(
      SpotifyService.spotifyEndpoints.getSavedTracksEndpoint(),
      {},
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams),
        observe: 'response'
      });
    const spyParams = (http.put as jasmine.Spy).calls.mostRecent().args[2].params as HttpParams;
    expect(spyParams.keys().length).toEqual(1);
    expect(spyParams.get('ids')).toEqual('test-id');
    expect(store.dispatch).toHaveBeenCalledWith(new SetLiked(true));
  }));

  it('should send remove save track request', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.Ok);
    http.delete = jasmine.createSpy().and.returnValue(of(response));
    service.setSavedTrack('test-id', false);
    expect(http.delete).toHaveBeenCalledOnceWith(
      SpotifyService.spotifyEndpoints.getSavedTracksEndpoint(),
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams),
        observe: 'response'
      });
    const spyParams = (http.delete as jasmine.Spy).calls.mostRecent().args[1].params as HttpParams;
    expect(spyParams.keys().length).toEqual(1);
    expect(spyParams.get('ids')).toEqual('test-id');
    expect(store.dispatch).toHaveBeenCalledWith(new SetLiked(false));
  }));

  it('should toggle liked off for current track', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.Ok);
    http.delete = jasmine.createSpy().and.returnValue(of(response));
    isLikedProducer.next(true);
    service.toggleLiked();
    expect(http.delete).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith(new SetLiked(false));
  }));

  it('should toggle liked on for current track', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.Ok);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    isLikedProducer.next(false);
    service.toggleLiked();
    expect(http.put).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith(new SetLiked(true));
  }));

  it('should send get playlist request', () => {
    const playlistResponse = {
      ...TEST_PLAYLIST_RESPONSE,
      id: 'playlist-new-id'
    };
    const response = generateResponse<PlaylistResponse>(playlistResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    service.setPlaylist('playlist-new-id');
    expect(http.get).toHaveBeenCalledOnceWith(
      `${SpotifyService.spotifyEndpoints.getPlaylistsEndpoint()}/playlist-new-id`,
      { headers: jasmine.any(HttpHeaders), observe: 'response' }
    );
    expect(store.dispatch).toHaveBeenCalledWith(new ChangePlaylist(parsePlaylist(playlistResponse)));
  });

  it('should set available devices', fakeAsync(() => {
    const device2: DeviceResponse = {
      ...TEST_DEVICE_RESPONSE,
      id: 'test-device-2'
    };
    const devicesResponse: MultipleDevicesResponse = {
      devices: [
        TEST_DEVICE_RESPONSE,
        device2
      ]
    };
    const response = generateResponse<MultipleDevicesResponse>(devicesResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    service.fetchAvailableDevices();
    expect(http.get).toHaveBeenCalledOnceWith(
      SpotifyService.spotifyEndpoints.getDevicesEndpoint(),
      { headers: jasmine.any(HttpHeaders), observe: 'response' }
    );
    expect(store.dispatch).toHaveBeenCalledWith(new SetAvailableDevices([parseDevice(TEST_DEVICE_RESPONSE), parseDevice(device2)]));
  }));

  it('should send set device playing request', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    const device: DeviceModel = {
      ...parseDevice(TEST_DEVICE_RESPONSE),
      id: 'new-device'
    };
    service.setDevice(device, true);
    expect(http.put).toHaveBeenCalledOnceWith(
      SpotifyService.spotifyEndpoints.getPlaybackEndpoint(),
      {
        device_ids: ['new-device'],
        play: true
      },
      { headers: jasmine.any(HttpHeaders), observe: 'response' }
    );
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDevice(device));
  }));

  it('should send set device not playing request', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    const device: DeviceModel = {
      ...parseDevice(TEST_DEVICE_RESPONSE),
      id: 'new-device'
    };
    service.setDevice(device, false);
    expect(http.put).toHaveBeenCalledOnceWith(
      SpotifyService.spotifyEndpoints.getPlaybackEndpoint(),
      {
        device_ids: ['new-device'],
        play: false
      },
      { headers: jasmine.any(HttpHeaders), observe: 'response' }
    );
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDevice(device));
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
    expect(storage.remove).toHaveBeenCalledOnceWith(SpotifyService['STATE_KEY']);
    expect(storage.removeAuthToken).toHaveBeenCalledTimes(1);
  });

  it('should get current state if not null', () => {
    service['state'] = 'test-state';
    storage.get = jasmine.createSpy();
    expect(service['getState']()).toEqual('test-state');
    expect(storage.get).not.toHaveBeenCalled();
  });

  it('should set state from storage if exists', () => {
    service['state'] = null;
    storage.get = jasmine.createSpy().withArgs(SpotifyService['STATE_KEY']).and.returnValue('test-state');
    service['setState']();
    expect(service['state']).toEqual('test-state');
  });

  it('should generate new state and save to storage if it does not exist in storage', () => {
    service['state'] = null;
    storage.get = jasmine.createSpy().withArgs('STATE').and.returnValue(null);
    service['setState']();
    expect(service['state']).toMatch(`^[A-Za-z0-9]{${SpotifyService['STATE_LENGTH']}}$`);
    expect(storage.set).toHaveBeenCalledWith(SpotifyService['STATE_KEY'], service['state']);
  });

  it('should get current codeVerifier if not null', () => {
    service['codeVerifier'] = 'test-code-verifier';
    storage.get = jasmine.createSpy();
    expect(service['getCodeVerifier']()).toEqual('test-code-verifier');
    expect(storage.get).not.toHaveBeenCalled();
  });

  it('should set codeVerifier from storage if exists', () => {
    service['codeVerifier'] = null;
    storage.get = jasmine.createSpy().withArgs(SpotifyService['CODE_VERIFIER_KEY']).and.returnValue('test-code-verifier');
    service['setCodeVerifier']();
    expect(service['codeVerifier']).toEqual('test-code-verifier');
  });

  it('should generate new codeVerifier and save to storage if it does not exist in storage', () => {
    service['codeVerifier'] = null;
    storage.get = jasmine.createSpy().withArgs(SpotifyService['CODE_VERIFIER_KEY']).and.returnValue(null);
    service['setCodeVerifier']();
    expect(service['codeVerifier']).toBeTruthy();
    expect(storage.set).toHaveBeenCalledWith(SpotifyService['CODE_VERIFIER_KEY'], service['codeVerifier']);
  });

  it('should reauthenticate when error response is an expired token', fakeAsync(() => {
    spyOn(service, 'requestAuthToken').and.returnValue(Promise.resolve(null));
    const expiredToken = {
      ...TEST_AUTH_TOKEN,
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
      ...TEST_AUTH_TOKEN,
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
      ...TEST_AUTH_TOKEN,
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

  it('should logout when error response is a bad OAuth request', fakeAsync(() => {
    spyOn(service, 'logout');
    let apiResponse;
    service.checkErrorResponse(generateErrorResponse(HttpStatusCode.Forbidden)).then((response) => apiResponse = response);

    flushMicrotasks();
    expect(service.logout).toHaveBeenCalled();
    expect(apiResponse).toEqual(SpotifyAPIResponse.Error);
  }));

  it('should logout and log an error when error response is Spotify rate limits exceeded', fakeAsync(() => {
    spyOn(service, 'logout');
    let apiResponse;
    service.checkErrorResponse(generateErrorResponse(HttpStatusCode.TooManyRequests)).then((response) => apiResponse = response);

    flushMicrotasks();
    expect(service.logout).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
    expect(apiResponse).toEqual(SpotifyAPIResponse.Error);
  }));

  it('should log an error when error response is unknown', fakeAsync(() => {
    let apiResponse;
    service.checkErrorResponse(generateErrorResponse(HttpStatusCode.NotFound)).then((response) => apiResponse = response);

    flushMicrotasks();
    expect(console.error).toHaveBeenCalled();
    expect(apiResponse).toEqual(SpotifyAPIResponse.Error);
  }));

  it('should refresh auth token when expiry is within the threshold', fakeAsync(() => {
    spyOn(service, 'requestAuthToken').and.returnValue(Promise.resolve());
    spyOn(service, 'logout');
    const date = new Date();
    date.setMilliseconds(date.getMilliseconds() + AppConfig.settings.auth.expiryThreshold);
    const authToken = {
      ...TEST_AUTH_TOKEN,
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
      ...TEST_AUTH_TOKEN,
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
      ...TEST_AUTH_TOKEN,
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
      ...TEST_AUTH_TOKEN,
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
