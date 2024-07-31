import { ActionsResponse } from '../../models/actions.model';
import { AlbumResponse } from '../../models/album.model';
import { IAppConfig } from '../../models/app-config.model';
import { ArtistResponse } from '../../models/artist.model';
import { CurrentPlaybackResponse } from '../../models/current-playback.model';
import { DeviceResponse } from '../../models/device.model';
import { ImageResponse } from '../../models/image.model';
import { PlaylistResponse } from '../../models/playlist.model';
import { TrackResponse } from '../../models/track.model';

export function getTestAppConfig(): IAppConfig {
  return {
    env: {
      name: 'test-name',
      domain: 'test-domain',
      spotifyApiUrl: 'spotify-url',
      spotifyAccountsUrl: 'spotify-accounts',
      idlePolling: 3000,
      playbackPolling: 1000,
      throttleDelay: 1000
    },
    auth: {
      clientId: 'test-client-id',
      clientSecret: null,
      scopes: 'test-scope',
      tokenUrl: null,
      forcePkce: false,
      showDialog: true,
      expiryThreshold: 5000
    },
    logging: {
      level: 'info'
    }
  };
}

export function getTestArtistResponse(index = 1): ArtistResponse {
  return {
    id: `artist-id-${index}`,
    name: `artist-${index}`,
    type: `artist-type-v`,
    uri: `artist-uri-${index}`,
    external_urls: {
      spotify: `artist-url-${index}`
    }
  };
}

export function  getTestAlbumResponse(): AlbumResponse {
  return {
    id: 'album-id',
    name: 'test-album',
    type: 'album-type',
    total_tracks: 10,
    release_date: 'album-date',
    uri: 'album-uri',
    external_urls: {
      spotify: 'album-url'
    },
    album_type: 'album-type',
    images: [
      {url: 'album-img', height: 500, width: 500}
    ],
    artists: [
      getTestArtistResponse(1),
      getTestArtistResponse(2)
    ]
  };
}

export function getTestTrackResponse(): TrackResponse {
  return {
    name: 'test-track',
    album: getTestAlbumResponse(),
    track_number: 1,
    duration_ms: 1000,
    uri: 'test-uri',
    id: 'track-id',
    popularity: 100,
    type: 'type-test',
    explicit: true,
    external_urls: {
      spotify: 'spotify-url'
    },
    artists: [
      getTestArtistResponse(1),
      getTestArtistResponse(2)
    ]
  };
}

export function getTestPlaylistResponse(): PlaylistResponse {
  return {
    id: 'playlist-id',
    name: 'playlist-test',
    external_urls: {
      spotify: 'playlist-url'
    }
  };
}

export function getTestDeviceResponse(): DeviceResponse {
  return {
    id: 'device-id',
    volume_percent: 50,
    name: 'device-test',
    type: 'speaker',
    is_active: true,
    is_private_session: false,
    is_restricted: false
  };
}

export function getTestActionsResponse(): ActionsResponse {
  return {
    pausing: false,
    resuming: false,
    transferring_playback: false,
    skipping_prev: false,
    skipping_next: false,
    toggling_shuffle: false,
    seeking: false,
    toggling_repeat_context: false,
    toggling_repeat_track: false,
    interrupting_playback: false
  };
}

export function getTestPlaybackResponse(): CurrentPlaybackResponse {
  return {
    item: getTestTrackResponse(),
    context: {
      type: 'playlist',
      href: 'context-url',
      uri: 'test:uri:playlist-id'
    },
    device: getTestDeviceResponse(),
    is_playing: false,
    currently_playing_type: 'test-type',
    progress_ms: 100,
    repeat_state: 'test-state',
    shuffle_state: true,
    smart_shuffle: false,
    timestamp: 10,
    actions: {
      disallows: getTestActionsResponse()
    }
  };
}

export function getTestImageResponse(): ImageResponse {
  return {
    url: 'test-url',
    width: 100,
    height: 100
  };
}
