import { expect } from '@angular/flex-layout/_private-utils/testing';
import { AlbumResponse } from '../models/album.model';
import { ArtistResponse } from '../models/artist.model';
import { DeviceResponse } from '../models/device.model';
import { ImageResponse } from '../models/image.model';
import { PlaylistResponse } from '../models/playlist.model';
import { TrackResponse } from '../models/track.model';
import { generateRandomString, hexToRgb, isHexColor, parseAlbum, parseDevice, parsePlaylist, parseTrack } from './util';

const ARTIST_RESPONSE_1: ArtistResponse = {
  id: 'artist-id-1',
  name: 'test-artist-1',
  type: 'artist-type-1',
  uri: 'artist-uri-1',
  external_urls: {
    spotify: 'artist-url-1'
  }
};

const ARTIST_RESPONSE_2: ArtistResponse = {
  id: 'artist-id-2',
  name: 'test-artist-2',
  type: 'artist-type-2',
  uri: 'artist-uri-2',
  external_urls: {
    spotify: 'artist-url-2'
  }
};

const IMAGE_RESPONSE_1: ImageResponse = {
  width: 10,
  height: 20,
  url: 'image-url-1'
};

const IMAGE_RESPONSE_2: ImageResponse = {
  width: 50,
  height: 50,
  url: 'image-url-2'
};

const ALBUM_RESPONSE: AlbumResponse = {
  id: 'test-id',
  name: 'test-album',
  release_date: '2022',
  total_tracks: 10,
  type: 'album-type',
  album_type: 'full-length',
  artists: [
    ARTIST_RESPONSE_1,
    ARTIST_RESPONSE_2
  ],
  images: [
    IMAGE_RESPONSE_1,
    IMAGE_RESPONSE_2
  ],
  uri: 'album-uri',
  external_urls: {
    spotify: 'album-url'
  }
};

