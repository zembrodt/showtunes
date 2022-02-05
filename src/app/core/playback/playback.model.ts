export const PLAYBACK_STATE_NAME = 'SHOWTUNES_PLAYBACK';

export interface PlaybackModel {
  track: TrackModel;
  album: AlbumModel;
  playlist: PlaylistModel;
  device: DeviceModel;
  availableDevices: DeviceModel[];
  progress: number;
  isPlaying: boolean;
  isShuffle: boolean;
  repeatState: string;
  isLiked: boolean;
  isIdle: boolean;
}

export interface TrackModel {
  id: string;
  title: string;
  duration: number;
  artists: ArtistModel[];
  uri: string;
  href: string;
}

export interface ArtistModel {
  name: string;
  href: string;
}

export interface AlbumModel {
  id: string;
  name: string;
  releaseDate: string;
  totalTracks: number;
  type: string;
  artists: string[];
  coverArt: {
    width: number;
    height: number;
    url: string;
  };
  uri: string;
  href: string;
}

export interface PlaylistModel {
  id: string;
  name: string;
  href: string;
}

export interface DeviceModel {
  id: string;
  name: string;
  type: string;
  volume: number;
  isActive: boolean;
  isPrivateSession: boolean;
  isRestricted: boolean;
}

export const DEFAULT_PLAYBACK: PlaybackModel = {
  track: {
    id: '',
    title: '',
    duration: 0,
    artists: [],
    uri: '',
    href: ''
  },
  album: {
    id: '',
    name: '',
    releaseDate: '',
    totalTracks: 0,
    type: '',
    uri: '',
    artists: [],
    coverArt: {
      width: 0,
      height: 0,
      url: ''
    },
    href: ''
  },
  playlist: null,
  device: {
    id: '',
    name: '',
    type: '',
    volume: 0,
    isActive: false,
    isPrivateSession: false,
    isRestricted: false
  },
  availableDevices: [],
  progress: 0,
  isLiked: false,
  isPlaying: false,
  isShuffle: false,
  repeatState: '',
  isIdle: true
};
