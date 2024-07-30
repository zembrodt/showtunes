import { TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { ImageResponse } from '../../models/image.model';
import { getTestDisallowsModel } from '../testing/test-models';
import {
  ChangeAlbum,
  ChangeDevice,
  ChangeDeviceIsActive,
  ChangeDeviceVolume,
  ChangePlaylist,
  ChangeRepeatState,
  ChangeTrack,
  SetAvailableDevices, SetDisallows,
  SetLiked,
  SetPlayerState,
  SetPlaying,
  SetProgress,
  SetShuffle, SetSmartShuffle
} from './playback.actions';
import {
  AlbumModel,
  ArtistModel,
  DeviceModel,
  DisallowsModel,
  PLAYBACK_STATE_NAME,
  PlayerState,
  PlaylistModel,
  TrackModel
} from './playback.model';
import { PlaybackState } from './playback.state';

const TEST_ARTIST_1: ArtistModel = {
  name: 'artist-1',
  href: 'artist-href-1'
};

const TEST_ARTIST_2: ArtistModel = {
  name: 'artist-2',
  href: 'artist-href-2'
};

const TEST_TRACK: TrackModel = {
  id: 'track-id',
  title: 'test-track',
  duration: 100,
  artists: [
    TEST_ARTIST_1,
    TEST_ARTIST_2
  ],
  uri: 'test:track:uri',
  href: 'track-href'
};

const TEST_COVER_ART = {
  width: 500,
  height: 500,
  url: 'album-art-url'
};

const TEST_ALBUM: AlbumModel = {
  id: 'album-id',
  name: 'test-album',
  releaseDate: 'release',
  totalTracks: 10,
  type: 'album',
  artists: [
    'test-artist-1',
    'test-artist-2'
  ],
  coverArt: TEST_COVER_ART,
  uri: 'test:album:uri',
  href: 'album-href'
};

const TEST_PLAYLIST: PlaylistModel = {
  id: 'playlist-id',
  name: 'test-playlist',
  href: 'playlist-href'
};

const TEST_DEVICE_1: DeviceModel = {
  id: 'device-id-1',
  name: 'test-device-1',
  type: 'device-type',
  volume: 50,
  isActive: true,
  isPrivateSession: true,
  isRestricted: true,
  icon: 'device-icon'
};

const TEST_DEVICE_2: DeviceModel = {
  ...TEST_DEVICE_1,
  id: 'device-id-2',
  name: 'test-device-2'
};

describe('PlaybackState', () => {
  let store: Store;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([PlaybackState], {developmentMode: true})]
    });
    store = TestBed.inject(Store);
    store.reset({
      ...store.snapshot(),
      SHOWTUNES_PLAYBACK: {
        track: TEST_TRACK,
        album: TEST_ALBUM,
        playlist: TEST_PLAYLIST,
        device: TEST_DEVICE_1,
        availableDevices: [
          TEST_DEVICE_1,
          TEST_DEVICE_2
        ],
        progress: 0,
        isPlaying: true,
        isShuffle: true,
        isSmartShuffle: true,
        repeatState: 'context',
        isLiked: true,
        playerState: PlayerState.Idling,
        disallows: getTestDisallowsModel()
      }
    });
  });

  it('should select track', () => {
    const track = selectTrack(store);
    expect(track).toEqual(TEST_TRACK);
  });

  it('should select album', () => {
    const album = selectAlbum(store);
    expect(album).toEqual(TEST_ALBUM);
  });

  it('should select playlist', () => {
    const playlist = selectPlaylist(store);
    expect(playlist).toEqual(TEST_PLAYLIST);
  });

  it('should select coverArt', () => {
    const coverArt = selectCoverArt(store);
    expect(coverArt).toEqual(TEST_COVER_ART);
  });

  it('should select device', () => {
    const device = selectDevice(store);
    expect(device).toEqual(TEST_DEVICE_1);
  });

  it('should select deviceVolume', () => {
    const deviceVolume = selectDeviceVolume(store);
    expect(deviceVolume).toEqual(TEST_DEVICE_1.volume);
  });

  it('should select availableDevices', () => {
    const availableDevices = selectAvailableDevices(store);
    expect(availableDevices).toEqual([TEST_DEVICE_1, TEST_DEVICE_2]);
  });

  it('should select progress', () => {
    const progress = selectProgress(store);
    expect(progress).toEqual(0);
  });

  it('should select duration', () => {
    const duration = selectDuration(store);
    expect(duration).toEqual(100);
  });

  it('should select isPlaying', () => {
    const isPlaying = selectIsPlaying(store);
    expect(isPlaying).toBeTrue();
  });

  it('should select isShuffle', () => {
    const isShuffle = selectIsShuffle(store);
    expect(isShuffle).toBeTrue();
  });

  it('should select isSmartShuffle', () => {
    const isSmartShuffle = selectIsSmartShuffle(store);
    expect(isSmartShuffle).toBeTrue();
  });

  it('should select repeat', () => {
    const repeat = selectRepeat(store);
    expect(repeat).toEqual('context');
  });

  it('should select isLiked', () => {
    const isLiked = selectIsLiked(store);
    expect(isLiked).toBeTrue();
  });

  it('should select playerState', () => {
    const state = selectPlayerState(store);
    expect(state).toEqual(PlayerState.Idling);
  });

  it('should select disallows', () => {
    const disallows = selectDisallows(store);
    expect(disallows).toEqual(getTestDisallowsModel());
  });

  it('should change track', () => {
    const updatedTrack: TrackModel = {
      ...TEST_TRACK,
      id: 'new-track'
    };
    store.dispatch(new ChangeTrack(updatedTrack));
    const track = selectTrack(store);
    expect(track).toEqual(updatedTrack);
  });

  it('should change album', () => {
    const updatedAlbum: AlbumModel = {
      ...TEST_ALBUM,
      id: 'new-album'
    };
    store.dispatch(new ChangeAlbum(updatedAlbum));
    const album = selectAlbum(store);
    expect(album).toEqual(updatedAlbum);
  });

  it('should change playlist', () => {
    const updatedPlaylist: PlaylistModel = {
      ...TEST_PLAYLIST,
      id: 'new-playlist'
    };
    store.dispatch(new ChangePlaylist(updatedPlaylist));
    const playlist = selectPlaylist(store);
    expect(playlist).toEqual(updatedPlaylist);
  });

  it('should change device', () => {
    store.dispatch(new ChangeDevice(TEST_DEVICE_2));
    const device = selectDevice(store);
    expect(device).toEqual(TEST_DEVICE_2);
  });

  it('should change deviceVolume', () => {
    store.dispatch(new ChangeDeviceVolume(0));
    const deviceVolume = selectDeviceVolume(store);
    expect(deviceVolume).toEqual(0);
  });

  it('should change device.isActive to false', () => {
    store.dispatch(new ChangeDeviceIsActive(false));
    const device = selectDevice(store);
    expect(device.isActive).toBeFalse();
  });

  it('should change device.isActive to true', () => {
    store.reset({
      ...store.snapshot(),
      SHOWTUNES_PLAYBACK: {
        device: {
          ...TEST_DEVICE_1,
          isActive: false
        }
      }
    });
    store.dispatch(new ChangeDeviceIsActive(true));
    const device = selectDevice(store);
    expect(device.isActive).toBeTrue();
  });

  it('should set availableDevices', () => {
    const updatedDevices = [
      {...TEST_DEVICE_1, id: 'updated-device-1'},
      {...TEST_DEVICE_2, id: 'updated-device-2'}
    ];
    store.dispatch(new SetAvailableDevices(updatedDevices));
    const availableDevices = selectAvailableDevices(store);
    expect(availableDevices).toEqual(updatedDevices);
  });

  it('should set progress', () => {
    store.dispatch(new SetProgress(50));
    const progress = selectProgress(store);
    expect(progress).toEqual(50);
  });

  it('should set isPlaying', () => {
    store.dispatch(new SetPlaying(false));
    const isPlaying = selectIsPlaying(store);
    expect(isPlaying).toBeFalse();
  });

  it('should set isShuffle', () => {
    store.dispatch(new SetShuffle(false));
    const isShuffle = selectIsShuffle(store);
    expect(isShuffle).toBeFalse();
  });

  it('should set isSmartShuffle', () => {
    store.dispatch(new SetSmartShuffle(false));
    const isSmartShuffle = selectIsSmartShuffle(store);
    expect(isSmartShuffle).toBeFalse();
  });

  it('should change repeat', () => {
    store.dispatch(new ChangeRepeatState('none'));
    const repeat = selectRepeat(store);
    expect(repeat).toEqual('none');
  });

  it('should set isLiked', () => {
    store.dispatch(new SetLiked(false));
    const isLiked = selectIsLiked(store);
    expect(isLiked).toBeFalse();
  });

  it('should set playerState', () => {
    store.dispatch(new SetPlayerState(PlayerState.Refreshing));
    const state = selectPlayerState(store);
    expect(state).toEqual(PlayerState.Refreshing);
  });

  it('should set disallows', () => {
    const updatedDisallows = {
      ...getTestDisallowsModel(),
      shuffle: true
    };
    store.dispatch(new SetDisallows(updatedDisallows));
    const disallows = selectDisallows(store);
    expect(disallows.shuffle).toBeTrue();
  });
});

