import { HttpClient, HttpHeaders, HttpParams, HttpStatusCode } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { AppConfig } from '../../../app.config';
import {
  ChangeDevice,
  ChangeDeviceVolume, ChangePlaylist,
  ChangeRepeatState, SetAvailableDevices, SetLiked,
  SetPlaying,
  SetProgress,
  SetShuffle
} from '../../../core/playback/playback.actions';
import { DeviceModel, TrackModel } from '../../../core/playback/playback.model';
import { SpotifyEndpoints } from '../../../core/spotify/spotify-endpoints';
import { NgxsSelectorMock } from '../../../core/testing/ngxs-selector-mock';
import { getTestAppConfig, getTestDeviceResponse, getTestPlaylistResponse, getTestTrackResponse } from '../../../core/testing/test-models';
import { generateResponse } from '../../../core/testing/test-util';
import { parseDevice, parsePlaylist, parseTrack } from '../../../core/util';
import { DeviceResponse, MultipleDevicesResponse } from '../../../models/device.model';
import { PlaylistResponse } from '../../../models/playlist.model';
import { SpotifyAuthService } from '../auth/spotify-auth.service';
import { SpotifyControlsService } from './spotify-controls.service';

describe('SpotifyControlsService', () => {
  const mockSelectors = new NgxsSelectorMock<SpotifyControlsService>();
  let service: SpotifyControlsService;
  let auth: SpotifyAuthService;
  let http: HttpClient;
  let store: Store;

  let trackProducer: BehaviorSubject<TrackModel>;
  let isPlayingProducer: BehaviorSubject<boolean>;
  let isShuffleProducer: BehaviorSubject<boolean>;
  let progressProducer: BehaviorSubject<number>;
  let durationProducer: BehaviorSubject<number>;
  let isLikedProducer: BehaviorSubject<boolean>;

  beforeEach(() => {
    AppConfig.settings = getTestAppConfig();

    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([], {developmentMode: true}),
        HttpClientTestingModule
      ],
      providers: [
        SpotifyControlsService,
        MockProvider(SpotifyAuthService),
        MockProvider(HttpClient),
        MockProvider(Store)
      ]
    });
    service = TestBed.inject(SpotifyControlsService);
    auth = TestBed.inject(SpotifyAuthService);
    http = TestBed.inject(HttpClient);
    store = TestBed.inject(Store);

    trackProducer = mockSelectors.defineNgxsSelector<TrackModel>(service, 'track$', parseTrack(getTestTrackResponse()));
    isPlayingProducer = mockSelectors.defineNgxsSelector<boolean>(service, 'isPlaying$', true);
    isShuffleProducer = mockSelectors.defineNgxsSelector<boolean>(service, 'isShuffle$', true);
    progressProducer = mockSelectors.defineNgxsSelector<number>(service, 'progress$', 10);
    durationProducer = mockSelectors.defineNgxsSelector<number>(service, 'duration$', 100);
    isLikedProducer = mockSelectors.defineNgxsSelector<boolean>(service, 'isLiked$', true);

    service.initSubscriptions();
    store.dispatch = jasmine.createSpy().and.returnValue(of(null));
    auth.getAuthHeaders = jasmine.createSpy().and.returnValue(new HttpHeaders({
      Authorization: 'test-token'
    }));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set track position when valid', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    service.setTrackPosition(50);
    expect(http.put).toHaveBeenCalledOnceWith(
      SpotifyEndpoints.getSeekEndpoint(),
      {},
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams),
        observe: 'response',
        responseType: 'text'
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
      SpotifyEndpoints.getPlayEndpoint(),
      {},
      { headers: jasmine.any(HttpHeaders), observe: 'response', responseType: 'text' }
    );
    expect(store.dispatch).toHaveBeenCalledWith(new SetPlaying(true));
  }));

  it('should send pause request when not isPlaying', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    service.setPlaying(false);
    expect(http.put).toHaveBeenCalledOnceWith(
      SpotifyEndpoints.getPauseEndpoint(),
      {},
      { headers: jasmine.any(HttpHeaders), observe: 'response', responseType: 'text' }
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
      SpotifyEndpoints.getPreviousEndpoint(),
      {},
      { headers: jasmine.any(HttpHeaders), observe: 'response', responseType: 'text' }
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
      SpotifyEndpoints.getPreviousEndpoint(),
      {},
      { headers: jasmine.any(HttpHeaders), observe: 'response', responseType: 'text' }
    );
  }));

  it('should send skip previous request when forced', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.post = jasmine.createSpy().and.returnValue(of(response));
    progressProducer.next(2999);
    durationProducer.next(6001);
    service.skipPrevious(true);
    expect(http.post).toHaveBeenCalledOnceWith(
      SpotifyEndpoints.getPreviousEndpoint(),
      {},
      { headers: jasmine.any(HttpHeaders), observe: 'response', responseType: 'text' }
    );
  }));

  it('should send skip next request', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.post = jasmine.createSpy().and.returnValue(of(response));
    service.skipNext();
    expect(http.post).toHaveBeenCalledOnceWith(
      SpotifyEndpoints.getNextEndpoint(),
      {},
      { headers: jasmine.any(HttpHeaders), observe: 'response', responseType: 'text' }
    );
  }));

  it('should send shuffle on request when isShuffle', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    service.setShuffle(true);
    expect(http.put).toHaveBeenCalledOnceWith(
      SpotifyEndpoints.getShuffleEndpoint(),
      {},
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams),
        observe: 'response',
        responseType: 'text'
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
      SpotifyEndpoints.getShuffleEndpoint(),
      {},
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams),
        observe: 'response',
        responseType: 'text'
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
      SpotifyEndpoints.getVolumeEndpoint(),
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
      SpotifyEndpoints.getRepeatEndpoint(),
      {},
      {
        headers: jasmine.any(HttpHeaders),
        params: jasmine.any(HttpParams),
        observe: 'response',
        responseType: 'text'
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
      SpotifyEndpoints.getCheckSavedEndpoint(),
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
      SpotifyEndpoints.getSavedTracksEndpoint(),
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
      SpotifyEndpoints.getSavedTracksEndpoint(),
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
      ...getTestPlaylistResponse(),
      id: 'playlist-new-id'
    };
    const response = generateResponse<PlaylistResponse>(playlistResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    service.setPlaylist('playlist-new-id');
    expect(http.get).toHaveBeenCalledOnceWith(
      `${SpotifyEndpoints.getPlaylistsEndpoint()}/playlist-new-id`,
      { headers: jasmine.any(HttpHeaders), observe: 'response' }
    );
    expect(store.dispatch).toHaveBeenCalledWith(new ChangePlaylist(parsePlaylist(playlistResponse)));
  });

  it('should set available devices', fakeAsync(() => {
    const device2: DeviceResponse = {
      ...getTestDeviceResponse(),
      id: 'test-device-2'
    };
    const devicesResponse: MultipleDevicesResponse = {
      devices: [
        getTestDeviceResponse(),
        device2
      ]
    };
    const response = generateResponse<MultipleDevicesResponse>(devicesResponse, HttpStatusCode.Ok);
    http.get = jasmine.createSpy().and.returnValue(of(response));
    service.fetchAvailableDevices();
    expect(http.get).toHaveBeenCalledOnceWith(
      SpotifyEndpoints.getDevicesEndpoint(),
      { headers: jasmine.any(HttpHeaders), observe: 'response' }
    );
    expect(store.dispatch).toHaveBeenCalledWith(new SetAvailableDevices([parseDevice(getTestDeviceResponse()), parseDevice(device2)]));
  }));

  it('should send set device playing request', fakeAsync(() => {
    const response = generateResponse(null, HttpStatusCode.NoContent);
    http.put = jasmine.createSpy().and.returnValue(of(response));
    const device: DeviceModel = {
      ...parseDevice(getTestDeviceResponse()),
      id: 'new-device'
    };
    service.setDevice(device, true);
    expect(http.put).toHaveBeenCalledOnceWith(
      SpotifyEndpoints.getPlaybackEndpoint(),
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
      ...parseDevice(getTestDeviceResponse()),
      id: 'new-device'
    };
    service.setDevice(device, false);
    expect(http.put).toHaveBeenCalledOnceWith(
      SpotifyEndpoints.getPlaybackEndpoint(),
      {
        device_ids: ['new-device'],
        play: false
      },
      { headers: jasmine.any(HttpHeaders), observe: 'response' }
    );
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDevice(device));
  }));
});
