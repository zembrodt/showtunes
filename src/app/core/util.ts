import { AlbumResponse } from '../models/album.model';
import { DeviceResponse } from '../models/device.model';
import { PlaylistResponse } from '../models/playlist.model';
import { TrackResponse } from '../models/track.model';
import { AlbumModel, DeviceModel, PlaylistModel, TrackModel } from './playback/playback.model';

export const VALID_HEX_COLOR = '^[A-Fa-f0-9]{3}$|^[A-Fa-f0-9]{6}$';

const validHexRegex = new RegExp(VALID_HEX_COLOR);
export function isHexColor(hex: string): boolean {
  return validHexRegex.test(hex);
}

export interface Color {
  r: number;
  g: number;
  b: number;
}

export function expandHexColor(hex: string): string {
  if (hex.length === 3) {
    return hex.substring(0, 1).repeat(2) + hex.substring(1, 2).repeat(2) + hex.substring(2, 3).repeat(2);
  }
  return hex;
}

export function hexToRgb(hex: string): Color {
  if (isHexColor(hex)) {
    if (hex.length === 3) {
      hex = expandHexColor(hex);
    }
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }
  return null;
}

export function isRgbColor(color: Color): boolean {
  if (color) {
    return color.r >= 0 && color.r <= 255
      && color.g >= 0 && color.g <= 255
      && color.b >= 0 && color.b <= 255;
  }
  return false;
}

function componentToHex(c: number): string {
  const hex = c.toString(16).toUpperCase();
  return hex.length === 1 ? `0${hex}` : hex;
}

export function rgbToHex(color: Color): string {
  if (isRgbColor(color)) {
    return `${componentToHex(color.r)}${componentToHex(color.g)}${componentToHex(color.b)}`;
  }
  return null;
}

export function cssRgbToHex(rgb: string): string {
  if (rgb) {
    rgb = rgb.replace('rgb', '')
      .replace('a', '')
      .replace('\(', '')
      .replace('\)', '');
    const rgbValues = rgb.split(',');
    if (rgbValues.length >= 3) {
      return rgbToHex({
        r: parseInt(rgbValues[0].trim(), 10),
        g: parseInt(rgbValues[1].trim(), 10),
        b: parseInt(rgbValues[2].trim(), 10)
      });
    }
  }
  return null;
}

/**
 * Euclidean distance between two colors based on their RGB values
 */
export function calculateColorDistance(c1: Color, c2: Color): number {
  if (c1 && c2) {
    return Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2));
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
      isPrivateSession: device.is_private_session,
      icon: getDeviceIcon(device.type)
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

function getDeviceIcon(deviceType: string): string {
  let icon = 'device_unknown';
  if (deviceType) {
    switch (deviceType.toLowerCase()) {
      case 'computer':
        icon = 'laptop_windows';
        break;
      case 'tv':
        icon = 'tv';
        break;
      case 'smartphone':
        icon = 'smartphone';
        break;
      case 'speaker':
        icon = 'speaker';
        break;
      case 'castaudio':
        icon = 'cast';
        break;
      default:
        console.log(`Unsupported device type: '${deviceType}'`);
    }
  }
  return icon;
}

export function capitalizeWords(words: string, separator: string): string {
  if (words && separator) {
    const wordsSplit = [];
    for (let word of words.trim().split(separator)) {
      word = word.trim();
      if (word.length > 1) {
        wordsSplit.push(word[0].toUpperCase() + word.substring(1));
      } else if (word.length > 0) {
        wordsSplit.push(word[0].toUpperCase());
      }
    }
    return wordsSplit.length > 0 ? wordsSplit.join(' ') : null;
  }
  return null;
}
