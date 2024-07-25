import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { BehaviorSubject } from 'rxjs';
import {
  ChangeDevice,
  ChangeDeviceVolume, ChangePlaylist,
  ChangeRepeatState, SetAvailableDevices,
  SetLiked,
  SetPlaying,
  SetProgress,
  SetShuffle
} from '../../../core/playback/playback.actions';
import { DeviceModel, TrackModel } from '../../../core/playback/playback.model';
import { PlaybackState } from '../../../core/playback/playback.state';
import { SpotifyEndpoints } from '../../../core/spotify/spotify-endpoints';
import { SpotifyAPIResponse } from '../../../core/types';
import { checkResponse, parseDevice, parsePlaylist } from '../../../core/util';
import { MultipleDevicesResponse } from '../../../models/device.model';
import { PlaylistResponse } from '../../../models/playlist.model';
import { SpotifyAuthService } from '../auth/spotify-auth.service';

@Injectable({providedIn: 'root'})
export class SpotifyControlsService {
  private static readonly SKIP_PREVIOUS_THRESHOLD = 3000; // ms

  @Select(PlaybackState.track) private track$: BehaviorSubject<TrackModel>;
  private track: TrackModel = null;

  @Select(PlaybackState.isPlaying) private isPlaying$: BehaviorSubject<boolean>;
  private isPlaying = false;

  @Select(PlaybackState.isShuffle) private isShuffle$: BehaviorSubject<boolean>;
  private isShuffle = false;

  @Select(PlaybackState.progress) private progress$: BehaviorSubject<number>;
  private progress = 0;

  @Select(PlaybackState.duration) private duration$: BehaviorSubject<number>;
  private duration = 0;

  @Select(PlaybackState.isLiked) private isLiked$: BehaviorSubject<boolean>;
  private isLiked = false;

  constructor(private http: HttpClient, private store: Store, private auth: SpotifyAuthService) {}

  initSubscriptions(): void {
    this.track$.subscribe((track) => this.track = track);
    this.isPlaying$.subscribe((isPlaying) => this.isPlaying = isPlaying);
    this.isShuffle$.subscribe((isShuffle) => this.isShuffle = isShuffle);
    this.progress$.subscribe((progress) => this.progress = progress);
    this.duration$.subscribe((duration) => this.duration = duration);
    this.isLiked$.subscribe((isLiked) => this.isLiked = isLiked);
  }

  setTrackPosition(position: number): void {
    if (position > this.duration) {
      position = this.duration;
    }
    else if (position < 0) {
      position = 0;
    }

    let requestParams = new HttpParams();
    requestParams = requestParams.append('position_ms', position.toString());

    this.http.put(SpotifyEndpoints.getSeekEndpoint(), {}, {
      headers: this.auth.getAuthHeaders(),
      params: requestParams,
      observe: 'response',
      responseType: 'text'
    }).subscribe((res) => {
      const apiResponse = checkResponse(res, false);
      if (apiResponse === SpotifyAPIResponse.Success) {
        this.store.dispatch(new SetProgress(position));
      }
    });
  }

  setPlaying(isPlaying: boolean): void {
    const endpoint = isPlaying ? SpotifyEndpoints.getPlayEndpoint() : SpotifyEndpoints.getPauseEndpoint();
    // TODO: this has optional parameters for JSON body
    this.http.put(endpoint, {}, {
      headers: this.auth.getAuthHeaders(),
      observe: 'response',
      responseType: 'text'
    }).subscribe((res) => {
        const apiResponse = checkResponse(res, false);
        if (apiResponse === SpotifyAPIResponse.Success) {
          this.store.dispatch(new SetPlaying(isPlaying));
        }
      });
  }

  togglePlaying(): void {
    this.setPlaying(!this.isPlaying);
  }

  skipPrevious(forcePrevious: boolean): void {
    // Check if we should skip to previous track or start of current
    if (!forcePrevious && this.progress > SpotifyControlsService.SKIP_PREVIOUS_THRESHOLD
      && !((SpotifyControlsService.SKIP_PREVIOUS_THRESHOLD * 2) >= this.duration)) {
      this.setTrackPosition(0);
    } else {
      this.http.post(SpotifyEndpoints.getPreviousEndpoint(), {}, {
        headers: this.auth.getAuthHeaders(),
        observe: 'response',
        responseType: 'text'
      }).subscribe();
    }
  }

  skipNext(): void {
    this.http.post(SpotifyEndpoints.getNextEndpoint(), {}, {
      headers: this.auth.getAuthHeaders(),
      observe: 'response',
      responseType: 'text'
    }).subscribe();
  }

