import { AlbumResponse } from '../models/album.model';
import { DeviceResponse } from '../models/device.model';
import { PlaylistResponse } from '../models/playlist.model';
import { TrackResponse } from '../models/track.model';
import { AlbumModel, DeviceModel, PlaylistModel, TrackModel } from './playback/playback.model';

export const VALID_HEX_COLOR = '^[A-Fa-f0-9]{6}$';

const validHexRegex = new RegExp(VALID_HEX_COLOR);
export function isHexColor(hex: string): boolean {
  return validHexRegex.test(hex);
}

export interface Color {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Color {
  if (isHexColor(hex)) {
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }
  return null;
}

const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateRandomString(length: number): string {
  let arr = new Uint8Array(length);
  window.crypto.getRandomValues(arr);
  arr = arr.map(x => validChars.charCodeAt(x % validChars.length));
  return String.fromCharCode.apply(null, arr);
}

export function parseTrack(track: TrackResponse): TrackModel {
  if (track) {
    return {
      id: track.id,
      title: track.name,
      duration: track.duration_ms,
      artists: track.artists.map((artist) => {
        return {
          name: artist.name,
          href: artist.external_urls.spotify
        };
      }),
      uri: track.uri,
      href: track.external_urls.spotify
    };
  }
  return null;
}

export function parseAlbum(album: AlbumResponse): AlbumModel {
  if (album) {
    const imagesMaxWidth = Math.max.apply(Math, album.images.map(image => image.width));
    return {
      id: album.id,
      name: album.name,
      type: album.type,
      releaseDate: album.release_date,
      totalTracks: album.total_tracks,
      uri: album.uri,
      artists: album.artists.map((artist) => artist.name),
      coverArt: album.images.find((image) => image.width === imagesMaxWidth),
      href: album.external_urls.spotify
    };
  }
  return null;
}

export function parsePlaylist(playlist: PlaylistResponse): PlaylistModel {
  if (playlist) {
    return {
      id: playlist.id,
      name: playlist.name,
      href: playlist.external_urls.spotify
    };
  }
  return null;
}

export function parseDevice(device: DeviceResponse): DeviceModel {
  if (device) {
    return {
      id: device.id,
      name: device.name,
      type: device.type,
      volume: device.volume_percent,
      isRestricted: device.is_restricted,
      isActive: device.is_active,
      isPrivateSession: device.is_private_session
    };
  }
  return null;
}

export function getIdFromSpotifyUri(uri: string): string {
  if (uri) {
    const uriParts = uri.split(':');
    if (uriParts.length === 3) {
      return uriParts[2];
    }
  }
  return null;
}
