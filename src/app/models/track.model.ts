import { AlbumResponse } from './album.model';
import { ArtistResponse } from './artist.model';

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
  external_urls: {
    spotify: string;
  };
}
