import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfig } from '../../app.config';
import { SetAuthToken } from '../../core/auth/auth.actions';
import { AuthToken } from '../../core/auth/auth.model';
import { AuthState } from '../../core/auth/auth.state';
import {
  ChangeAlbum,
  ChangeDevice,
  ChangeDeviceIsActive,
  ChangeDeviceVolume,
  ChangePlaylist,
  ChangeRepeatState,
  ChangeTrack,
  SetAvailableDevices,
  SetIdle,
  SetLiked,
  SetPlaying,
  SetProgress,
  SetShuffle
} from '../../core/playback/playback.actions';
import { AlbumModel, DeviceModel, PlaylistModel, TrackModel } from '../../core/playback/playback.model';
import { PlaybackState } from '../../core/playback/playback.state';
import { generateRandomString, getIdFromSpotifyUri, parseAlbum, parseDevice, parsePlaylist, parseTrack } from '../../core/util';
import { CurrentPlaybackResponse } from '../../models/current-playback.model';
import { MultipleDevicesResponse } from '../../models/device.model';
import { PlaylistResponse } from '../../models/playlist.model';
import { TokenResponse } from '../../models/token.model';
import { StorageService } from '../storage/storage.service';

export const PREVIOUS_VOLUME = 'PREVIOUS_VOLUME';

const stateKey = 'STATE';

// Spotify endpoints
const accountsUrl  = 'https://accounts.spotify.com';
const authEndpoint = accountsUrl + '/authorize';

const apiUrl = 'https://api.spotify.com/v1';

const playbackEndpoint = apiUrl + '/me/player';
const playEndpoint     = playbackEndpoint + '/play';
const pauseEndpoint    = playbackEndpoint + '/pause';
const nextEndpoint     = playbackEndpoint + '/next';
const previousEndpoint = playbackEndpoint + '/previous';
const volumeEndpoint   = playbackEndpoint + '/volume';
const shuffleEndpoint  = playbackEndpoint + '/shuffle';
const repeatEndpoint   = playbackEndpoint + '/repeat';
const seekEndpoint     = playbackEndpoint + '/seek';
const devicesEndpoint  = playbackEndpoint + '/devices';

const savedTracksEndpoint = apiUrl + '/me/tracks';
const checkSavedEndpoint  = savedTracksEndpoint + '/contains';

const playlistsEndpoint = apiUrl + '/playlists';

// Configurable values
const stateLength = 40;
const expiryThreshold = 30 * 1000; // 30s
const SCOPES = [
  'user-library-read',
  'user-library-modify',
  'user-read-playback-state',
  'user-modify-playback-state'
];
const SKIP_PREVIOUS_THRESHOLD = 3000; // ms

@Injectable({providedIn: 'root'})
export class SpotifyService {
  static initialized = false;
  protected static clientId: string;
  protected static tokenUrl: string;
  protected static albumColorUrl: string;
  protected static isDirectSpotifyRequest: boolean;
  protected static redirectUri: string;

  @Select(AuthState.token) private authToken$: BehaviorSubject<AuthToken>;
  private authToken: AuthToken = null;
  private state: string = null;

  @Select(PlaybackState.track) private track$: BehaviorSubject<TrackModel>;
  private track: TrackModel = null;

  @Select(PlaybackState.album) private album$: BehaviorSubject<AlbumModel>;
  private album: AlbumModel = null;

  @Select(PlaybackState.playlist) private playlist$: BehaviorSubject<PlaylistModel>;
  private playlist: PlaylistModel = null;

  @Select(PlaybackState.device) private device$: BehaviorSubject<DeviceModel>;
  private device: DeviceModel = null;

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

  static initialize(): boolean {
    try {
      this.clientId = AppConfig.settings.auth.clientId;
      this.tokenUrl = AppConfig.settings.auth.tokenUrl;
      this.albumColorUrl = AppConfig.settings.env.albumColorUrl;
      this.isDirectSpotifyRequest = AppConfig.settings.auth.isDirectSpotifyRequest;
      this.redirectUri = encodeURI(AppConfig.settings.env.domain + '/callback');
    } catch (error) {
      console.error('Failed to initialize spotify service: ' + error);
      return false;
    }
    this.initialized = true;
    return true;
  }

