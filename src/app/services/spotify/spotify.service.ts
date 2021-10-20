import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CurrentPlaybackResponse } from '../../models/current-playback.model';
import { TokenResponse } from '../../models/token.model';
import { generateRandomString } from '../../core/crypto';
import { AppConfig } from '../../app.config';
import { StorageService } from '../storage/storage.service';
import { MultipleDevicesResponse } from '../../models/device.model';
import { AuthToken } from '../../core/auth/auth.model';
import {Router} from '@angular/router';
import {Select, Store} from '@ngxs/store';
import {AuthState} from '../../core/auth/auth.state';

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


// Local storage keys
const tokenKey = 'AUTH_TOKEN';
const stateKey = 'STATE';

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
  protected static isDirectSpotifyRequest: boolean;
  protected static redirectUri: string;

  @Select(AuthState.token) token$: Observable<AuthToken>;
  private authToken: AuthToken = null;
  private readonly state: string = null;
  private isAuthenticating = false;
  private oAuthTimerId: number = null;

  static initialize(): boolean {
    try {
      this.clientId = AppConfig.settings.auth.clientId;
      this.tokenUrl = AppConfig.settings.auth.tokenUrl;
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
    this.state = this.storage.get(stateKey);
    if (this.state === null) {
      this.state = generateRandomString(stateLength);
      this.storage.set(stateKey, this.state);
    }

    this.token$.subscribe(token => {
      this.authToken = token;
      console.log('SpotifyService: Auth token updated: ' + JSON.stringify(this.authToken));
    });
  }

  requestAuthToken(code: string): Promise<AuthToken> {
    console.log('Requesting new auth token');
    // Create request body
    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('code', code);
    body.set('redirect_uri', SpotifyService.redirectUri);

    // Create request headers
    const headers = new HttpHeaders().set(
      'Content-Type', 'application/x-www-form-urlencoded'
    );
    if (SpotifyService.isDirectSpotifyRequest) {
      headers.set('Authorization', 'Basic ' + btoa(SpotifyService.clientId + ':' + AppConfig.settings.auth.clientSecret));
    }

    return new Promise<AuthToken>((resolve, reject) => {
      this.http.post<TokenResponse>(SpotifyService.tokenUrl, body.toString(), {headers})
        .pipe(
          // catchError(err => console.log('Error getting tokens with oauth code: ' + ))
        ).subscribe((token) => {
          const authToken: AuthToken = {
            accessToken: token.access_token,
            tokenType: token.token_type,
            expiry: token.expiry,
            scope: token.scope,
            refreshToken: token.refresh_token
          };
          console.log('Returning new token: ' + JSON.stringify(authToken));
          resolve(authToken);
        },
        error => {
          // TODO: delete currently saved auth token and re-request a new one?
          console.error('Error requesting token: ' + JSON.stringify(error));
          reject(`Error requesting token: ${JSON.stringify(error)}`);
        });
    });
  }

  getCurrentTrack(): Observable<CurrentPlaybackResponse> {
    this.checkTokenExpiry();
    return this.http.get<CurrentPlaybackResponse>(playbackEndpoint, {headers: this.getHeaders()});
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
    if (isPlaying) {
      // TODO: this has optional parameters for JSON body
      return this.http.put(playEndpoint, {}, {headers: this.getHeaders()});
    } else {
      return this.http.put(pauseEndpoint, {}, {headers: this.getHeaders()});
    }
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

  getDevices(): Observable<MultipleDevicesResponse> {
    this.checkTokenExpiry();
    return this.http.get<MultipleDevicesResponse>(devicesEndpoint, {headers: this.getHeaders()});
  }

  setDevice(id: string): Observable<any> {
    this.checkTokenExpiry();
    return this.http.put(playbackEndpoint, {
      device_ids: [id],
      play: true
    }, {headers: this.getHeaders()});
  }

  getAuthorizeRequestUrl(): string {
    const request = authEndpoint +
      '?response_type=code' +
      '&client_id=' + SpotifyService.clientId +
      (SCOPES ? '&scope=' + encodeURIComponent(SCOPES.join(' ')) : '') +
      '&redirect_uri=' + SpotifyService.redirectUri +
      '&state=' + this.state;
    return request;
  }

  compareState(state: string): boolean {
    return this.state !== null && this.state === state;
  }

  private checkTokenExpiry(): void {
    const expiresIn = this.tokenExpiresIn();
    if (expiresIn < 0) {
      // Need to authorize a new login, redirect to authorization
      // TODO: potentially could add some info to state here on where to redirect user after callback from OAuth
      // window.location.href = this.getAuthorizeRequestUrl();
      // Redirect to /login
      this.router.navigateByUrl('/login');
    } else if (expiresIn < expiryThreshold) {
      // Token is expiring soon or has expired. Refresh the token
      this.requestAuthToken(this.authToken.refreshToken).then(success => {
        if (!success) {
          console.error('Failed to refresh auth token');
        } else {
          console.log('Successfully refreshed auth token');
        }
      });
    }
  }

  toggleIsAuthenticating(): void {
    this.isAuthenticating = !this.isAuthenticating;
  }

  private tokenExpiresIn(): number {
    if (this.authToken) {
      const expiresIn = Date.parse(this.authToken.expiry) - Date.now();
      if (expiresIn >= 0) {
        return expiresIn;
      } else {
        console.log('Loaded auth token has expired.');
        return 0;
      }
    }
    return -1; // no auth token exists
  }

  private getHeaders(): HttpHeaders {
    // this.authToken = null; // test
    if (this.authToken) {
      return new HttpHeaders({
        Authorization: `${this.authToken.tokenType} ${this.authToken.accessToken}`
      });
    }
    console.error('No auth token present');
    return null;
  }
}