describe('util package', () => {
  describe('isHexColor', () => {
    it('should return true for valid hex color string', () => {
      expect(isHexColor('000000')).toBeTrue();
      expect(isHexColor('FFFFFF')).toBeTrue();
      expect(isHexColor('ABC123')).toBeTrue();
    });

    it('should return false with valid hex that is not a color', () => {
      expect(isHexColor('A')).toBeFalse();
      expect(isHexColor('12345')).toBeFalse();
      expect(isHexColor('1234567')).toBeFalse();
    });

    it('should return false with invalid hex', () => {
      expect(isHexColor('test')).toBeFalse();
      expect(isHexColor('badhex')).toBeFalse();
      expect(isHexColor('!@#$%^')).toBeFalse();
    });

    it('should return false with null or empty input', () => {
      expect(isHexColor('')).toBeFalse();
      expect(isHexColor(null)).toBeFalse();
    });
  });

  describe('hexToRgb', () => {
    it('should return a Color object with valid hex color', () => {
      expect(hexToRgb('000000')).toEqual({r: 0, g: 0, b: 0});
      expect(hexToRgb('FFFFFF')).toEqual({r: 255, g: 255, b: 255});
      expect(hexToRgb('ABC123')).toEqual({r: 171, g: 193, b: 35});
    });

    it('should return null with valid hex that is not a color', () => {
      expect(hexToRgb('A')).toBeNull();
      expect(hexToRgb('12345')).toBeNull();
      expect(hexToRgb('1234567')).toBeNull();
    });

    it('should return null with invalid hex', () => {
      expect(hexToRgb('test')).toBeNull();
      expect(hexToRgb('badhex')).toBeNull();
      expect(hexToRgb('!@#$%^')).toBeNull();
    });

    it('should return null with null or empty input', () => {
      expect(hexToRgb('')).toBeNull();
      expect(hexToRgb(null)).toBeNull();
    });
  });

  describe('generateRandomString', () => {
    it('should return a random string of correct length', () => {
      expect(generateRandomString(10).length).toEqual(10);
    });

    it('should return a random string of only alpha-numeric characters', () => {
      expect(generateRandomString(10)).toMatch('^[A-Za-z0-9]+$');
    });

    it('should return empty string for length 0', () => {
      expect(generateRandomString(0).length).toEqual(0);
    });
  });

  describe('parseTrack', () => {
    it('should correctly parse TrackResponse into TrackModel', () => {
      const response: TrackResponse = {
        id: 'test-id',
        name: 'test-track',
        artists: [
          ARTIST_RESPONSE_1,
          ARTIST_RESPONSE_2
        ],
        album: ALBUM_RESPONSE,
        duration_ms: 10000,
        track_number: 5,
        explicit: true,
        popularity: 50,
        type: 'track-type',
        uri: 'track-uri',
        external_urls: {
          spotify: 'track-url'
        }
      };
      const model = parseTrack(response);
      expect(model.id).toEqual(response.id);
      expect(model.title).toEqual(response.name);
      expect(model.duration).toEqual(response.duration_ms);
      expect(model.artists).toEqual([{
          name: ARTIST_RESPONSE_1.name,
          href: ARTIST_RESPONSE_1.external_urls.spotify
        }, {
          name: ARTIST_RESPONSE_2.name,
          href: ARTIST_RESPONSE_2.external_urls.spotify
      }]);
      expect(model.uri).toEqual(response.uri);
      expect(model.href).toEqual(response.external_urls.spotify);
    });

    it('should return null when response is null', () => {
      expect(parseTrack(null)).toBeNull();
    });
  });

  describe('parseAlbum', () => {
    it('should correctly parse AlbumResponse into AlbumModel', () => {
      const response = ALBUM_RESPONSE;
      const model = parseAlbum(response);
      expect(model.id).toEqual(response.id);
      expect(model.name).toEqual(response.name);
      expect(model.type).toEqual(response.type);
      expect(model.releaseDate).toEqual(response.release_date);
      expect(model.totalTracks).toEqual(response.total_tracks);
      expect(model.uri).toEqual(response.uri);
      expect(model.artists).toEqual([ARTIST_RESPONSE_1.name, ARTIST_RESPONSE_2.name]);
      expect(model.coverArt).toEqual(IMAGE_RESPONSE_2);
      expect(model.href).toEqual(response.external_urls.spotify);
    });

    it('should return null when response is null', () => {
      expect(parseAlbum(null)).toBeNull();
    });
  });

  describe('parsePlaylist', () => {
    it('should correctly parse PlaylistResponse into PlaylistModel', () => {
      const response: PlaylistResponse = {
        id: 'test-id',
        name: 'test-playlist',
        external_urls: {
          spotify: 'spotify-url'
        }
      };
      const model = parsePlaylist(response);
      expect(model.id).toEqual(response.id);
      expect(model.name).toEqual(response.name);
      expect(model.href).toEqual(response.external_urls.spotify);
    });

    it('should return null when response is null', () => {
      expect(parsePlaylist(null)).toBeNull();
    });
  });

  describe('parseDevice', () => {
    it('should correctly parse DeviceResponse into DeviceModel', () => {
      const response: DeviceResponse = {
        id: 'test-id',
        name: 'test-device',
        type: 'device-type',
        volume_percent: 50,
        is_active: true,
        is_private_session: true,
        is_restricted: true
      };
      const model = parseDevice(response);
      expect(model.id).toEqual(response.id);
      expect(model.name).toEqual(response.name);
      expect(model.type).toEqual(response.type);
      expect(model.volume).toEqual(response.volume_percent);
      expect(model.isRestricted).toEqual(response.is_restricted);
      expect(model.isActive).toEqual(response.is_active);
      expect(model.isPrivateSession).toEqual(response.is_private_session);
    });

    it('should return null when response is null', () => {
      expect(parseDevice(null)).toBeNull();
    });
  });

  describe('getIdFromSpotifyUri', () => {

  });
});
