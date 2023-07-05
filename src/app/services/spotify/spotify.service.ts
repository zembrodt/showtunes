import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
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
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateRandomString,
  getIdFromSpotifyUri,
  parseAlbum,
  parseDevice,
  parsePlaylist,
  parseTrack,
} from '../../core/util';
import { SmartColorResponse } from '../../models/album.model';
import { CurrentPlaybackResponse } from '../../models/current-playback.model';
import { MultipleDevicesResponse } from '../../models/device.model';
import { PlaylistResponse } from '../../models/playlist.model';
import { TokenResponse } from '../../models/token.model';
import { StorageService } from '../storage/storage.service';

export enum SpotifyAPIResponse {
  Success,
  NoPlayback,
  ReAuthenticated,
  Error
}

export enum AuthType {
  PKCE,
  Secret,
  ThirdParty
}

@Injectable({providedIn: 'root'})
export class SpotifyService {
  public static initialized = false;
  private static clientId: string;
  private static clientSecret: string = null;
  private static scopes: string = null;
  private static tokenUrl: string = null;
  private static authType: AuthType;
  public static spotifyApiUrl: string;
  public static spotifyEndpoints: SpotifyEndpoints;
  public static albumColorUrl: string;
  private static redirectUri: string;
  private static showAuthDialog = true;

  public static readonly PREVIOUS_VOLUME = 'PREVIOUS_VOLUME';
  private static readonly ACCOUNTS_ENDPOINT = 'https://accounts.spotify.com';
  private static readonly AUTH_ENDPOINT = `${SpotifyService.ACCOUNTS_ENDPOINT}/authorize`;
  public static readonly TOKEN_ENDPOINT = `${SpotifyService.ACCOUNTS_ENDPOINT}/api/token`;
  private static readonly STATE_KEY = 'STATE';
  private static readonly CODE_VERIFIER_KEY = 'CODE_VERIFIER';
  private static readonly STATE_LENGTH = 40;
  private static readonly SKIP_PREVIOUS_THRESHOLD = 3000; // ms