  constructor(private http: HttpClient, private storage: StorageService, private store: Store) {
    this.setState();
  }

  initSubscriptions(): void {
    this.authToken$.subscribe((authToken) => this.authToken = authToken);
    this.track$.subscribe((track) => this.track = track);
    this.album$.subscribe((album) => this.album = album);
    this.playlist$.subscribe((playlist) => this.playlist = playlist);
    this.device$.subscribe((device) => this.device = device);
    this.isPlaying$.subscribe((isPlaying) => this.isPlaying = isPlaying);
    this.isShuffle$.subscribe((isShuffle) => this.isShuffle = isShuffle);
    this.progress$.subscribe((progress) => this.progress = progress);
    this.duration$.subscribe((duration) => this.duration = duration);
    this.isLiked$.subscribe((isLiked) => this.isLiked = isLiked);
  }

  requestAuthToken(code: string, isRefresh: boolean): Promise<void> {
    // Create request body
    const body = new URLSearchParams();
    body.set('code', code);
    body.set('grant_type', 'authorization_code');
    if (!isRefresh) {
      body.set('redirect_uri', SpotifyService.redirectUri);
    }

    // Create request headers
    const headers = new HttpHeaders().set(
      'Content-Type', 'application/x-www-form-urlencoded'
    );
    if (SpotifyService.isDirectSpotifyRequest) {
      headers.set('Authorization', `Basic ${btoa(`${SpotifyService.clientId}:${AppConfig.settings.auth.clientSecret}`)}`);
    }

    return new Promise<void>((resolve, reject) => {
      const clientResponse = !isRefresh ?
        this.http.post<TokenResponse>(SpotifyService.tokenUrl, body.toString(), {headers, observe: 'response'}) :
        this.http.put<TokenResponse>(SpotifyService.tokenUrl, body.toString(), {headers, observe: 'response'});

      clientResponse.subscribe((response) => {
          const token = response.body;
          const authToken: AuthToken = {
            accessToken: token.access_token,
            tokenType: token.token_type,
            expiry: token.expiry,
            scope: token.scope,
            refreshToken: token.refresh_token
          };
          this.store.dispatch(new SetAuthToken(authToken));
          resolve();
        },
          (error) => {
          const errStr = `Error requesting token: ${JSON.stringify(error)}`;
          console.error(errStr);
          reject(errStr);
        });
    });
  }

  pollCurrentPlayback(pollingInterval: number): void {
    this.checkTokenExpiry();
    this.http.get<CurrentPlaybackResponse>(playbackEndpoint, {headers: this.getHeaders(), observe: 'response'})
      .pipe(
        map((res: HttpResponse<CurrentPlaybackResponse>) => {
          if (res.status === 200) {
            return res.body;
          }
          else if (res.status === 204) {
            // Playback not available or active
            return null;
          } else {
            console.error(`Received unhandled playback response ${res.status}`);
            return null;
          }
      })).subscribe((playback) => {
        // if not locked?
        if (playback && playback.item) {
          const track = playback.item;

          // Check for new track
          if (track && track.id !== this.track.id) {
            this.store.dispatch(new ChangeTrack(parseTrack(track)));
            // Check if new track is saved
            this.isTrackSaved(track.id);
          }

          // Check for new album
          if (track && track.album && track.album.id !== this.album.id) {
            this.store.dispatch(new ChangeAlbum(parseAlbum(track.album)));
          }

          // Check for new playlist
          if (playback.context && playback.context.type && playback.context.type === 'playlist') {
            const playlistId = getIdFromSpotifyUri(playback.context.uri);
            if (!this.playlist || this.playlist.id !== playlistId) {
              // Retrieve new playlist
              this.getPlaylist(playlistId).subscribe((res) => {
                this.store.dispatch(new ChangePlaylist(parsePlaylist(res)));
              });
            }
          } else if (this.playlist) {
            // No longer playing a playlist, update if we previously were
            this.store.dispatch(new ChangePlaylist(null));
          }

          // Check if volume was muted externally to save previous value
          if (playback.device && playback.device.volume_percent === 0 && this.device.volume > 0) {
            this.storage.set(PREVIOUS_VOLUME, this.device.volume.toString());
          }

          // Get device changes
          if (playback.device) {
            // Check for new device
            if (playback.device && playback.device.id !== this.device.id) {
              this.store.dispatch(new ChangeDevice(parseDevice(playback.device)));
            }

            // Update which device is active
            this.store.dispatch(new ChangeDeviceIsActive(playback.device.is_active));
            this.store.dispatch(new ChangeDeviceVolume(playback.device.volume_percent));
          }

          // Update remaining playback values
          this.store.dispatch(new SetProgress(playback.progress_ms));
          this.store.dispatch(new SetPlaying(playback.is_playing));
          this.store.dispatch(new SetShuffle(playback.shuffle_state));
          this.store.dispatch(new ChangeRepeatState(playback.repeat_state));
          this.store.dispatch(new SetIdle(false));
        } else {
          this.store.dispatch(new SetIdle(true));
        }
      // else locked
        // update progress to current + pollingInterval
    });
  }

