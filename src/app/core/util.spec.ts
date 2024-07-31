import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { ActionsResponse } from '../models/actions.model';
import { AlbumResponse } from '../models/album.model';
import { ArtistResponse } from '../models/artist.model';
import { DeviceResponse } from '../models/device.model';
import { ImageResponse } from '../models/image.model';
import { PlaylistResponse } from '../models/playlist.model';
import { TrackResponse } from '../models/track.model';
import {
  calculateColorDistance,
  capitalizeWords,
  Color,
  cssRgbToHex,
  expandHexColor, generateCodeChallenge, generateCodeVerifier,
  generateRandomString,
  getIdFromSpotifyUri,
  hexToRgb,
  isHexColor,
  isRgbColor,
  parseAlbum,
  parseDevice, parseDisallows,
  parsePlaylist,
  parseTrack,
  rgbToHex
} from './util';

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
    it('should return true for valid hex color string of length 3', () => {
      expect(isHexColor('000')).toBeTrue();
      expect(isHexColor('FFF')).toBeTrue();
      expect(isHexColor('ABC')).toBeTrue();
    });

    it('should return true for valid hex color string of length 6', () => {
      expect(isHexColor('000000')).toBeTrue();
      expect(isHexColor('FFFFFF')).toBeTrue();
      expect(isHexColor('ABC123')).toBeTrue();
    });

    it('should return true for valid hex with prepended "#" character', () => {
      expect(isHexColor('#AAA')).toBeTrue();
      expect(isHexColor('#FFFFFF')).toBeTrue();
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

  describe('expandHexColor', () => {
    it('should return expanded hex when hex color length of 3', () => {
      expect(expandHexColor('000')).toEqual('000000');
      expect(expandHexColor('123')).toEqual('112233');
      expect(expandHexColor('AAB')).toEqual('AAAABB');
      expect(expandHexColor('ABB')).toEqual('AABBBB');
    });

    it('should return passed hex value when hex color not length of 3', () => {
      expect(expandHexColor('0')).toEqual('0');
      expect(expandHexColor('FFFFFF')).toEqual('FFFFFF');
    });

    it('should keep existing "#" character if applicable', () => {
      expect(expandHexColor('#123')).toEqual('#112233');
      expect(expandHexColor('#FFFFFF')).toEqual('#FFFFFF');
    });
  });

  describe('hexToRgb', () => {
    it('should return a Color object with valid hex color of length 3', () => {
      expect(hexToRgb('000')).toEqual({r: 0, g: 0, b: 0, a: 255});
      expect(hexToRgb('FFF')).toEqual({r: 255, g: 255, b: 255, a: 255});
    });

    it('should return a Color object with valid hex color of length 6', () => {
      expect(hexToRgb('000000')).toEqual({r: 0, g: 0, b: 0, a: 255});
      expect(hexToRgb('FFFFFF')).toEqual({r: 255, g: 255, b: 255, a: 255});
      expect(hexToRgb('ABC123')).toEqual({r: 171, g: 193, b: 35, a: 255});
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

    it('should ignore a prepended "#" character', () => {
      expect(hexToRgb('#FFF')).toEqual({r: 255, g: 255, b: 255, a: 255});
      expect(hexToRgb('#000000')).toEqual({r: 0, g: 0, b: 0, a: 255});
    });
  });

  describe('isRgbColor', () => {
    it('should return true for valid RGB color', () => {
      expect(isRgbColor({ r: 0, g: 0, b: 0, a: 0 })).toBeTrue();
      expect(isRgbColor({ r: 100, g: 100, b: 100, a: 100 })).toBeTrue();
      expect(isRgbColor({ r: 255, g: 255, b: 255, a: 255 })).toBeTrue();
    });

    it('should return false for values outside a valid RGB range', () => {
      expect(isRgbColor({ r: -1, g: -1, b: -1, a: -1 })).toBeFalse();
      expect(isRgbColor({ r: 256, g: 256, b: 256, a: 256 })).toBeFalse();
      expect(isRgbColor({ r: -1, g: 0, b: 0, a: 0 })).toBeFalse();
      expect(isRgbColor({ r: 0, g: -1, b: 0, a: 0 })).toBeFalse();
      expect(isRgbColor({ r: 0, g: 0, b: -1, a: 0 })).toBeFalse();
      expect(isRgbColor({ r: 0, g: 0, b: 0, a: -1 })).toBeFalse();
      expect(isRgbColor({ r: 256, g: 255, b: 255, a: 255 })).toBeFalse();
      expect(isRgbColor({ r: 255, g: 256, b: 255, a: 255 })).toBeFalse();
      expect(isRgbColor({ r: 255, g: 255, b: 256, a: 255 })).toBeFalse();
      expect(isRgbColor({ r: 255, g: 255, b: 255, a: 256 })).toBeFalse();
    });

    it('should return false if no color', () => {
      expect(isRgbColor(null)).toBeFalse();
      expect(isRgbColor(undefined)).toBeFalse();
    });
  });

  describe('rgbToHex', () => {
    it('should return hex color for valid RGB values', () => {
      expect(rgbToHex({ r: 0, g: 0, b: 0, a: 0 })).toEqual('000000');
      expect(rgbToHex({ r: 255, g: 255, b: 255, a: 255 })).toEqual('FFFFFF');
      expect(rgbToHex({ r: 171, g: 193, b: 35, a: 255 })).toEqual('ABC123');
    });

    it('should return null if not valid RGB values', () => {
      expect(rgbToHex({ r: -1, g: -1, b: -1, a: -1 })).toBeNull();
      expect(rgbToHex({ r: -1, g: 0, b: 0, a: 0 })).toBeNull();
      expect(rgbToHex({ r: 0, g: -1, b: 0, a: 0 })).toBeNull();
      expect(rgbToHex({ r: 0, g: 0, b: -1, a: 0 })).toBeNull();
      expect(rgbToHex({ r: 256, g: 256, b: 256, a: 255 })).toBeNull();
      expect(rgbToHex({ r: 256, g: 255, b: 255, a: 255 })).toBeNull();
      expect(rgbToHex({ r: 255, g: 256, b: 255, a: 255 })).toBeNull();
      expect(rgbToHex({ r: 255, g: 255, b: 256, a: 255 })).toBeNull();
      expect(rgbToHex(null)).toBeNull();
      expect(rgbToHex(undefined)).toBeNull();
    });
  });

  describe('cssRgbToHex', () => {
    it('should return hex color for valid CSS RGB value', () => {
      expect(cssRgbToHex('rgb(0,0,0)')).toEqual('000000');
      expect(cssRgbToHex('rgb( 255 , 255 , 255 )')).toEqual('FFFFFF');
      expect(cssRgbToHex('rgb(171, 193, 35)')).toEqual('ABC123');
      expect(cssRgbToHex('0,0,0')).toEqual('000000');
      expect(cssRgbToHex('rgba(0,0,0,0)')).toEqual('000000');
      expect(cssRgbToHex('(0,0,0)')).toEqual('000000');
    });

    it('should return null for an invalid CSS RGB value', () => {
      expect(cssRgbToHex('rgb(0,0)')).toBeNull();
      expect(cssRgbToHex('test')).toBeNull();
      expect(cssRgbToHex('rgblah(0,0,0)')).toBeNull();
      expect(cssRgbToHex(null)).toBeNull();
      expect(cssRgbToHex(undefined)).toBeNull();
    });
  });

  describe('calculateColorDistance', () => {
    it('should return the correct euclidean distance between two RGB colors', () => {
      const c1: Color = { r: 4, g: 3, b: 2, a: 0 };
      const c2: Color = { r: 2, g: 1, b: 4, a: 0 };
      expect(calculateColorDistance(c1, c2)).toEqual(Math.sqrt(12));
    });

    it('should return null when either color is null or undefined', () => {
      expect(calculateColorDistance({ r: 1, g: 2, b: 3, a: 0 }, null)).toBeNull();
      expect(calculateColorDistance({ r: 1, g: 2, b: 3, a: 0 }, undefined)).toBeNull();
      expect(calculateColorDistance(null, { r: 1, g: 2, b: 3, a: 0 })).toBeNull();
      expect(calculateColorDistance(undefined, { r: 1, g: 2, b: 3, a: 0 })).toBeNull();
      expect(calculateColorDistance(null, null)).toBeNull();
      expect(calculateColorDistance(undefined, undefined)).toBeNull();
    });
  });

  describe('generateCodeChallenge', () => {
    it('should use SHA-256 encryption', fakeAsync(() => {
      spyOn(window.crypto.subtle, 'digest').and.returnValue(Promise.resolve(new ArrayBuffer(8)));
      let codeChallenge;
      generateCodeChallenge('test').then((retVal) => codeChallenge = retVal);

      flushMicrotasks();
      expect(window.crypto.subtle.digest).toHaveBeenCalledWith('SHA-256', jasmine.any(Uint8Array));
      expect(codeChallenge).toBeTruthy();
    }));
  });

  describe('generateRandomString', () => {
    it('should return a random string of correct length', () => {
      expect(generateRandomString(10).length).toEqual(10);
    });

    it('should return a random string of only alpha-numeric characters', () => {
      expect(generateRandomString(10)).toMatch('^[a-zA-Z0-9]+$');
    });

    it('should return empty string for length 0', () => {
      expect(generateRandomString(0).length).toEqual(0);
    });
  });

  describe('generateCodeVerifier', () => {
    it('should generate a random string of specific length when minLength = maxLength', () => {
      for (let i = 0; i < 100; i++) {
        expect(generateCodeVerifier(2, 2).length).toEqual(2);
      }
    });

    it('should generate a random string of a length within the bounds', () => {
      for (let i = 0; i < 100; i++) {
        const codeVerifier = generateCodeVerifier(5, 10);
        expect(codeVerifier.length >= 5).toBeTrue();
        expect(codeVerifier.length <= 10).toBeTrue();
      }
    });

    it('should return a random string of valid code verifier characters', () => {
      for (let i = 0; i < 100; i++) {
        expect(generateCodeVerifier(5, 10)).toMatch('^[a-zA-Z0-9_\\-.~]+$');
      }
    });

    it('should return empty string for length 0', () => {
      expect(generateCodeVerifier(0, 0).length).toEqual(0);
    });

    it('should return empty string for maxLength > minLength', () => {
      expect(generateCodeVerifier(10, 5).length).toEqual(0);
    });

    it('should return empty string minLength < 0', () => {
      expect(generateCodeVerifier(-1, 5).length).toEqual(0);
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
        type: 'computer',
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

    it('should set the correct device icon based on device type', () => {
      const response: DeviceResponse = {
        id: 'test-id',
        name: 'test-device',
        type: 'device-type',
        volume_percent: 50,
        is_active: true,
        is_private_session: true,
        is_restricted: true
      };
      spyOn(console, 'warn');

      response.type = 'COMPUTER';
      expect(parseDevice(response).icon).toEqual('laptop_windows');

      response.type = 'tv';
      expect(parseDevice(response).icon).toEqual('tv');

      response.type = 'smartphone';
      expect(parseDevice(response).icon).toEqual('smartphone');

      response.type = 'speaker';
      expect(parseDevice(response).icon).toEqual('speaker');

      response.type = 'castaudio';
      expect(parseDevice(response).icon).toEqual('cast');

      response.type = 'unsupported device';
      expect(parseDevice(response).icon).toEqual('device_unknown');
      expect(console.warn).toHaveBeenCalled();

      response.type = '';
      expect(parseDevice(response).icon).toEqual('device_unknown');

      response.type = null;
      expect(parseDevice(response).icon).toEqual('device_unknown');

      response.type = undefined;
      expect(parseDevice(response).icon).toEqual('device_unknown');
    });
  });

  describe('parseDisallows', () => {
    it('should correctly parse an ActionsResponse to a DisallowsModel', () => {
      const response: ActionsResponse = {
        interrupting_playback: true,
        toggling_repeat_track: true,
        toggling_repeat_context: true,
        seeking: true,
        toggling_shuffle: true,
        skipping_next: true,
        skipping_prev: true,
        transferring_playback: true,
        resuming: true,
        pausing: true
      };
      const model = parseDisallows(response);

      expect(model.interruptPlayback).toBeTrue();
      expect(model.repeatTrack).toBeTrue();
      expect(model.repeatContext).toBeTrue();
      expect(model.seek).toBeTrue();
      expect(model.shuffle).toBeTrue();
      expect(model.skipNext).toBeTrue();
      expect(model.skipPrev).toBeTrue();
      expect(model.transferPlayback).toBeTrue();
      expect(model.resume).toBeTrue();
      expect(model.pause).toBeTrue();
    });

    it('should correctly parse an null or undefined ActionsResponse parameters as false in the DisallowsModel', () => {
      const response: ActionsResponse = {
        interrupting_playback: null,
        toggling_repeat_track: false,
        toggling_repeat_context: undefined
      };
      const model = parseDisallows(response);

      expect(model.interruptPlayback).toBeFalse();
      expect(model.repeatTrack).toBeFalse();
      expect(model.repeatContext).toBeFalse();
      expect(model.seek).toBeFalse();
      expect(model.shuffle).toBeFalse();
      expect(model.skipNext).toBeFalse();
      expect(model.skipPrev).toBeFalse();
      expect(model.transferPlayback).toBeFalse();
      expect(model.resume).toBeFalse();
      expect(model.pause).toBeFalse();
    });

    it('should correctly parse a null ActionsResponse as all false values in the DisallowsModel', () => {
      const model = parseDisallows(null);

      expect(model.interruptPlayback).toBeFalse();
      expect(model.repeatTrack).toBeFalse();
      expect(model.repeatContext).toBeFalse();
      expect(model.seek).toBeFalse();
      expect(model.shuffle).toBeFalse();
      expect(model.skipNext).toBeFalse();
      expect(model.skipPrev).toBeFalse();
      expect(model.transferPlayback).toBeFalse();
      expect(model.resume).toBeFalse();
      expect(model.pause).toBeFalse();
    });
  });

  describe('getIdFromSpotifyUri', () => {
    it('should return the ID from a valid Spotify Uri', () => {
      expect(getIdFromSpotifyUri('abc:123:my_id')).toEqual('my_id');
    });

    it('should return null from an invalid Spotify Uri', () => {
      expect(getIdFromSpotifyUri('abc:123')).toBeNull();
      expect(getIdFromSpotifyUri('abc:123:my_id:456')).toBeNull();
      expect(getIdFromSpotifyUri('abc')).toBeNull();
      expect(getIdFromSpotifyUri('')).toBeNull();
      expect(getIdFromSpotifyUri(null)).toBeNull();
      expect(getIdFromSpotifyUri(undefined)).toBeNull();
    });
  });

  describe('capitalizeWords', () => {
    it('should split words by the separator and capitalize the first letters', () => {
      expect(capitalizeWords('first-test', '-')).toEqual('First Test');
      expect(capitalizeWords('abc 123', ' ')).toEqual('Abc 123');
    });

    it('should be able to capitalize single letter words', () => {
      expect(capitalizeWords('test-a', '-')).toEqual('Test A');
      expect(capitalizeWords('a', '-')).toEqual('A');
    });

    it('should ignore whitespace before/after words', () => {
      expect(capitalizeWords('  this is a test  \n \t', ' ')).toEqual('This Is A Test');
    });

    it('should not add empty words to string', () => {
      expect(capitalizeWords('--this-is -a-test--', '-')).toEqual('This Is A Test');
    });

    it('should return null if words string is only separators', () => {
      expect(capitalizeWords('-', '-')).toBeNull();
      expect(capitalizeWords('---', '-')).toBeNull();
      expect(capitalizeWords(' - -\n- \t', '-')).toBeNull();
      expect(capitalizeWords(' \t   \n ', ' ')).toBeNull();
    });

    it('should return null if either input is null or undefined or empty string', () => {
      expect(capitalizeWords(null, '-')).toBeNull();
      expect(capitalizeWords(undefined, '-')).toBeNull();
      expect(capitalizeWords('', '-')).toBeNull();
      expect(capitalizeWords('this-is-a-test', null)).toBeNull();
      expect(capitalizeWords('this-is-a-test', undefined)).toBeNull();
      expect(capitalizeWords('this-is-a-test', '')).toBeNull();
      expect(capitalizeWords(null, null)).toBeNull();
      expect(capitalizeWords(undefined, undefined)).toBeNull();
      expect(capitalizeWords('', '')).toBeNull();
    });
  });
});
