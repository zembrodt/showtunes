import { HttpClient, HttpStatusCode } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import {
  getTestActionsResponse,
  getTestAlbumResponse, getTestAppConfig, getTestDeviceResponse, getTestPlaybackResponse,
  getTestPlaylistResponse,
  getTestTrackResponse,
} from 'src/app/core/testing/test-responses';
import { AppConfig } from '../../../app.config';
import {
  ChangeAlbum,
  ChangeDevice,
  ChangeDeviceIsActive,
  ChangeDeviceVolume,
  ChangePlaylist,
  ChangeTrack, SetDisallows, SetPlayerState, SetPlaying, SetProgress, SetShuffle, SetSmartShuffle
} from '../../../core/playback/playback.actions';
import { AlbumModel, DeviceModel, PlayerState, PlaylistModel, TrackModel } from '../../../core/playback/playback.model';
import { SpotifyEndpoints } from '../../../core/spotify/spotify-endpoints';
import { NgxsSelectorMock } from '../../../core/testing/ngxs-selector-mock';
import { generateResponse } from '../../../core/testing/test-util';
import { parseAlbum, parseDevice, parseDisallows, parsePlaylist, parseTrack } from '../../../core/util';
import { CurrentPlaybackResponse } from '../../../models/current-playback.model';
import { PREVIOUS_VOLUME, StorageService } from '../../storage/storage.service';
import { SpotifyControlsService } from '../controls/spotify-controls.service';
import { SpotifyPollingService } from './spotify-polling.service';

