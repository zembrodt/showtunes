import { ArtistResponse } from './artist.model';
import { ImageResponse } from './image.model';

export interface Album {
  id: string;
  name: string;
  release_date: string;
  total_tracks: number;
  type: string;
  album_type: string;
  artists: ArtistResponse[];
  coverArt: ImageResponse;
  uri: string;
}

export interface AlbumResponse {
  id: string;
  name: string;
  release_date: string;
  total_tracks: number;
  type: string;
  album_type: string;
  artists: ArtistResponse[];
  images: ImageResponse[];
  uri: string;
}