  @Select(AuthState.token) private authToken$: BehaviorSubject<AuthToken>;
  private authToken: AuthToken = null;
  private state: string = null;
  private codeVerifier = null;

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
    this.initialized = true;
    try {
      this.clientId = AppConfig.settings.auth.clientId;
      if (!this.clientId) {
        console.error('No Spotify API Client ID provided');
        this.initialized = false;
      }

      this.tokenUrl = AppConfig.settings.auth.tokenUrl;
      this.clientSecret = AppConfig.settings.auth.clientSecret;
      this.scopes = AppConfig.settings.auth.scopes;
      this.showAuthDialog = AppConfig.settings.auth.showDialog;

      if (AppConfig.settings.auth.forcePkce || (!this.tokenUrl && !this.clientSecret)) {
        this.authType = AuthType.PKCE;
      } else if (this.tokenUrl) {
        this.authType = AuthType.ThirdParty;
      } else {
        this.authType = AuthType.Secret;
      }

      this.spotifyApiUrl = AppConfig.settings.env.spotifyApiUrl;
      if (!this.spotifyApiUrl) {
        console.error('No Spotify API URL configured');
        this.initialized = false;
      } else {
        this.spotifyEndpoints = new SpotifyEndpoints(this.spotifyApiUrl);
      }

      if (AppConfig.settings.env.domain) {
        this.redirectUri = encodeURI(AppConfig.settings.env.domain + '/callback');
      } else {
        console.error('No domain set for Spotify OAuth callback URL');
        this.initialized = false;
      }

      this.albumColorUrl = AppConfig.settings.env.albumColorUrl;
      if (!this.albumColorUrl) {
        console.warn('No album color URL is configured. Related features are disabled');
      }
    } catch (error) {
      console.error(`Failed to initialize spotify service: ${error}`);
      this.initialized = false;
    }
    return this.initialized;
  }

  constructor(private http: HttpClient, private storage: StorageService, private store: Store) {
    this.setState();
    this.setCodeVerifier();
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
    let headers = new HttpHeaders().set(
      'Content-Type', 'application/x-www-form-urlencoded'
    );
    // Set Authorization header if needed
    if (SpotifyService.authType === AuthType.Secret) {
      headers = headers.set(
        'Authorization', `Basic ${new Buffer(`${SpotifyService.clientId}:${SpotifyService.clientSecret}`).toString('base64')}`
      );
    }

    const body = new URLSearchParams({
      grant_type: (!isRefresh ? 'authorization_code' : 'refresh_token'),
      client_id: SpotifyService.clientId,
      ...(!isRefresh) && {
        code,
        redirect_uri: SpotifyService.redirectUri,
        code_verifier: this.codeVerifier
      },
      ...(isRefresh) && {
        refresh_token: code
      }
    });

    return new Promise<void>((resolve, reject) => {
      const endpoint = SpotifyService.authType === AuthType.ThirdParty ? SpotifyService.tokenUrl : SpotifyService.TOKEN_ENDPOINT;
      this.http.post<TokenResponse>(endpoint, body, {headers, observe: 'response'})
        .subscribe((response) => {
            const token = response.body;
            let expiry: Date;
            if (SpotifyService.authType === AuthType.ThirdParty && token.expiry) {
              expiry = new Date(token.expiry);
            } else {
              expiry = new Date();
              expiry.setSeconds(expiry.getSeconds() + token.expires_in);
            }

            const authToken: AuthToken = {
              accessToken: token.access_token,
              tokenType: token.token_type,
              expiry,
              scope: token.scope,
              refreshToken: token.refresh_token
            };
            this.store.dispatch(new SetAuthToken(authToken));
            resolve();
          },
          (error) => {
            const errMsg = `Error requesting token: ${JSON.stringify(error)}`;
            console.error(errMsg);
            reject(errMsg);
          });
    });
  }

  getAuthorizeRequestUrl(): Promise<string> {
    const args = new URLSearchParams({
      response_type: 'code',
      client_id: SpotifyService.clientId,
      scope: SpotifyService.scopes,
      redirect_uri: SpotifyService.redirectUri,
      state: this.getState(),
      show_dialog: `${SpotifyService.showAuthDialog}`
    });
    if (SpotifyService.authType === AuthType.PKCE) {
      return generateCodeChallenge(this.getCodeVerifier()).then((codeChallenge) => {
        args.set('code_challenge_method', 'S256');
        args.set('code_challenge', codeChallenge);
        return `${SpotifyService.AUTH_ENDPOINT}?${args}`;
      });
    } else {
      return Promise.resolve(`${SpotifyService.AUTH_ENDPOINT}?${args}`);
    }
  }

  pollCurrentPlayback(pollingInterval: number): void {
    this.http.get<CurrentPlaybackResponse>(SpotifyService.spotifyEndpoints.getPlaybackEndpoint(), {observe: 'response'})
      .pipe(
        map((res: HttpResponse<CurrentPlaybackResponse>) => {
          const apiResponse = this.checkResponseWithPlayback(res, true, true);
          if (apiResponse === SpotifyAPIResponse.Success) {
            return res.body;
          }
          else if (apiResponse === SpotifyAPIResponse.NoPlayback) {
            // Playback not available or active
            return null;
          }
          return null;
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
              this.setPlaylist(playlistId);
            }
          } else if (this.playlist) {
            // No longer playing a playlist, update if we previously were
            this.store.dispatch(new ChangePlaylist(null));
          }

          // Check if volume was muted externally to save previous value
          if (playback.device && playback.device.volume_percent === 0 && this.device.volume > 0) {
            this.storage.set(SpotifyService.PREVIOUS_VOLUME, this.device.volume.toString());
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
    if (position > this.duration) {
      position = this.duration;
    }
    else if (position < 0) {
      position = 0;
    }

    let requestParams = new HttpParams();
    requestParams = requestParams.append('position_ms', position.toString());

    this.http.put(SpotifyService.spotifyEndpoints.getSeekEndpoint(), {}, {
      headers: this.getHeaders(),
      params: requestParams,
      observe: 'response'
    }).subscribe((res) => {
      const apiResponse = this.checkResponse(res, false);
      if (apiResponse === SpotifyAPIResponse.Success) {
        this.store.dispatch(new SetProgress(position));
      }
    });
  }

  setPlaying(isPlaying: boolean): void {
    const endpoint = isPlaying ? SpotifyService.spotifyEndpoints.getPlayEndpoint() : SpotifyService.spotifyEndpoints.getPauseEndpoint();
    // TODO: this has optional parameters for JSON body
    this.http.put(endpoint, {}, {headers: this.getHeaders(), observe: 'response'})
      .subscribe((res) => {
        const apiResponse = this.checkResponse(res, false);
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
    if (!forcePrevious && this.progress > SpotifyService.SKIP_PREVIOUS_THRESHOLD
        && !((SpotifyService.SKIP_PREVIOUS_THRESHOLD * 2) >= this.duration)) {
      this.setTrackPosition(0);
    } else {
      this.http.post(SpotifyService.spotifyEndpoints.getPreviousEndpoint(), {},
        {headers: this.getHeaders(), observe: 'response'}).subscribe();
    }
  }

  skipNext(): void {
    this.http.post(SpotifyService.spotifyEndpoints.getNextEndpoint(), {}, {headers: this.getHeaders(), observe: 'response'}).subscribe();
  }

  setShuffle(isShuffle: boolean): void {
    let requestParams = new HttpParams();
    requestParams = requestParams.append('state', (isShuffle ? 'true' : 'false'));

    this.http.put(SpotifyService.spotifyEndpoints.getShuffleEndpoint(), {}, {
      headers: this.getHeaders(),
      params: requestParams,
      observe: 'response'
    }).subscribe((res) => {
      const apiResponse = this.checkResponse(res, false);
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

    this.http.put(SpotifyService.spotifyEndpoints.getVolumeEndpoint(), {}, {
      headers: this.getHeaders(),
      params: requestParams,
      observe: 'response'
    }).subscribe((res) => {
      const apiResponse = this.checkResponse(res, false);
      if (apiResponse === SpotifyAPIResponse.Success) {
        this.store.dispatch(new ChangeDeviceVolume(volume));
      }
    });
  }

  setRepeatState(repeatState: string): void {
    let requestParams = new HttpParams();
    requestParams = requestParams.append('state', repeatState);

    this.http.put(SpotifyService.spotifyEndpoints.getRepeatEndpoint(), {}, {
      headers: this.getHeaders(),
      params: requestParams,
      observe: 'response'
    }).subscribe((res) => {
      const apiResponse = this.checkResponse(res, false);
      if (apiResponse === SpotifyAPIResponse.Success) {
        this.store.dispatch(new ChangeRepeatState(repeatState));
      }
    });
  }

  isTrackSaved(id: string): void {
    let requestParams = new HttpParams();
    requestParams = requestParams.append('ids', id);

    this.http.get<boolean[]>(SpotifyService.spotifyEndpoints.getCheckSavedEndpoint(), {
      headers: this.getHeaders(),
      params: requestParams,
      observe: 'response'
    }).subscribe((res) => {
      const apiResponse = this.checkResponse(res, true);
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
      this.http.put(SpotifyService.spotifyEndpoints.getSavedTracksEndpoint(), {}, {
        headers: this.getHeaders(),
        params: requestParams,
        observe: 'response'
      }) :
      this.http.delete(SpotifyService.spotifyEndpoints.getSavedTracksEndpoint(), {
        headers: this.getHeaders(),
        params: requestParams,
        observe: 'response'
      });

    savedEndpoint.subscribe((res) => {
      const apiResponse = this.checkResponse(res, true);
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
      this.http.get<PlaylistResponse>(`${SpotifyService.spotifyEndpoints.getPlaylistsEndpoint()}/${id}`,
        {headers: this.getHeaders(), observe: 'response'})
        .subscribe((res) => {
          const apiResponse = this.checkResponse(res, true);
          if (apiResponse === SpotifyAPIResponse.Success) {
            this.store.dispatch(new ChangePlaylist(parsePlaylist(res.body)));
          }
        });
    }
  }

  fetchAvailableDevices(): void {
    this.http.get<MultipleDevicesResponse>(SpotifyService.spotifyEndpoints.getDevicesEndpoint(), {headers: this.getHeaders(), observe: 'response'})
      .subscribe((res) => {
        const apiResponse = this.checkResponse(res, true);
        if (apiResponse === SpotifyAPIResponse.Success) {
          const devices = res.body.devices.map(device => parseDevice(device));
          this.store.dispatch(new SetAvailableDevices(devices));
        }
      });
  }

  setDevice(device: DeviceModel, isPlaying: boolean): void {
    this.http.put(SpotifyService.spotifyEndpoints.getPlaybackEndpoint(), {
      device_ids: [device.id],
      play: isPlaying
    }, {headers: this.getHeaders(), observe: 'response'})
      .subscribe((res) => {
        const apiResponse = this.checkResponse(res, false);
        if (apiResponse === SpotifyAPIResponse.Success) {
          this.store.dispatch(new ChangeDevice(device));
        }
      });
  }

  getAlbumColor(coverArtUrl: string): Observable<SmartColorResponse> {
    let requestParams = new HttpParams();
    requestParams = requestParams.append('url', encodeURIComponent(coverArtUrl));
    // Check we have an album color URL set
    if (SpotifyService.albumColorUrl) {
      return this.http.get<SmartColorResponse>(SpotifyService.albumColorUrl, {
        params: requestParams
      });
    }
    return of<SmartColorResponse>(null);
  }

  compareState(state: string): boolean {
    return !!this.state && this.state === state;
  }

  logout(): void {
    this.store.dispatch(new SetAuthToken(null));
    this.state = null;
    this.codeVerifier = null;
    this.authToken = null;
    this.storage.remove(SpotifyService.STATE_KEY);
    this.storage.removeAuthToken();
  }

  /**
   * Checks a Spotify API error response against common error response codes
   * @param res
   */
  checkErrorResponse(res: HttpErrorResponse): Promise<SpotifyAPIResponse> {
    if (res.status === 401) {
      // Expired token
      return this.requestAuthToken(this.authToken.refreshToken, true)
        .then(() => {
          return SpotifyAPIResponse.ReAuthenticated;
        })
        .catch((reason) => {
          console.error(`Spotify request failed to reauthenticate after token expiry: ${reason}`);
          this.logout();
          return SpotifyAPIResponse.Error;
        });
    }
    else if (res.status === 403) {
      // Bad OAuth request
      this.logout();
      return Promise.resolve(SpotifyAPIResponse.Error);
    }
    else if (res.status === 429) {
      console.error('Spotify rate limits exceeded');
      this.logout();
      return Promise.resolve(SpotifyAPIResponse.Error);
    } else {
      console.error(`Unexpected response ${res.status}: ${res.statusText}`);
      return Promise.resolve(SpotifyAPIResponse.Error);
    }
  }

  /**
   * Checks a Spotify API response against common response codes
   * @param res
   * @param hasResponse
   * @private
   */
  private checkResponse(res: HttpResponse<any>, hasResponse: boolean): SpotifyAPIResponse {
    return this.checkResponseWithPlayback(res, hasResponse, false);
  }

  private checkResponseWithPlayback(res: HttpResponse<any>, hasResponse: boolean, isPlayback: boolean): SpotifyAPIResponse {
    if (res.status === 200 && (hasResponse || isPlayback)) {
      return SpotifyAPIResponse.Success;
    }
    else if (res.status === 204 && (!hasResponse || isPlayback)) {
      return isPlayback ? SpotifyAPIResponse.NoPlayback : SpotifyAPIResponse.Success;
    }
  }

  private getState(): string {
    if (!this.state) {
      this.setState();
    }
    return this.state;
  }

  private setState(): void {
    this.state = this.storage.get(SpotifyService.STATE_KEY);
    if (this.state === null) {
      this.state = generateRandomString(SpotifyService.STATE_LENGTH);
      this.storage.set(SpotifyService.STATE_KEY, this.state);
    }
  }

  private getCodeVerifier(): string {
    if (!this.codeVerifier) {
      this.setCodeVerifier();
    }
    return this.codeVerifier;
  }

  private setCodeVerifier(): void {
    this.codeVerifier = this.storage.get(SpotifyService.CODE_VERIFIER_KEY);
    if (!this.codeVerifier) {
      this.codeVerifier = generateCodeVerifier(43, 128);
      this.storage.set(SpotifyService.CODE_VERIFIER_KEY, this.codeVerifier);
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

  getAuthorizationHeader(): string {
    if (this.authToken) {
      return `${this.authToken.tokenType} ${this.authToken.accessToken}`;
    }
    console.error('No auth token present');
    return null;
  }
}

class SpotifyEndpoints {
  private readonly apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  getPlaybackEndpoint(): string {
    return this.apiUrl + '/me/player';
  }

  getPlayEndpoint(): string {
    return this.getPlaybackEndpoint() + '/play';
  }

  getPauseEndpoint(): string {
    return this.getPlaybackEndpoint() + '/pause';
  }

  getNextEndpoint(): string {
    return this.getPlaybackEndpoint() + '/next';
  }

  getPreviousEndpoint(): string {
    return this.getPlaybackEndpoint() + '/previous';
  }

  getVolumeEndpoint(): string {
    return this.getPlaybackEndpoint() + '/volume';
  }

  getShuffleEndpoint(): string {
    return this.getPlaybackEndpoint() + '/shuffle';
  }

  getRepeatEndpoint(): string {
    return this.getPlaybackEndpoint() + '/repeat';
  }

  getSeekEndpoint(): string {
    return this.getPlaybackEndpoint() + '/seek';
  }

  getDevicesEndpoint(): string {
    return this.getPlaybackEndpoint() + '/devices';
  }

  getSavedTracksEndpoint(): string {
    return this.apiUrl + '/me/tracks';
  }

  getCheckSavedEndpoint(): string {
    return this.getSavedTracksEndpoint() + '/contains';
  }

  getPlaylistsEndpoint(): string {
    return this.apiUrl + '/playlists';
  }
}
