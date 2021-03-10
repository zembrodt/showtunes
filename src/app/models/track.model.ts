import { AlbumResponse } from './album.model';
import { ArtistResponse } from './artist.model';

export interface Track {
    id: string;
    title: string;
    artist: string;
    album: string;
    progress: number;
    duration: number;
    isPlaying: boolean;
    isShuffle: boolean;
    isLiked: boolean;
    repeatState: string;
    volume: number;
    uri: string;
}

export function newTrack(): Track {
  return {
    id: '',
    title: '',
    artist: '',
    album: '',
    progress: 0,
    duration: 0,
    isPlaying: false,
    isShuffle: false,
    isLiked: false,
    repeatState: '',
    volume: 0,
    uri: ''
  };
}

export interface TrackResponse {
  id: string;
  name: string;
  artists: ArtistResponse[];
  album: AlbumResponse;
  duration_ms: number;
  track_number: number;
  explicit: boolean;
  popularity: number;
  type: string;
  uri: string;
}
