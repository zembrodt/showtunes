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
    repeatState: string;
    volume: number;
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