  setTrackPosition(position: number): void {
    this.checkTokenExpiry();

    if (position > this.duration) {
      position = this.duration;
    }
    else if (position < 0) {
      position = 0;
    }

    let requestParams = new HttpParams();
    requestParams = requestParams.append('position_ms', position.toString());

    this.http.put(seekEndpoint, {}, {
      headers: this.getHeaders(),
      params: requestParams
    }).subscribe((res) => {
      this.store.dispatch(new SetProgress(position));
    });
  }

  setPlaying(isPlaying: boolean): void {
    this.checkTokenExpiry();
    const endpoint = isPlaying ? playEndpoint : pauseEndpoint;
    // TODO: this has optional parameters for JSON body
    this.http.put(endpoint, {}, {headers: this.getHeaders()})
      .subscribe((res) => {
        this.store.dispatch(new SetPlaying(isPlaying));
      });
  }

  togglePlaying(): void {
    this.setPlaying(!this.isPlaying);
  }

  skipPrevious(forcePrevious: boolean): void {
    this.checkTokenExpiry();
    // Check if we should skip to previous track or start of current
    if (!forcePrevious && this.progress > SKIP_PREVIOUS_THRESHOLD && !((SKIP_PREVIOUS_THRESHOLD * 2) >= this.duration)) {
      this.setTrackPosition(0);
    } else {
      this.http.post(previousEndpoint, {}, {headers: this.getHeaders()}).subscribe();
    }
  }

  skipNext(): void {
    this.checkTokenExpiry();
    this.http.post(nextEndpoint, {}, {headers: this.getHeaders()}).subscribe();
  }

  setShuffle(isShuffle: boolean): void {
    this.checkTokenExpiry();
    let requestParams = new HttpParams();
    requestParams = requestParams.append('state', (isShuffle ? 'true' : 'false'));

    this.http.put(shuffleEndpoint, {}, {
      headers: this.getHeaders(),
      params: requestParams
    }).subscribe((res) => {
      this.store.dispatch(new SetShuffle(isShuffle));
    });
  }

  toggleShuffle(): void {
    this.setShuffle(!this.isShuffle);
  }

  setVolume(volume: number): void {
    this.checkTokenExpiry();

    if (volume > 100) {
      volume = 100;
    }
    else if (volume < 0) {
      volume = 0;
    }

    let requestParams = new HttpParams();
    requestParams = requestParams.append('volume_percent', volume.toString());

    this.http.put(volumeEndpoint, {}, {
      headers: this.getHeaders(),
      params: requestParams
    }).subscribe((res) => {
      this.store.dispatch(new ChangeDeviceVolume(volume));
    });
  }

  setRepeatState(repeatState: string): void {
    this.checkTokenExpiry();
    let requestParams = new HttpParams();
    requestParams = requestParams.append('state', repeatState);

    this.http.put(repeatEndpoint, {}, {
      headers: this.getHeaders(),
      params: requestParams
    }).subscribe((res) => {
      this.store.dispatch(new ChangeRepeatState(repeatState));
    });
  }

  isTrackSaved(id: string): Observable<boolean[]> {
    this.checkTokenExpiry();
    let requestParams = new HttpParams();
    requestParams = requestParams.append('ids', id);

    return this.http.get<boolean[]>(checkSavedEndpoint, {
      headers: this.getHeaders(),
      params: requestParams
    });
  }

