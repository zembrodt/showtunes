/* tslint:disable:no-string-literal */

import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
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
  SetIdle,
  SetLiked,
  SetPlaying,
  SetProgress,
  SetShuffle
} from '../../core/playback/playback.actions';
import { AlbumModel, DeviceModel, PlaylistModel, TrackModel } from '../../core/playback/playback.model';
import { NgxsSelectorMock } from '../../core/testing/ngxs-selector-mock';
import { parseAlbum, parseDevice, parsePlaylist, parseTrack } from '../../core/util';
import { AlbumResponse } from '../../models/album.model';
import { ArtistResponse } from '../../models/artist.model';
import { CurrentPlaybackResponse } from '../../models/current-playback.model';
import { DeviceResponse, MultipleDevicesResponse } from '../../models/device.model';
import { PlaylistResponse } from '../../models/playlist.model';
import { TokenResponse } from '../../models/token.model';
import { TrackResponse } from '../../models/track.model';
import { StorageService } from '../storage/storage.service';

import { PREVIOUS_VOLUME, SpotifyService } from './spotify.service';

const TEST_AUTH_TOKEN: AuthToken = {
  accessToken: 'test-access',
  tokenType: 'test-type',
  expiry: new Date(Date.UTC(9999, 1, 1, )).toString(),
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
  type: 'device-type',
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
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should requestAuthToken with POST request for non-refresh', fakeAsync(() => {
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

    service.requestAuthToken('test-code', false);
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
    expect(store.dispatch).toHaveBeenCalledWith(new SetAuthToken({
      accessToken: tokenResponse.access_token,
      tokenType: tokenResponse.token_type,
      scope: tokenResponse.scope,
      expiry: tokenResponse.expiry,
      refreshToken: tokenResponse.refresh_token
    }));
  }));

  it('should requestAuthToken with PUT request for refresh', fakeAsync(() => {
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

    service.requestAuthToken('test-code', true);
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
    expect(store.dispatch).toHaveBeenCalledWith(new SetAuthToken({
      accessToken: tokenResponse.access_token,
      tokenType: tokenResponse.token_type,
      scope: tokenResponse.scope,
      expiry: tokenResponse.expiry,
      refreshToken: tokenResponse.refresh_token
    }));
  }));

  it('should output error when requestAuthToken fails', fakeAsync(() => {
    http.post = jasmine.createSpy().and.returnValue(throwError({status: 405}));
    service.requestAuthToken('test-code', false)
      .catch((error) => expect(error).toBeTruthy());
    expect(http.post).toHaveBeenCalled();
    expect(store.dispatch).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  }));

  it('should get current playback on pollCurrentPlayback', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, 200);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(http.get).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player',
      {
        headers: jasmine.any(HttpHeaders),
        observe: 'response'
      });
  }));

  it('should change track if a new track', fakeAsync(() => {
    spyOn(service, 'isTrackSaved');
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, 200);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    const currentTrack = parseTrack({
      ...TEST_TRACK_RESPONSE,
      id: 'old-id'
    });
    trackProducer.next(currentTrack);

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeTrack(parseTrack(TEST_TRACK_RESPONSE), TEST_TRACK_RESPONSE.duration_ms));
    expect(service.isTrackSaved).toHaveBeenCalledOnceWith(TEST_TRACK_RESPONSE.id);
  }));

  it('should not change track if same track playing', fakeAsync(() => {
    spyOn(service, 'isTrackSaved');
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, 200);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangeTrack));
    expect(service.isTrackSaved).not.toHaveBeenCalled();
  }));

  it('should change album if new album', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, 200);
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
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, 200);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangeAlbum));
  }));

  it('should change playlist if new playlist', fakeAsync(() => {
    spyOn(service, 'getPlaylist').and.returnValue(of(TEST_PLAYLIST_RESPONSE));
    const currentPlaylist = {
      ...parsePlaylist(TEST_PLAYLIST_RESPONSE),
      id: 'old-id'
    };
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, 200);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    playlistProducer.next(currentPlaylist);

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).toHaveBeenCalledWith(new ChangePlaylist(parsePlaylist(TEST_PLAYLIST_RESPONSE)));
  }));

  it('should change to playback playlist if no current playlist', fakeAsync(() => {
    spyOn(service, 'getPlaylist').and.returnValue(of(TEST_PLAYLIST_RESPONSE));
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, 200);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    playlistProducer.next(null);

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).toHaveBeenCalledWith(new ChangePlaylist(parsePlaylist(TEST_PLAYLIST_RESPONSE)));
  }));

  it('should not change playlist if playback playlist is current playlist', fakeAsync(() => {
    spyOn(service, 'getPlaylist').and.returnValue(of(TEST_PLAYLIST_RESPONSE));
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, 200);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangePlaylist));
  }));

  it('should remove playlist if context is null and previously had playlist', fakeAsync(() => {
    const playbackResponse = {
      ...TEST_PLAYBACK_RESPONSE,
      context: null
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, 200);
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
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, 200);
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
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, 200);
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
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, 200);
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
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, 200);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    deviceProducer.next(parseDevice({...TEST_DEVICE_RESPONSE, volume_percent: 25}));

    service.pollCurrentPlayback(1000);
    expect(storage.set).toHaveBeenCalledWith(PREVIOUS_VOLUME, '25');
  }));

  it('should not save previous volume value if playback muted and currently muted', fakeAsync(() => {
    const playbackResponse = {
      ...TEST_PLAYBACK_RESPONSE,
      device: {
        ...TEST_DEVICE_RESPONSE,
        volume_percent: 0
      }
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, 200);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    deviceProducer.next(parseDevice({...TEST_DEVICE_RESPONSE, volume_percent: 0}));

    service.pollCurrentPlayback(1000);
    expect(storage.set).not.toHaveBeenCalledWith(PREVIOUS_VOLUME, jasmine.anything());
  }));

  it('should not save previous volume value if playback not muted', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, 200);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    deviceProducer.next(parseDevice({...TEST_DEVICE_RESPONSE, volume_percent: 0}));

    service.pollCurrentPlayback(1000);
    expect(storage.set).not.toHaveBeenCalledWith(PREVIOUS_VOLUME, jasmine.anything());
  }));

  it('should not save previous volume value if playback device is null', fakeAsync(() => {
    const playbackResponse = {
      ...TEST_PLAYBACK_RESPONSE,
      device: null
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, 200);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(storage.set).not.toHaveBeenCalledWith(PREVIOUS_VOLUME, jasmine.anything());
  }));

  it('should change current device if playback device differs from current device', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, 200);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    deviceProducer.next({...parseDevice(TEST_DEVICE_RESPONSE), id: 'old-id'});

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDevice(parseDevice(TEST_DEVICE_RESPONSE)));
  }));

  it('should not change current device if playback device is the current device', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, 200);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangeDevice));
  }));

  it('should not change current device playback device is null', fakeAsync(() => {
    const playbackResponse = {
      ...TEST_PLAYBACK_RESPONSE,
      device: null
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, 200);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangeDevice));
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangeDeviceIsActive));
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangeDeviceVolume));
  }));

  it('should set update rest of track playback states', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, 200);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    trackProducer.next(parseTrack(TEST_TRACK_RESPONSE));

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDeviceIsActive(TEST_DEVICE_RESPONSE.is_active));
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDeviceVolume(TEST_DEVICE_RESPONSE.volume_percent));
    expect(store.dispatch).toHaveBeenCalledWith(new SetProgress(TEST_PLAYBACK_RESPONSE.progress_ms));
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlaying(TEST_PLAYBACK_RESPONSE.is_playing));
    expect(store.dispatch).toHaveBeenCalledWith(new SetShuffle(TEST_PLAYBACK_RESPONSE.shuffle_state));
    expect(store.dispatch).toHaveBeenCalledWith(new SetIdle(false));
  }));

  it('should set playback to idle when playback not available', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, 204);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).toHaveBeenCalledWith(new SetIdle(true));
  }));

  it('should set playback to idle when playback is null', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(null, 200);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).toHaveBeenCalledWith(new SetIdle(true));
  }));

  it('should set playback to idle when playback track is null', fakeAsync(() => {
    const playbackResponse = {
      ...TEST_PLAYBACK_RESPONSE,
      item: null
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, 200);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(store.dispatch).toHaveBeenCalledWith(new SetIdle(true));
  }));

  it('should set playback to idle and log error when unhandled status code', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(TEST_PLAYBACK_RESPONSE, 405);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback(1000);
    expect(console.error).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith(new SetIdle(true));
  }));

  it('should set track position when valid', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
    service.setTrackPosition(50);
    expect(http.put).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player/seek',
      {},
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams)
      });
    const spyParams = (http.put as jasmine.Spy).calls.mostRecent().args[2].params as HttpParams;
    expect(spyParams.keys().length).toEqual(1);
    expect(spyParams.get('position_ms')).toEqual('50');
    expect(store.dispatch).toHaveBeenCalledWith(new SetProgress(50));
  }));

  it('should set track position to duration when greater than', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
    durationProducer.next(100);
    service.setTrackPosition(101);
    expect(store.dispatch).toHaveBeenCalledWith(new SetProgress(100));
  }));

  it('should set track position to 0 when negative', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
    service.setTrackPosition(-1);
    expect(store.dispatch).toHaveBeenCalledWith(new SetProgress(0));
  }));

  it('should send play request when isPlaying', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
    service.setPlaying(true);
    expect(http.put).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player/play',
      {},
      { headers: jasmine.any(HttpHeaders) }
    );
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlaying(true));
  }));

  it('should send pause request when not isPlaying', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
    service.setPlaying(false);
    expect(http.put).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player/pause',
      {},
      { headers: jasmine.any(HttpHeaders) }
    );
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlaying(false));
  }));

  it('should toggle playing off', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
    isPlayingProducer.next(true);
    service.togglePlaying();
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlaying(false));
  }));

  it('should toggle playing on', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
    isPlayingProducer.next(false);
    service.togglePlaying();
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlaying(true));
  }));

  it('should send skip previous request when within threshold', fakeAsync(() => {
    http.post = jasmine.createSpy().and.returnValue(of(null));
    progressProducer.next(2999);
    durationProducer.next(6001);
    service.skipPrevious(false);
    expect(http.post).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player/previous',
      {},
      { headers: jasmine.any(HttpHeaders) }
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
    http.post = jasmine.createSpy().and.returnValue(of(null));
    progressProducer.next(3001);
    durationProducer.next(5999);
    service.skipPrevious(false);
    expect(http.post).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player/previous',
      {},
      { headers: jasmine.any(HttpHeaders) }
    );
  }));

  it('should send skip previous request when forced', fakeAsync(() => {
    http.post = jasmine.createSpy().and.returnValue(of(null));
    progressProducer.next(2999);
    durationProducer.next(6001);
    service.skipPrevious(true);
    expect(http.post).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player/previous',
      {},
      { headers: jasmine.any(HttpHeaders) }
    );
  }));

  it('should send skip next request', fakeAsync(() => {
    http.post = jasmine.createSpy().and.returnValue(of(null));
    service.skipNext();
    expect(http.post).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player/next',
      {},
      { headers: jasmine.any(HttpHeaders) }
    );
  }));

  it('should send shuffle on request when isShuffle', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
    service.setShuffle(true);
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
    expect(store.dispatch).toHaveBeenCalledWith(new SetShuffle(true));
  }));

  it('should send shuffle off request when not isShuffle', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
    service.setShuffle(false);
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
    expect(store.dispatch).toHaveBeenCalledWith(new SetShuffle(false));
  }));

  it('should toggle shuffle off', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
    isShuffleProducer.next(true);
    service.toggleShuffle();
    expect(store.dispatch).toHaveBeenCalledWith(new SetShuffle(false));
  }));

  it('should toggle shuffle on', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
    isShuffleProducer.next(false);
    service.toggleShuffle();
    expect(store.dispatch).toHaveBeenCalledWith(new SetShuffle(true));
  }));

  it('should send volume request', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
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
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDeviceVolume(50));
  }));

  it('should set volume to 100 when greater', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
    service.setVolume(101);
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDeviceVolume(100));
  }));

  it('should set volume to 0 when negative', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
    service.setVolume(-1);
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDeviceVolume(0));
  }));

  it('should send repeat state request', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
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
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeRepeatState('context'));
  }));

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

  it('should send add save track request', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
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
    expect(store.dispatch).toHaveBeenCalledWith(new SetLiked(true));
  }));

  it('should send remove save track request', fakeAsync(() => {
    http.delete = jasmine.createSpy().and.returnValue(of(null));
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
    expect(store.dispatch).toHaveBeenCalledWith(new SetLiked(false));
  }));

  it('should toggle liked off for current track', fakeAsync(() => {
    http.delete = jasmine.createSpy().and.returnValue(of(null));
    isLikedProducer.next(true);
    service.toggleLiked();
    expect(http.delete).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith(new SetLiked(false));
  }));

  it('should toggle liked on for current track', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
    isLikedProducer.next(false);
    service.toggleLiked();
    expect(http.put).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith(new SetLiked(true));
  }));

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

  it('should set available devices', fakeAsync(() => {
    const device2: DeviceResponse = {
      ...TEST_DEVICE_RESPONSE,
      id: 'test-device-2'
    };
    const response: MultipleDevicesResponse = {
      devices: [
        TEST_DEVICE_RESPONSE,
        device2
      ]
    };
    http.get = jasmine.createSpy().and.returnValue(of(response));
    service.fetchAvailableDevices();
    expect(http.get).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player/devices',
      { headers: jasmine.any(HttpHeaders) }
    );
    expect(store.dispatch).toHaveBeenCalledWith(new SetAvailableDevices([parseDevice(TEST_DEVICE_RESPONSE), parseDevice(device2)]));
  }));

  it('should send set device playing request', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
    const device: DeviceModel = {
      ...parseDevice(TEST_DEVICE_RESPONSE),
      id: 'new-device'
    };
    service.setDevice(device, true);
    expect(http.put).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player',
      {
        device_ids: ['new-device'],
        play: true
      },
      { headers: jasmine.any(HttpHeaders) }
    );
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDevice(device));
  }));

  it('should send set device not playing request', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
    const device: DeviceModel = {
      ...parseDevice(TEST_DEVICE_RESPONSE),
      id: 'new-device'
    };
    service.setDevice(device, false);
    expect(http.put).toHaveBeenCalledOnceWith(
      'https://api.spotify.com/v1/me/player',
      {
        device_ids: ['new-device'],
        play: false
      },
      { headers: jasmine.any(HttpHeaders) }
    );
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDevice(device));
  }));

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
    expect(store.dispatch).toHaveBeenCalledWith(new SetAuthToken(null));
    expect(service['state']).toBeNull();
    expect(service['authToken']).toBeNull();
    expect(storage.remove).toHaveBeenCalledOnceWith('STATE');
    expect(storage.removeAuthToken).toHaveBeenCalledTimes(1);
  });

  it('should request and set new AuthToken if expired', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
    spyOn(service, 'requestAuthToken').and.returnValue(Promise.resolve(null));
    const expiredToken = {...TEST_AUTH_TOKEN};
    expiredToken.expiry = (new Date(Date.UTC(1999, 1, 1))).toString();
    tokenProducer.next(expiredToken);
    service.setPlaying(true);
    expect(service.requestAuthToken).toHaveBeenCalledWith(expiredToken.refreshToken, true);
  }));

  it('should logout if failed to refresh token', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
    spyOn(service, 'requestAuthToken').and.returnValue(Promise.reject('error'));
    spyOn(service, 'logout');
    const expiredToken = {...TEST_AUTH_TOKEN};
    expiredToken.expiry = (new Date(Date.UTC(1999, 1, 1))).toString();
    tokenProducer.next(expiredToken);
    service.setPlaying(true);
    flushMicrotasks(); // complete the Promise catch
    expect(console.error).toHaveBeenCalled();
    expect(service.logout).toHaveBeenCalled();
  }));

  it('should keep current token if not expired', fakeAsync(() => {
    http.put = jasmine.createSpy().and.returnValue(of(null));
    service.requestAuthToken = jasmine.createSpy().and.returnValue(Promise.resolve(null));
    tokenProducer.next(TEST_AUTH_TOKEN);
    service.setPlaying(true);
    expect(service.requestAuthToken).not.toHaveBeenCalled();
    expect(service['authToken']).toEqual(TEST_AUTH_TOKEN);
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
