import {AlbumModel, DeviceModel, TrackModel} from './playback/playback.model';
import {TrackResponse} from '../models/track.model';
import {AlbumResponse} from '../models/album.model';
import {DeviceResponse} from '../models/device.model';

export const VALID_HEX = '^[A-Za-z0-9]{6}';

const VALID_HEX_REGEX = new RegExp(VALID_HEX);
export function isValidHex(hex: string): boolean {
  return VALID_HEX_REGEX.test(hex);
}

export function parseTrack(track: TrackResponse): TrackModel {
  if (track) {
    return {
      id: track.id,
      title: track.name,
      uri: track.uri,
      artists: track.artists.map((artist) => artist.name)
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
      coverArt: album.images.find((image) => image.width === imagesMaxWidth)
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