describe('SpotifyPollingService', () => {
  const mockSelectors = new NgxsSelectorMock<SpotifyPollingService>();
  let service: SpotifyPollingService;
  let controls: SpotifyControlsService;
  let http: HttpClient;
  let store: Store;
  let storage: StorageService;

  let trackProducer: BehaviorSubject<TrackModel>;
  let albumProducer: BehaviorSubject<AlbumModel>;
  let playlistProducer: BehaviorSubject<PlaylistModel>;
  let deviceProducer: BehaviorSubject<DeviceModel>;

  beforeEach(() => {
    AppConfig.settings = getTestAppConfig();

    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([], {developmentMode: true}),
        HttpClientTestingModule
      ],
      providers: [
        SpotifyPollingService,
        MockProvider(SpotifyControlsService),
        MockProvider(HttpClient),
        MockProvider(Store),
        MockProvider(StorageService)
      ]
    });
    service = TestBed.inject(SpotifyPollingService);
    controls = TestBed.inject(SpotifyControlsService);
    store = TestBed.inject(Store);
    http = TestBed.inject(HttpClient);
    storage = TestBed.inject(StorageService);

    trackProducer = mockSelectors.defineNgxsSelector<TrackModel>(service, 'track$', parseTrack(getTestTrackResponse()));
    albumProducer = mockSelectors.defineNgxsSelector<AlbumModel>(service, 'album$', parseAlbum(getTestAlbumResponse()));
    playlistProducer = mockSelectors.defineNgxsSelector<PlaylistModel>(service, 'playlist$', parsePlaylist(getTestPlaylistResponse()));
    deviceProducer = mockSelectors.defineNgxsSelector<DeviceModel>(service, 'device$', parseDevice(getTestDeviceResponse()));

    service.initSubscriptions();
    store.dispatch = jasmine.createSpy().and.returnValue(of(null));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get current playback on pollCurrentPlayback', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(getTestPlaybackResponse(), HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback();

    expect(http.get).toHaveBeenCalledOnceWith(
      SpotifyEndpoints.getPlaybackEndpoint(),
      {
        observe: 'response'
      });
  }));

  it('should change track if a new track', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(getTestPlaybackResponse(), HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    const currentTrack = parseTrack({
      ...getTestTrackResponse(),
      id: 'old-id'
    });
    trackProducer.next(currentTrack);

    service.pollCurrentPlayback();
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeTrack(parseTrack(getTestTrackResponse())));
    expect(controls.isTrackSaved).toHaveBeenCalledOnceWith(getTestTrackResponse().id);
  }));

  it('should not change track if same track playing', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(getTestPlaybackResponse(), HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback();
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangeTrack));
    expect(controls.isTrackSaved).not.toHaveBeenCalled();
  }));

  it('should change album if new album', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(getTestPlaybackResponse(), HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    const currentAlbum = parseAlbum({
      ...getTestAlbumResponse(),
      id: 'old-id'
    });
    albumProducer.next(currentAlbum);

    service.pollCurrentPlayback();
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeAlbum(parseAlbum(getTestAlbumResponse())));
  }));

  it('should not change album if same album', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(getTestPlaybackResponse(), HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback();
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangeAlbum));
  }));

  it('should change playlist if new playlist', fakeAsync(() => {
    const currentPlaylist = {
      ...parsePlaylist(getTestPlaylistResponse()),
      id: 'old-id'
    };
    const response = generateResponse<CurrentPlaybackResponse>(getTestPlaybackResponse(), HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    playlistProducer.next(currentPlaylist);

    service.pollCurrentPlayback();
    expect(controls.setPlaylist).toHaveBeenCalledWith(getTestPlaylistResponse().id);
  }));

  it('should change to playback playlist if no current playlist', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(getTestPlaybackResponse(), HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    playlistProducer.next(null);

    service.pollCurrentPlayback();
    expect(controls.setPlaylist).toHaveBeenCalledWith(getTestPlaylistResponse().id);
  }));

  it('should not change playlist if playback playlist is current playlist', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(getTestPlaybackResponse(), HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback();
    expect(controls.setPlaylist).not.toHaveBeenCalled();
  }));

  it('should remove playlist if context is null and previously had playlist', fakeAsync(() => {
    const playbackResponse = {
      ...getTestPlaybackResponse(),
      context: null
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback();
    expect(store.dispatch).toHaveBeenCalledWith(new ChangePlaylist(null));
  }));

  it('should remove playlist if context type is null and previously had playlist', fakeAsync(() => {
    const playbackResponse = {
      ...getTestPlaybackResponse(),
      context: {
        ...getTestPlaybackResponse().context,
        type: null
      }
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback();
    expect(store.dispatch).toHaveBeenCalledWith(new ChangePlaylist(null));
  }));

  it('should remove playlist if context type is not playlist and previously had playlist', fakeAsync(() => {
    const playbackResponse = {
      ...getTestPlaybackResponse(),
      context: {
        ...getTestPlaybackResponse().context,
        type: 'test'
      }
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback();
    expect(store.dispatch).toHaveBeenCalledWith(new ChangePlaylist(null));
  }));

  it('should not change playlist if no playback playlist and no previous playlist', fakeAsync(() => {
    const playbackResponse = {
      ...getTestPlaybackResponse(),
      context: {
        ...getTestPlaybackResponse().context,
        type: 'test'
      }
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    playlistProducer.next(null);

    service.pollCurrentPlayback();
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangePlaylist));
  }));

  it('should save previous volume value if playback muted and not previously muted', fakeAsync(() => {
    const playbackResponse = {
      ...getTestPlaybackResponse(),
      device: {
        ...getTestDeviceResponse(),
        volume_percent: 0
      }
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    deviceProducer.next(parseDevice({...getTestDeviceResponse(), volume_percent: 25}));

    service.pollCurrentPlayback();
    expect(storage.set).toHaveBeenCalledWith(PREVIOUS_VOLUME, '25');
  }));

  it('should not save previous volume value if playback muted and currently muted', fakeAsync(() => {
    const playbackResponse = {
      ...getTestPlaybackResponse(),
      device: {
        ...getTestDeviceResponse(),
        volume_percent: 0
      }
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    deviceProducer.next(parseDevice({...getTestDeviceResponse(), volume_percent: 0}));

    service.pollCurrentPlayback();
    expect(storage.set).not.toHaveBeenCalledWith(PREVIOUS_VOLUME, jasmine.anything());
  }));

  it('should not save previous volume value if playback not muted', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(getTestPlaybackResponse(), HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    deviceProducer.next(parseDevice({...getTestDeviceResponse(), volume_percent: 0}));

    service.pollCurrentPlayback();
    expect(storage.set).not.toHaveBeenCalledWith(PREVIOUS_VOLUME, jasmine.anything());
  }));

  it('should not save previous volume value if playback device is null', fakeAsync(() => {
    const playbackResponse = {
      ...getTestPlaybackResponse(),
      device: null
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback();
    expect(storage.set).not.toHaveBeenCalledWith(PREVIOUS_VOLUME, jasmine.anything());
  }));

  it('should change current device if playback device differs from current device', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(getTestPlaybackResponse(), HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    deviceProducer.next({...parseDevice(getTestDeviceResponse()), id: 'old-id'});

    service.pollCurrentPlayback();
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDevice(parseDevice(getTestDeviceResponse())));
  }));

  it('should not change current device if playback device is the current device', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(getTestPlaybackResponse(), HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback();
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangeDevice));
  }));

  it('should not change current device playback device is null', fakeAsync(() => {
    const playbackResponse = {
      ...getTestPlaybackResponse(),
      device: null
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback();
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangeDevice));
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangeDeviceIsActive));
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(ChangeDeviceVolume));
  }));

  it('should set update rest of track playback states', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(getTestPlaybackResponse(), HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    trackProducer.next(parseTrack(getTestTrackResponse()));

    service.pollCurrentPlayback();
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDeviceIsActive(getTestDeviceResponse().is_active));
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDeviceVolume(getTestDeviceResponse().volume_percent));
    expect(store.dispatch).toHaveBeenCalledWith(new SetProgress(getTestPlaybackResponse().progress_ms));
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlaying(getTestPlaybackResponse().is_playing));
    expect(store.dispatch).toHaveBeenCalledWith(new SetShuffle(getTestPlaybackResponse().shuffle_state));
    expect(store.dispatch).toHaveBeenCalledWith(new SetSmartShuffle(getTestPlaybackResponse().smart_shuffle));
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlayerState(PlayerState.Playing));
    expect(store.dispatch).toHaveBeenCalledWith(new SetDisallows(parseDisallows(getTestActionsResponse())));
  }));

  it('should set playback to idle when playback not available', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(getTestPlaybackResponse(), HttpStatusCode.NoContent);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback();
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlayerState(PlayerState.Idling));
  }));

  it('should set playback to idle when playback is null', fakeAsync(() => {
    const response = generateResponse<CurrentPlaybackResponse>(null, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback();
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlayerState(PlayerState.Idling));
  }));

  it('should set playback to idle when playback track is null', fakeAsync(() => {
    const playbackResponse = {
      ...getTestPlaybackResponse(),
      item: null
    };
    const response = generateResponse<CurrentPlaybackResponse>(playbackResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));

    service.pollCurrentPlayback();
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlayerState(PlayerState.Idling));
  }));
});
