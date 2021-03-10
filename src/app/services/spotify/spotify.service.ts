import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CurrentPlaybackResponse } from '../../models/current-playback.model';
import { TokenResponse } from '../../models/token.model';
import { generateRandomString } from '../../core/crypto';
import {AppConfig} from '../../app.config';
import {StorageService} from '../storage/storage.service';
import {DeviceResponse, MultipleDevicesResponse} from '../../models/device.model';

// Spotify endpoints
const accountsUrl  = 'https://accounts.spotify.com';
const authEndpoint = accountsUrl + '/authorize';

const apiUrl           = 'https://api.spotify.com/v1';
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

// Local storage keys
const tokenKey = 'AUTH_TOKEN';
const stateKey = 'STATE';

// Configurable values
const stateLength = 40;
const expiryThreshold = 30 * 1000; // 30s
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state'
];

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  protected clientId = AppConfig.settings.auth.clientId;
  protected tokenUrl = AppConfig.settings.auth.tokenUrl;
  protected isDirectSpotifyRequest = AppConfig.settings.auth.isDirectSpotifyRequest;
  protected redirectUri = encodeURI(AppConfig.settings.env.domain + '/callback');

  authToken: TokenResponse = null;
  state: string = null;

  constructor(private http: HttpClient, private storage: StorageService) {
    if (this.authToken === null) {
      const localToken = this.storage.get(tokenKey);
      if (localToken !== null) {
        this.authToken = JSON.parse(localToken);
      }
    }
    // Check if token is expired (deletes expired token)
    // TODO: may not need to do this
    this.tokenExpiresIn();

    this.state = this.storage.get(stateKey);
    if (this.state === null) {
      this.state = generateRandomString(stateLength);
      this.storage.set(stateKey, this.state);
    }
  }

  isAuthTokenSet(): boolean {
    const localToken = this.storage.get(tokenKey);
    if (this.authToken !== null || localToken !== null) {
      if (localToken !== null) {
        this.authToken = JSON.parse(localToken);
      } else {
        this.setAuthToken(this.authToken);
      }
      return true;
    }
    return false;
  }

  requestAuthToken(code: string): Promise<boolean> {
    console.log('Requesting new auth token');
    const tok = this.storage.get(tokenKey);
    if (tok) {
      console.log('Current token: ' + JSON.stringify(tok));
    }

    // Create request body
    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('code', code);
    body.set('redirect_uri', this.redirectUri);

    // Create request headers
    const headers = new HttpHeaders().set(
      'Content-Type', 'application/x-www-form-urlencoded'
    );
    if (this.isDirectSpotifyRequest) {
      headers.set('Authorization', 'Basic ' + btoa(this.clientId + ':' + AppConfig.settings.auth.clientSecret));
    }

    return new Promise<boolean>(resolve => {
      this.http.post<TokenResponse>(this.tokenUrl, body.toString(), {headers})
        .pipe(
          // catchError(err => console.log('Error getting tokens with oauth code: ' + ))
        ).subscribe(token => {
          // Set new auth token
          this.authToken = token;
          this.storage.set(tokenKey, JSON.stringify(token));
          resolve(true);
        },
        error => {
          console.log('Error requesting token: ' + JSON.stringify(error));
          resolve(false);
        });
    });
  }

  setAuthToken(token: TokenResponse): void {
    this.authToken = token;
    this.storage.set(tokenKey, JSON.stringify(token));
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

  getDevices(): Observable<MultipleDevicesResponse> {
    this.checkTokenExpiry();
    return this.http.get<MultipleDevicesResponse>(devicesEndpoint, {headers: this.getHeaders()});
  }

  getAuthorizeRequestUrl(): string {
    const request = authEndpoint +
      '?response_type=code' +
      '&client_id=' + this.clientId +
      (SCOPES ? '&scope=' + encodeURIComponent(SCOPES.join(' ')) : '') +
      '&redirect_uri=' + this.redirectUri +
      '&state=' + this.state;
    return request;
  }

  compareState(state: string): boolean {
    return this.state !== null && this.state === state;
  }

  private checkTokenExpiry(): void {
    const expiresIn = this.tokenExpiresIn();
    if (expiresIn === 0) {
      // Need to authorize a new login, redirect to authorization
      // TODO: potentially could add some info to state here on where to redirect user after callback from OAuth
      window.location.href = this.getAuthorizeRequestUrl();
    } else if (expiresIn < expiryThreshold) {
      // Token is expiring soon. Refresh
      this.requestAuthToken(this.authToken.refresh_token).then(success => {
        if (!success) {
          console.log('Failed to refresh auth token');
        } else {
          console.log('Successfully refreshed auth token');
        }
      });
    }
  }

  private tokenExpiresIn(): number {
    if (this.authToken) {
      const expiresIn = Date.parse(this.authToken.expiry) - Date.now();
      if (expiresIn >= 0) {
        return expiresIn;
      } else {
        console.log('Loaded auth token has expired.');
        // delete token
        this.authToken = null;
        this.storage.remove(tokenKey);
      }
    }
    return 0;
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `${this.authToken.token_type} ${this.authToken.access_token}`
    });
  }
}
