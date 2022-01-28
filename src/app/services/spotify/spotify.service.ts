import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfig } from '../../app.config';
import { SetAuthToken } from '../../core/auth/auth.actions';
import { AuthToken } from '../../core/auth/auth.model';
import { AuthState } from '../../core/auth/auth.state';
import { generateRandomString } from '../../core/util';
import { CurrentPlaybackResponse } from '../../models/current-playback.model';
import { MultipleDevicesResponse } from '../../models/device.model';
import { PlaylistResponse } from '../../models/playlist.model';
import { TokenResponse } from '../../models/token.model';
import { StorageService } from '../storage/storage.service';

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

@Injectable({providedIn: 'root'})
export class SpotifyService {
  static initialized = false;
  protected static clientId: string;
  protected static tokenUrl: string;
  protected static albumColorUrl: string;
  protected static isDirectSpotifyRequest: boolean;
  protected static redirectUri: string;

  @Select(AuthState.token) token$: Observable<AuthToken>;
  private authToken: AuthToken = null;
  private state: string = null;
  private isAuthenticating = false;

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

  constructor(private http: HttpClient, private storage: StorageService, private router: Router, private store: Store) {
    this.setState();
    this.initSubscriptions();
  }

  initSubscriptions(): void {
    if (this.token$) {
      this.token$.subscribe(token => {
        this.authToken = token;
      });
    }
  }

  requestAuthToken(code: string, isRefresh: boolean): Promise<AuthToken> {
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

    return new Promise<AuthToken>((resolve, reject) => {
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
          resolve(authToken);
        },
          (error) => {
          const errStr = `Error requesting token: ${JSON.stringify(error)}`;
          console.error(errStr);
          reject(errStr);
        });
    });
  }

  getCurrentTrack(): Observable<CurrentPlaybackResponse> {
    this.checkTokenExpiry();
    return this.http.get<CurrentPlaybackResponse>(playbackEndpoint, {headers: this.getHeaders(), observe: 'response'})
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
      }));
  }

  setTrackPosition(position: number): Observable<any> {
    this.checkTokenExpiry();
    let requestParams = new HttpParams();
    requestParams = requestParams.append('position_ms', position.toString());

    return this.http.put(seekEndpoint, {}, {
      headers: this.getHeaders(),
      params: requestParams
    });
  }

  setPlaying(isPlaying: boolean): Observable<any> {
    this.checkTokenExpiry();
    const endpoint = isPlaying ? playEndpoint : pauseEndpoint;
    // TODO: this has optional parameters for JSON body
    return this.http.put(endpoint, {}, {headers: this.getHeaders()});
  }

  skipNext(): Observable<any> {
    this.checkTokenExpiry();
    return this.http.post(nextEndpoint, {}, {headers: this.getHeaders()});
  }

  skipPrevious(): Observable<any> {
    this.checkTokenExpiry();
    return this.http.post(previousEndpoint, {}, {headers: this.getHeaders()});
  }

  toggleShuffle(isShuffle: boolean): Observable<any> {
    this.checkTokenExpiry();
    let requestParams = new HttpParams();
    requestParams = requestParams.append('state', (isShuffle ? 'true' : 'false'));

    return this.http.put(shuffleEndpoint, {}, {
      headers: this.getHeaders(),
      params: requestParams
    });
  }

  setVolume(volume: number): Observable<any> {
    this.checkTokenExpiry();
    let requestParams = new HttpParams();
    requestParams = requestParams.append('volume_percent', volume.toString());

    return this.http.put(volumeEndpoint, {}, {
      headers: this.getHeaders(),
      params: requestParams
    });
  }

  setRepeatState(repeatState: string): Observable<any> {
    this.checkTokenExpiry();
    let requestParams = new HttpParams();
    requestParams = requestParams.append('state', repeatState);

    return this.http.put(repeatEndpoint, {}, {
      headers: this.getHeaders(),
      params: requestParams
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

  setSavedTrack(id: string, isSaved: boolean): Observable<any> {
    this.checkTokenExpiry();
    let requestParams = new HttpParams();
    requestParams = requestParams.append('ids', id);
    const options = {
      headers: this.getHeaders(),
      params: requestParams
    };

    if (isSaved) {
      return this.http.put(savedTracksEndpoint, {}, options);
    } else {
      return this.http.delete(savedTracksEndpoint, options);
    }
  }

  getPlaylist(id: string): Observable<PlaylistResponse> {
    this.checkTokenExpiry();
    return this.http.get<PlaylistResponse>(`${playlistsEndpoint}/${id}`, {headers: this.getHeaders()});
  }

  getDevices(): Observable<MultipleDevicesResponse> {
    this.checkTokenExpiry();
    return this.http.get<MultipleDevicesResponse>(devicesEndpoint, {headers: this.getHeaders()});
  }

  setDevice(id: string, isPlaying: boolean): Observable<any> {
    this.checkTokenExpiry();
    return this.http.put(playbackEndpoint, {
      device_ids: [id],
      play: isPlaying
    }, {headers: this.getHeaders()});
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
    this.state = null;
    this.authToken = null;
    this.storage.remove(stateKey);
    this.storage.removeAuthToken();
  }

  toggleIsAuthenticating(): void {
    this.isAuthenticating = !this.isAuthenticating;
  }

  private checkTokenExpiry(): void {
    const expiresIn = this.tokenExpiresIn();
    if (expiresIn < 0) {
      // Need to authorize a new login, redirect to authorization
      this.router.navigateByUrl('/login');
    } else if (expiresIn < expiryThreshold) {
      // Token is expiring soon or has expired. Refresh the token
      this.requestAuthToken(this.authToken.refreshToken, true)
        .then((res) => {
          this.store.dispatch(new SetAuthToken(res));
        }).catch((reason) => {
          console.error(`Spotify request failed: ${reason}`);
          this.logout();
          this.router.navigateByUrl('/login');
        });
    }
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