function selectTrack(store: Store): TrackModel {
  return store.selectSnapshot(state => state[PLAYBACK_STATE_NAME].track);
}

function selectAlbum(store: Store): AlbumModel {
  return store.selectSnapshot(state => state[PLAYBACK_STATE_NAME].album);
}

function selectPlaylist(store: Store): PlaylistModel {
  return store.selectSnapshot(state => state[PLAYBACK_STATE_NAME].playlist);
}

function selectCoverArt(store: Store): ImageResponse {
  return selectAlbum(store).coverArt;
}

function selectDevice(store: Store): DeviceModel {
  return store.selectSnapshot(state => state[PLAYBACK_STATE_NAME].device);
}

function selectDeviceVolume(store: Store): number {
  return selectDevice(store).volume;
}

function selectAvailableDevices(store: Store): DeviceModel[] {
  return store.selectSnapshot(state => state[PLAYBACK_STATE_NAME].availableDevices);
}

function selectProgress(store: Store): number {
  return store.selectSnapshot(state => state[PLAYBACK_STATE_NAME].progress);
}

function selectDuration(store: Store): number {
  return store.selectSnapshot(state => state[PLAYBACK_STATE_NAME].track.duration);
}

function selectIsPlaying(store: Store): boolean {
  return store.selectSnapshot(state => state[PLAYBACK_STATE_NAME].isPlaying);
}

function selectIsShuffle(store: Store): boolean {
  return store.selectSnapshot(state => state[PLAYBACK_STATE_NAME].isShuffle);
}

function selectIsSmartShuffle(store: Store): boolean {
  return store.selectSnapshot(state => state[PLAYBACK_STATE_NAME].isSmartShuffle);
}

function selectRepeat(store: Store): string {
  return store.selectSnapshot(state => state[PLAYBACK_STATE_NAME].repeatState);
}

function selectIsLiked(store: Store): boolean {
  return store.selectSnapshot(state => state[PLAYBACK_STATE_NAME].isLiked);
}

function selectPlayerState(store: Store): PlayerState {
  return store.selectSnapshot(state => state[PLAYBACK_STATE_NAME].playerState);
}

function selectDisallows(store: Store): DisallowsModel {
  return store.selectSnapshot(state => state[PLAYBACK_STATE_NAME].disallows);
}