  setShuffle(isShuffle: boolean): void {
    let requestParams = new HttpParams();
    requestParams = requestParams.append('state', (isShuffle ? 'true' : 'false'));

    this.http.put(SpotifyEndpoints.getShuffleEndpoint(), {}, {
      headers: this.auth.getAuthHeaders(),
      params: requestParams,
      observe: 'response',
      responseType: 'text'
    }).subscribe((res) => {
      const apiResponse = checkResponse(res, false);
      if (apiResponse === SpotifyAPIResponse.Success) {
        this.store.dispatch(new SetShuffle(isShuffle));
      }
    });
  }

  toggleShuffle(): void {
    this.setShuffle(!this.isShuffle);
  }

  setVolume(volume: number): void {
    if (volume > 100) {
      volume = 100;
    }
    else if (volume < 0) {
      volume = 0;
    }

    let requestParams = new HttpParams();
    requestParams = requestParams.append('volume_percent', volume.toString());

    this.http.put(SpotifyEndpoints.getVolumeEndpoint(), {}, {
      headers: this.auth.getAuthHeaders(),
      params: requestParams,
      observe: 'response'
    }).subscribe((res) => {
      const apiResponse = checkResponse(res, false);
      if (apiResponse === SpotifyAPIResponse.Success) {
        this.store.dispatch(new ChangeDeviceVolume(volume));
      }
    });
  }

  setRepeatState(repeatState: string): void {
    let requestParams = new HttpParams();
    requestParams = requestParams.append('state', repeatState);

    this.http.put(SpotifyEndpoints.getRepeatEndpoint(), {}, {
      headers: this.auth.getAuthHeaders(),
      params: requestParams,
      observe: 'response',
      responseType: 'text'
    }).subscribe((res) => {
      const apiResponse = checkResponse(res, false);
      console.log('apiResponse: ' + apiResponse);
      if (apiResponse === SpotifyAPIResponse.Success) {
        this.store.dispatch(new ChangeRepeatState(repeatState));
      }
    });
  }

  isTrackSaved(id: string): void {
    let requestParams = new HttpParams();
    requestParams = requestParams.append('ids', id);

    this.http.get<boolean[]>(SpotifyEndpoints.getCheckSavedEndpoint(), {
      headers: this.auth.getAuthHeaders(),
      params: requestParams,
      observe: 'response'
    }).subscribe((res) => {
      const apiResponse = checkResponse(res, true);
      if (apiResponse === SpotifyAPIResponse.Success) {
        if (res.body && res.body.length > 0) {
          this.store.dispatch(new SetLiked(res.body[0]));
        }
      }
    });
  }

  setSavedTrack(id: string, isSaved: boolean): void {
    let requestParams = new HttpParams();
    requestParams = requestParams.append('ids', id);

    const savedEndpoint = isSaved ?
      this.http.put(SpotifyEndpoints.getSavedTracksEndpoint(), {}, {
        headers: this.auth.getAuthHeaders(),
        params: requestParams,
        observe: 'response'
      }) :
      this.http.delete(SpotifyEndpoints.getSavedTracksEndpoint(), {
        headers: this.auth.getAuthHeaders(),
        params: requestParams,
        observe: 'response'
      });

    savedEndpoint.subscribe((res) => {
      const apiResponse = checkResponse(res, true);
      if (apiResponse === SpotifyAPIResponse.Success) {
        this.store.dispatch(new SetLiked(isSaved));
      }
    });
  }

  toggleLiked(): void {
    this.setSavedTrack(this.track.id, !this.isLiked);
  }

  setPlaylist(id: string): void {
    if (id === null) {
      this.store.dispatch(new ChangePlaylist(null));
    } else {
      this.http.get<PlaylistResponse>(`${SpotifyEndpoints.getPlaylistsEndpoint()}/${id}`,
        {headers: this.auth.getAuthHeaders(), observe: 'response'})
        .subscribe((res) => {
          const apiResponse = checkResponse(res, true);
          if (apiResponse === SpotifyAPIResponse.Success) {
            this.store.dispatch(new ChangePlaylist(parsePlaylist(res.body)));
          }
        });
    }
  }

  fetchAvailableDevices(): void {
    this.http.get<MultipleDevicesResponse>(SpotifyEndpoints.getDevicesEndpoint(), {headers: this.auth.getAuthHeaders(), observe: 'response'})
      .subscribe((res) => {
        const apiResponse = checkResponse(res, true);
        if (apiResponse === SpotifyAPIResponse.Success) {
          const devices = res.body.devices.map(device => parseDevice(device));
          this.store.dispatch(new SetAvailableDevices(devices));
        }
      });
  }

  setDevice(device: DeviceModel, isPlaying: boolean): void {
    this.http.put(SpotifyEndpoints.getPlaybackEndpoint(), {
      device_ids: [device.id],
      play: isPlaying
    }, {headers: this.auth.getAuthHeaders(), observe: 'response'})
      .subscribe((res) => {
        const apiResponse = checkResponse(res, false);
        if (apiResponse === SpotifyAPIResponse.Success) {
          this.store.dispatch(new ChangeDevice(device));
        }
      });
  }
}
