import { AuthToken } from '../auth/auth.model';
import { DominantColor } from '../dominant-color/dominant-color-finder';
import { AlbumModel, ArtistModel, DeviceModel, DisallowsModel, PlaylistModel, TrackModel } from '../playback/playback.model';
import { FontColor } from '../util';

export function getTestAuthToken(): AuthToken {
  return {
    accessToken: 'test-token',
    tokenType: 'test-type',
    expiry: new Date(Date.UTC(9999, 1, 1)),
    scope: 'test-scope',
    refreshToken: 'test-refresh'
  };
}

export function getTestAlbumModel(): AlbumModel {
  return {
    id: 'album-id',
    name: 'test-album',
    releaseDate: 'release',
    totalTracks: 10,
    type: 'album',
    artists: [
      'test-artist-1',
      'test-artist-2'
    ],
    coverArt: {
      width: 500,
      height: 500,
      url: 'album-art-url'
    },
    uri: 'test:album:uri',
    href: 'album-href'
  };
}

export function getTestArtistModel(id: number = 0): ArtistModel {
  return {
    name: `artist-${id}`,
    href: `artist-href-${id}`
  };
}

export function getTestTrackModel(): TrackModel {
  return {
    id: 'track-id',
    title: 'test-track',
    duration: 100,
    artists: [
      getTestArtistModel(1),
      getTestArtistModel(2)
    ],
    uri: 'test:track:uri',
    href: 'track-href'
  };
}

export function getTestPlaylistModel(): PlaylistModel {
  return {
    id: 'playlist-id',
    name: 'test-playlist',
    href: 'playlist-href'
  };
}

export function getTestDeviceModel(id: number = 0): DeviceModel {
  return {
    id: `device-id-${id}`,
    name: `test-device-${id}`,
    type: 'device-type',
    volume: 50,
    isActive: true,
    isPrivateSession: true,
    isRestricted: true,
    icon: 'device-icon'
  };
}

export function getTestDisallowsModel(): DisallowsModel {
  return {
    pause: false,
    resume: false,
    skipPrev: false,
    skipNext: false,
    shuffle: false,
    repeatContext: false,
    repeatTrack: false,
    seek: false,
    transferPlayback: false,
    interruptPlayback: false
  };
}

export function getTestDominantColor(): DominantColor {
  return {
    hex: 'DEF789',
    rgb: {
      r: 222,
      g: 247,
      b: 137,
      a: 255
    },
    foregroundFontColor: FontColor.White
  };
}