  setSavedTrack(id: string, isSaved: boolean): void {
    this.checkTokenExpiry();
    let requestParams = new HttpParams();
    requestParams = requestParams.append('ids', id);
    const options = {
      headers: this.getHeaders(),
      params: requestParams
    };

    if (isSaved) {
      this.http.put(savedTracksEndpoint, {}, options).subscribe((res) => {
        this.store.dispatch(new SetLiked(true));
      });
    } else {
      this.http.delete(savedTracksEndpoint, options).subscribe((res) => {
        this.store.dispatch(new SetLiked(false));
      });
    }
  }

  toggleLiked(): void {
    this.setSavedTrack(this.track.id, !this.isLiked);
  }

  getPlaylist(id: string): Observable<PlaylistResponse> {
    this.checkTokenExpiry();
    return this.http.get<PlaylistResponse>(`${playlistsEndpoint}/${id}`, {headers: this.getHeaders()});
  }

  getDevices(): Observable<MultipleDevicesResponse> {
    this.checkTokenExpiry();
    return this.http.get<MultipleDevicesResponse>(devicesEndpoint, {headers: this.getHeaders()});
  }

  fetchAvailableDevices(): void {
    this.getDevices().subscribe((res) => {
      const devices = res.devices.map(device => parseDevice(device));
      this.store.dispatch(new SetAvailableDevices(devices));
    });
  }

  setDevice(device: DeviceModel, isPlaying: boolean): void {
    this.checkTokenExpiry();
    this.http.put(playbackEndpoint, {
      device_ids: [device.id],
      play: isPlaying
    }, {headers: this.getHeaders()}).subscribe((res) => {
      this.store.dispatch(new ChangeDevice(device));
    });
  }

  getAuthorizeRequestUrl(): string {
    if (!this.state) {
      this.setState();
    }
    return `${authEndpoint}?response_type=code` +
      `&client_id=${SpotifyService.clientId}` +
      (SCOPES ? `&scope=${encodeURIComponent(SCOPES.join(' '))}` : '') +
      `&redirect_uri=${SpotifyService.redirectUri}` +
      `&state=${this.state}&show_dialog=true`;
  }

  getAlbumColor(coverArtUrl: string): Observable<string> {
    let requestParams = new HttpParams();
    requestParams = requestParams.append('url', encodeURIComponent(coverArtUrl));
    // Check we have an album color URL set
    if (SpotifyService.albumColorUrl) {
      return this.http.get<string>(SpotifyService.albumColorUrl, {
        params: requestParams
      });
    }
    return of<string>(null);
  }

  compareState(state: string): boolean {
    return !!this.state && this.state === state;
  }

  logout(): void {
    this.store.dispatch(new SetAuthToken(null));
    this.state = null;
    this.authToken = null;
    this.storage.remove(stateKey);
    this.storage.removeAuthToken();
  }

  private checkTokenExpiry(): AuthToken {
    const expiresIn = this.tokenExpiresIn();
    if (expiresIn < 0) {
      // Need to authorize a new login, redirect to authorization
      // this.router.navigateByUrl('/login');
    } else if (expiresIn < expiryThreshold) {
      // Token is expiring soon or has expired. Refresh the token
      this.requestAuthToken(this.authToken.refreshToken, true)
        .then((res) => {
          return res;
        }).catch((reason) => {
          console.error(`Spotify request failed: ${reason}`);
          this.logout();
          // this.router.navigateByUrl('/login');
        });
    }
    return null;
  }

  private tokenExpiresIn(): number {
    if (this.authToken) {
      const expiresIn = Date.parse(this.authToken.expiry) - Date.now();
      if (expiresIn >= 0) {
        return expiresIn;
      } else {
        return 0;
      }
    }
    return -1; // no auth token exists
  }

  private setState(): void {
    this.state = this.storage.get(stateKey);
    if (this.state === null) {
      this.state = generateRandomString(stateLength);
      this.storage.set(stateKey, this.state);
    }
  }

  private getHeaders(): HttpHeaders {
    if (this.authToken) {
      return new HttpHeaders({
        Authorization: `${this.authToken.tokenType} ${this.authToken.accessToken}`
      });
    }
    console.error('No auth token present');
    return null;
  }
}
