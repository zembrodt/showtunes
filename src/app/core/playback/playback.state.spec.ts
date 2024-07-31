import { TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { ImageResponse } from '../../models/image.model';
import {
  getTestAlbumModel,
  getTestDeviceModel,
  getTestDisallowsModel,
  getTestPlaylistModel,
  getTestTrackModel
} from '../testing/test-models';
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
  DeviceModel,
  DisallowsModel,
  PLAYBACK_STATE_NAME,
  PlayerState,
  PlaylistModel,
  TrackModel
} from './playback.model';
import { PlaybackState } from './playback.state';

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
        track: getTestTrackModel(),
        album: getTestAlbumModel(),
        playlist: getTestPlaylistModel(),
        device: getTestDeviceModel(1),
        availableDevices: [
          getTestDeviceModel(1),
          getTestDeviceModel(2)
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
    expect(track).toEqual(getTestTrackModel());
  });

  it('should select album', () => {
    const album = selectAlbum(store);
    expect(album).toEqual(getTestAlbumModel());
  });

  it('should select playlist', () => {
    const playlist = selectPlaylist(store);
    expect(playlist).toEqual(getTestPlaylistModel());
  });

  it('should select coverArt', () => {
    const coverArt = selectCoverArt(store);
    expect(coverArt).toEqual(getTestAlbumModel().coverArt);
  });

  it('should select device', () => {
    const device = selectDevice(store);
    expect(device).toEqual(getTestDeviceModel(1));
  });

  it('should select deviceVolume', () => {
    const deviceVolume = selectDeviceVolume(store);
    expect(deviceVolume).toEqual(getTestDeviceModel(1).volume);
  });

  it('should select availableDevices', () => {
    const availableDevices = selectAvailableDevices(store);
    expect(availableDevices).toEqual([getTestDeviceModel(1), getTestDeviceModel(2)]);
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
      ...getTestTrackModel(),
      id: 'new-track'
    };
    store.dispatch(new ChangeTrack(updatedTrack));
    const track = selectTrack(store);
    expect(track).toEqual(updatedTrack);
  });

  it('should change album', () => {
    const updatedAlbum: AlbumModel = {
      ...getTestAlbumModel(),
      id: 'new-album'
    };
    store.dispatch(new ChangeAlbum(updatedAlbum));
    const album = selectAlbum(store);
    expect(album).toEqual(updatedAlbum);
  });

  it('should change playlist', () => {
    const updatedPlaylist: PlaylistModel = {
      ...getTestPlaylistModel(),
      id: 'new-playlist'
    };
    store.dispatch(new ChangePlaylist(updatedPlaylist));
    const playlist = selectPlaylist(store);
    expect(playlist).toEqual(updatedPlaylist);
  });

  it('should change device', () => {
    store.dispatch(new ChangeDevice(getTestDeviceModel(2)));
    const device = selectDevice(store);
    expect(device).toEqual(getTestDeviceModel(2));
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
          ...getTestDeviceModel(1),
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
      {...getTestDeviceModel(1), id: 'updated-device-1'},
      {...getTestDeviceModel(2), id: 'updated-device-2'}
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
