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

export function newAlbum(): Album {
  return {
    id: '',
    name: '',
    release_date: '',
    total_tracks: 0,
    type: '',
    album_type: '',
    artists: [],
    coverArt: {
      width: 0,
      height: 0,
      url: ''
    },
    uri: ''
  };
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
