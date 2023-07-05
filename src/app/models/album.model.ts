import { ArtistResponse } from './artist.model';
import { ImageResponse } from './image.model';

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
  external_urls: {
    spotify: string;
  };
}

export interface SmartColorResponse {
  color: string;
}
