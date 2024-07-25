import { HttpClient, HttpErrorResponse, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { BehaviorSubject } from 'rxjs';
import { AppConfig } from '../../../app.config';
import { SetAuthToken } from '../../../core/auth/auth.actions';
import { AuthToken } from '../../../core/auth/auth.model';
import { AuthState } from '../../../core/auth/auth.state';
import { SetPlayerState } from '../../../core/playback/playback.actions';
import { PlayerState } from '../../../core/playback/playback.model';
import { SpotifyEndpoints } from '../../../core/spotify/spotify-endpoints';
import { AuthType, SpotifyAPIResponse } from '../../../core/types';
import { generateCodeChallenge, generateCodeVerifier, generateRandomString } from '../../../core/util';
import { TokenResponse } from '../../../models/token.model';
import { StorageService } from '../../storage/storage.service';

@Injectable({providedIn: 'root'})
export class SpotifyAuthService {
  private static readonly STATE_KEY = 'STATE';
  private static readonly CODE_VERIFIER_KEY = 'CODE_VERIFIER';
  private static readonly STATE_LENGTH = 40;

  public static initialized = false;
  private static clientId: string;
  private static clientSecret: string = null;
  private static scopes: string = null;
  private static tokenUrl: string = null;
  private static authType: AuthType;
  private static redirectUri: string;
  private static showAuthDialog = true;

  @Select(AuthState.token) private authToken$: BehaviorSubject<AuthToken>;
  private authToken: AuthToken = null;
  private state: string = null;
  private codeVerifier = null;

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

      if (!SpotifyEndpoints.getSpotifyApiUrl()) {
        console.error('No Spotify API URL configured');
        this.initialized = false;
      } else if (!SpotifyEndpoints.getSpotifyAccountsUrl()) {
        console.error('No Spotify Accounts URL configured');
        this.initialized = false;
      }

      if (AppConfig.settings.env.domain) {
        this.redirectUri = encodeURI(AppConfig.settings.env.domain + '/callback');
      } else {
        console.error('No domain set for Spotify OAuth callback URL');
        this.initialized = false;
      }
    } catch (error) {
      console.error(`Failed to initialize spotify service: ${error}`);
      this.initialized = false;
    }
    return this.initialized;
  }

  constructor(private http: HttpClient, private store: Store, private storage: StorageService) {
    this.setState();
    this.setCodeVerifier();
  }

  initSubscriptions(): void {
    this.authToken$.subscribe((authToken) => this.authToken = authToken);
  }

  requestAuthToken(code: string, isRefresh: boolean): Promise<void> {
    let headers = new HttpHeaders().set(
      'Content-Type', 'application/x-www-form-urlencoded'
    );
    // Set Authorization header if needed
    if (SpotifyAuthService.authType === AuthType.Secret) {
      headers = headers.set(
        'Authorization', `Basic ${new Buffer(`${SpotifyAuthService.clientId}:${SpotifyAuthService.clientSecret}`).toString('base64')}`
      );
    }

    const body = new URLSearchParams({
      grant_type: (!isRefresh ? 'authorization_code' : 'refresh_token'),
      client_id: SpotifyAuthService.clientId,
      ...(!isRefresh) && {
        code,
        redirect_uri: SpotifyAuthService.redirectUri,
        code_verifier: this.codeVerifier
      },
      ...(isRefresh) && {
        refresh_token: code
      }
    });

    return new Promise<void>((resolve, reject) => {
      const endpoint = SpotifyAuthService.authType === AuthType.ThirdParty ?
        SpotifyAuthService.tokenUrl : SpotifyEndpoints.getTokenEndpoint();
      this.http.post<TokenResponse>(endpoint, body, {headers, observe: 'response'})
        .subscribe((response) => {
            const token = response.body;
            let expiry: Date;
            if (SpotifyAuthService.authType === AuthType.ThirdParty && token.expiry) {
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
            this.store.dispatch(new SetAuthToken(authToken))
              .subscribe(() => resolve());
          },
          (error) => {
            const errMsg = `Error requesting token: ${JSON.stringify(error)}`;
            console.error(errMsg);
            reject(errMsg);
          });
    });
  }

  /**
   * Checks a Spotify API error response against common error response codes
   * @param res the http response
   */
  checkErrorResponse(res: HttpErrorResponse): Promise<SpotifyAPIResponse> {
    switch (res.status) {
      case HttpStatusCode.Unauthorized:
        // Expired token
        this.store.dispatch(new SetPlayerState(PlayerState.Refreshing));
        return this.refreshAuthToken();
      case HttpStatusCode.Forbidden:
        // Bad OAuth request
        this.logout();
        return Promise.resolve(SpotifyAPIResponse.Error);
      case HttpStatusCode.TooManyRequests:
        console.error('Spotify rate limits exceeded');
        this.logout();
        return Promise.resolve(SpotifyAPIResponse.Error);
      default:
        console.error(`Unexpected response ${res.status}: ${res.statusText}`);
        return Promise.resolve(SpotifyAPIResponse.Error);
    }
  }

  /**
   * Checks if the auth token is present and if its expiry value is within the threshold. If so, it refreshes the token
   */
  checkAuthTokenWithinExpiryThreshold(): Promise<SpotifyAPIResponse> {
    const now = new Date();
    if (this.authToken) {
      if (!this.authToken.expiry) {
        return Promise.reject('No expiry value present on token');
      }
      else if (this.authToken.expiry && this.authToken.expiry.getTime() - now.getTime() <= AppConfig.settings.auth.expiryThreshold) {
        return this.refreshAuthToken();
      }
    }
    // Token is not within expiry threshold
    return Promise.resolve(SpotifyAPIResponse.Success);
  }

  getAuthorizeRequestUrl(): Promise<string> {
    const args = new URLSearchParams({
      response_type: 'code',
      client_id: SpotifyAuthService.clientId,
      scope: SpotifyAuthService.scopes,
      redirect_uri: SpotifyAuthService.redirectUri,
      state: this.getState(),
      show_dialog: `${SpotifyAuthService.showAuthDialog}`
    });
    if (SpotifyAuthService.authType === AuthType.PKCE) {
      return generateCodeChallenge(this.getCodeVerifier()).then((codeChallenge) => {
        args.set('code_challenge_method', 'S256');
        args.set('code_challenge', codeChallenge);
        return `${SpotifyEndpoints.getAuthorizeEndpoint()}?${args}`;
      });
    } else {
      return Promise.resolve(`${SpotifyEndpoints.getAuthorizeEndpoint()}?${args}`);
    }
  }

  getAuthHeaders(): HttpHeaders {
    if (this.authToken) {
      return new HttpHeaders({
        Authorization: `${this.authToken.tokenType} ${this.authToken.accessToken}`
      });
    }
    console.error('No auth token present');
    return null;
  }

  compareState(state: string): boolean {
    return !!this.state && this.state === state;
  }

  logout(): void {
    this.store.dispatch(new SetAuthToken(null));
    this.state = null;
    this.codeVerifier = null;
    this.authToken = null;
    this.storage.remove(SpotifyAuthService.STATE_KEY);
    this.storage.removeAuthToken();
  }

  private refreshAuthToken(): Promise<SpotifyAPIResponse> {
    if (this.authToken && this.authToken.refreshToken) {
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
    return Promise.reject('Refresh token not present');
  }

  private getState(): string {
    if (!this.state) {
      this.setState();
    }
    return this.state;
  }

  private setState(): void {
    this.state = this.storage.get(SpotifyAuthService.STATE_KEY);
    if (this.state === null) {
      this.state = generateRandomString(SpotifyAuthService.STATE_LENGTH);
      this.storage.set(SpotifyAuthService.STATE_KEY, this.state);
    }
  }

  private getCodeVerifier(): string {
    if (!this.codeVerifier) {
      this.setCodeVerifier();
    }
    return this.codeVerifier;
  }

  private setCodeVerifier(): void {
    this.codeVerifier = this.storage.get(SpotifyAuthService.CODE_VERIFIER_KEY);
    if (!this.codeVerifier) {
      this.codeVerifier = generateCodeVerifier(43, 128);
      this.storage.set(SpotifyAuthService.CODE_VERIFIER_KEY, this.codeVerifier);
    }
  }
}
