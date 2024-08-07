import { HttpResponse, HttpStatusCode } from '@angular/common/http';
import { ActionsResponse } from '../models/actions.model';
import { AlbumResponse } from '../models/album.model';
import { DeviceResponse } from '../models/device.model';
import { PlaylistResponse } from '../models/playlist.model';
import { TrackResponse } from '../models/track.model';
import { AlbumModel, DeviceModel, DisallowsModel, PlaylistModel, TrackModel } from './playback/playback.model';
import { SpotifyAPIResponse } from './types';

export const VALID_HEX_COLOR = '^#?[A-Fa-f0-9]{3}$|^#?[A-Fa-f0-9]{6}$';
const validHexRegex = new RegExp(VALID_HEX_COLOR);

/**
 * Checks if the string is a valid hex color. Must be 3 or 6 digits. Prepended '#' is optional
 * @param hex the color as a hex string
 */
export function isHexColor(hex: string): boolean {
  return validHexRegex.test(hex);
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export enum FontColor {
  White = 'white',
  Black = 'black'
}

/**
 * Expands a hex color string from 3 digits to its 6 digit representation
 * @param hex the 3 digit hex color
 */
export function expandHexColor(hex: string): string {
  const containsHashtag = hex.charAt(0) === '#';
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.substring(0, 1).repeat(2) + hex.substring(1, 2).repeat(2) + hex.substring(2, 3).repeat(2);
  }
  return `${containsHashtag ? '#' : ''}${hex}`;
}

/**
 * Converts a hex string into a {@link Color} object
 * DAlpha value is set to 255
 * @param hex the hex value of the color as 3 or 6 digits
 */
export function hexToRgb(hex: string): Color {
  if (isHexColor(hex)) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = expandHexColor(hex);
    }
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
      a: 255
    };
  }
  return null;
}

/**
 * Checks if the {@link Color} object is a valid RGBA color as Uint8s
 * @param color the {@Color} object
 */
export function isRgbColor(color: Color): boolean {
  if (color) {
    return color.r >= 0 && color.r <= 255
      && color.g >= 0 && color.g <= 255
      && color.b >= 0 && color.b <= 255
      && color.a >= 0 && color.a <= 255;
  }
  return false;
}

function componentToHex(c: number): string {
  const hex = c.toString(16).toUpperCase();
  return hex.length === 1 ? `0${hex}` : hex;
}

/**
 * Convets the rgb value from a {@link Color} object into a hex string
 * Ignores alpha value
 * @param color the {@link Color} object
 */
export function rgbToHex(color: Color): string {
  if (isRgbColor(color)) {
    return `${componentToHex(color.r)}${componentToHex(color.g)}${componentToHex(color.b)}`;
  }
  return null;
}

/**
 * Converts an RGB string from CSS into a string representing the color in hex
 * Ignores the alpha value if applicable
 * @param rgb expect string of format rgb(255, 255, 255) or rgba(255, 255, 255, 0.5)
 */
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
        b: parseInt(rgbValues[2].trim(), 10),
        a: 255
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

/**
 * Determine if a font color should be white or black based on what would contrast better against the background color
 * See https://stackoverflow.com/questions/3942878/how-to-decide-font-color-in-white-or-black-depending-on-background-color
 * @param backgroundColor the background color as a {@link Color} object
 */
export function calculateForegroundFontColor(backgroundColor: Color): FontColor {
  return backgroundColor.r * 0.299 + backgroundColor.g * 0.587 + backgroundColor.b * 0.144 > 186 ?
    FontColor.Black : FontColor.White;
}

/**
 * Generates a code challenge by SHA-256 encrypting the code verifier and encoding it
 * @param codeVerifier the code verifier generated from {@link generateCodeVerifier}
 */
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  function base64encode(s: ArrayBuffer): string {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(s)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return base64encode(digest);
}

/**
 * Generates a random string of the provided length from the provided list of characters
 * @param length length of the random string to generate
 * @param chars a string containing all the valid characters to generate the string from
 */
function generateRandomStringFromChars(length: number, chars: string): string {
  let text = '';
  for (let i = 0; i < length; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generates a random string from alphanumeric characters
 * @param length the length of the random string
 */
export function generateRandomString(length: number): string {
  return generateRandomStringFromChars(length, validChars);
}

const validCodeVerifierChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-.~';

/**
 * Generates a code verifier as a random string from the valid list of code verifier characters
 * @param minLength the minimum length of the random string
 * @param maxLength the maximum length of the random string
 */
export function generateCodeVerifier(minLength: number, maxLength: number): string {
  if (minLength > maxLength || minLength < 0) {
    return '';
  }
  const length = Math.floor(Math.random() * (maxLength - minLength + 1) + minLength);
  return generateRandomStringFromChars(length, validCodeVerifierChars);
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

export function parseDisallows(disallows: ActionsResponse): DisallowsModel {
  if (!disallows) {
    disallows = {};
  }
  return {
    interruptPlayback: !!disallows.interrupting_playback,
    pause: !!disallows.pausing,
    resume: !!disallows.resuming,
    seek: !!disallows.seeking,
    skipNext: !!disallows.skipping_next,
    skipPrev: !!disallows.skipping_prev,
    repeatContext: !!disallows.toggling_repeat_context,
    shuffle: !!disallows.toggling_shuffle,
    repeatTrack: !!disallows.toggling_repeat_track,
    transferPlayback: !!disallows.transferring_playback
  };
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
        console.warn(`Unsupported device type: '${deviceType}'`);
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

/**
 * Checks a Spotify API response against common response codes
 * @param res
 * @param hasResponse
 * @param isPlayback (optional)
 * @private
 */
export function checkResponse(res: HttpResponse<any>, hasResponse: boolean, isPlayback = false): SpotifyAPIResponse {
  if (res.status === HttpStatusCode.Ok && (hasResponse || isPlayback)) {
    return SpotifyAPIResponse.Success;
  }
  else if (res.status === HttpStatusCode.NoContent && (!hasResponse || isPlayback)) {
    return isPlayback ? SpotifyAPIResponse.NoPlayback : SpotifyAPIResponse.Success;
  }
}
