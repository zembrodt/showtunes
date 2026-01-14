import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { BehaviorSubject } from 'rxjs';
import { AppConfig } from '../../../app.config';
import { SetAccessToken, SetRequestToken } from '../../../core/discogs/auth/discogs-auth.actions';
import { DiscogsAccessToken } from '../../../core/discogs/auth/discogs-auth.model';
import { DiscogsAuthState } from '../../../core/discogs/auth/discogs-auth.state';
import { DiscogsEndpoints } from '../../../core/discogs/discogs-endpoints';
import { generateCodeVerifier } from '../../../core/util';

@Injectable({providedIn: 'root'})
export class DiscogsAuthService {
  public static initialized = false;
  private static clientId: string;
  private static clientSecret: string;
  private static redirectUri: string;

  @Select(DiscogsAuthState.requestToken) private requestToken$: BehaviorSubject<string>;
  private requestToken: string;

  @Select(DiscogsAuthState.accessToken) private accessToken$: BehaviorSubject<DiscogsAccessToken>;
  private accessToken: DiscogsAccessToken;

  static initialize(): boolean {
    this.initialized = true;
    try {
      if (!AppConfig.settings.auth.discogs || !AppConfig.settings.auth.discogs.clientId) {
        console.error('No Discogs API Client ID provided');
        this.initialized = false;
        return this.initialized;
      }
      if (!AppConfig.settings.auth.discogs.clientSecret) {
        console.error('No Discogs API Client Secret provided');
        this.initialized = false;
        return this.initialized;
      }
      this.clientId = AppConfig.settings.auth.discogs.clientId;
      this.clientSecret = AppConfig.settings.auth.discogs.clientSecret;

      if (AppConfig.settings.env.domain) {
        this.redirectUri = encodeURI(AppConfig.settings.env.domain + '/callback/discogs');
      } else {
        console.error('No domain set for OAuth callback URL');
        this.initialized = false;
      }
    } catch (error) {
      console.error(`Failed to initialize Discogs service: ${error}`);
      this.initialized = false;
    }
    return this.initialized;
  }

  constructor(
    private http: HttpClient,
    private store: Store
  ) {}

  initSubscriptions(): void {
    this.requestToken$.subscribe((requestToken) => this.requestToken = requestToken);
    this.accessToken$.subscribe((accessToken) => this.accessToken = accessToken);
  }

  fetchRequestToken(): Promise<string> {
    const headers = new HttpHeaders().set(
      'Content-Type', 'application/x-www-form-urlencoded'
    ).set(
      'Authorization', `OAuth oauth_consumer_key="${DiscogsAuthService.clientId}",` +
      `oauth_nonce="${generateCodeVerifier(43, 128)}",` +
      `oauth_signature="${DiscogsAuthService.clientSecret}&",` +
      'oauth_signature_method="PLAINTEXT",' +
      `oauth_timestamp="${Date.now()}",` +
      `oauth_callback="${DiscogsAuthService.redirectUri}"`
    ); // Set User-Agent?

    return new Promise<string>((resolve, reject) => {
      return this.http.get<string>(DiscogsEndpoints.getRequestTokenEndpoint(), {headers, observe: 'response'})
        .subscribe((response) => {
          const requestToken = response.body;
          if (requestToken) {
            this.store.dispatch(new SetRequestToken(requestToken))
              .subscribe(() => resolve(requestToken));
          } else {
            const errMsg = 'Discogs API did not return a valid request_token';
            console.error(errMsg);
            reject(errMsg);
          }
        },
        (error) => {
          const errMsg = `Error fetching Discogs request_token: ${JSON.stringify(error)}`;
          console.error(errMsg);
          reject(errMsg);
        });
    });
  }

  getAuthorizeRequestUrl(): string {
    const args = new URLSearchParams({
      oauth_token: this.requestToken
    });
    return `${DiscogsEndpoints.getDiscogsOAuthUrl()}/authorize?${args}`;
  }

  fetchAccessToken(verifier: string): Promise<void> {
    const headers = new HttpHeaders().set(
      'Content-Type', 'application/x-www-form-urlencoded'
    ).set(
      'Authorization', `OAuth oauth_consumer_key="${DiscogsAuthService.clientId}",` +
      `oauth_nonce="${generateCodeVerifier(43, 128)}",` +
      `oauth_token="${this.requestToken}",` +
      `oauth_signature="${DiscogsAuthService.clientSecret}&",` +
      'oauth_signature_method="PLAINTEXT",' +
      `oauth_timestamp="${Date.now()}",` +
      `oauth_verifier="${verifier}"`
    ); // Set User-Agent?

    return new Promise<void>((resolve, reject) => {
      return this.http.post<DiscogsAccessToken>(DiscogsEndpoints.getAccessTokenEndpoint(), null, {headers, observe: 'response'})
        .subscribe((response) => {
          const accessToken = response.body;
          this.store.dispatch(new SetAccessToken(accessToken))
            .subscribe(() => resolve());
        },
          (error) => {
            const errMsg = `Error fetching Discogs access_token: ${JSON.stringify(error)}`;
            console.error(errMsg);
            reject(errMsg);
          });
    });
  }
}
