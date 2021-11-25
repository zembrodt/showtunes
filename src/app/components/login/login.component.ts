import {Component, OnInit} from '@angular/core';
import {SpotifyService} from '../../services/spotify/spotify.service';
import {Observable} from 'rxjs';
import {AuthToken} from '../../core/auth/auth.model';
import {AuthState} from '../../core/auth/auth.state';
import {Select, Store} from '@ngxs/store';
import {Router} from '@angular/router';
import {StorageService} from '../../services/storage/storage.service';
import {OAUTH_CODE, OAUTH_ERROR, OAUTH_STATE} from '../../core/globals';
import {SetAuthToken} from '../../core/auth/auth.actions';

const OAUTH_POLL_INTERVAL = 200; // ms

const authWidth = 400;
const authHeight = 550;
const authLeft = screen.width / 2 - authWidth / 2;
const authTop = screen.height / 2 - authHeight / 2;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit
{
  private pollFunction = null;

  @Select(AuthState.token) token$: Observable<AuthToken>;

  constructor(private spotifyService: SpotifyService,
              private router: Router,
              private store: Store,
              private storage: StorageService) { }

  ngOnInit(): void {
    window.onstorage = (e) => {};

    this.token$.subscribe(token => {
      // Redirect to Spotify OAuth if no token exists
      if (!token) {
        console.log('PAUSE: redirecting to Spotify OAuth URL');
        // window.location.href = this.spotifyService.getAuthorizeRequestUrl();

        // Remove any OAuth values
        this.removeOAuthStorage();

        window.open(
          this.spotifyService.getAuthorizeRequestUrl(),
          'Spotify',
          'menubar=no,location=no,resizeable=no,scrollbars=no,status=no,width=' +
            authWidth + ',height=' + authHeight + ',top=' + authTop + ',left=' + authLeft
        );

        // Poll until OAuth code is in localStorage
        this.pollFunction = setInterval(() => {
          const code = this.storage.get(OAUTH_CODE);
          if (code !== null) {
            this.clearPoller();
            console.log('Oauth returned code: ' + code);
          }
        }, OAUTH_POLL_INTERVAL);

      } else {
        console.log('Auth token exists, redirect to /dashboard');
        this.router.navigateByUrl('/dashboard');
      }
    });
  }

  private retrieveToken(): void {
    const code = this.storage.get(OAUTH_CODE);
    const state = this.storage.get(OAUTH_STATE);
    const error = this.storage.get(OAUTH_ERROR);

    if (error) {
      console.error('Error with OAuth: ' + error);
    }

    if (code && this.spotifyService.compareState(state)) {
      // use code to get auth tokens
      this.spotifyService.requestAuthToken(code)
        .then((res) => {
          this.store.dispatch(new SetAuthToken(res));
          // this.spotify.toggleIsAuthenticating();
          // console.log('Redirect to /dashboard');
          // this.router.navigateByUrl('/dashboard');
        })
        .catch((reason) => {
          console.error('Spotify request failed: ' + reason);
        });
    } else {
      console.error('Invalid OAuth code or state');
      console.log('Redirect to /login here...?');
      // this.router.navigateByUrl('/login');
    }
  }

  private removeOAuthStorage(): void {
    this.storage.remove(OAUTH_CODE);
    this.storage.remove(OAUTH_STATE);
    this.storage.remove(OAUTH_ERROR);
  }

  private clearPoller(): void {
    if (this.pollFunction !== null) {
      clearInterval(this.pollFunction);
      this.pollFunction = null;
    }
  }

  // TODO: how do we also check if a token is expired?
  // WIP code for OAuth pop-up:
  /*
  this.isAuthenticating = true;
      const options = `width=500,height=600,left=0,top=0`;
      const authWindow = window.open(this.getAuthorizeRequestUrl(), 'Authorization', options);
      let timeoutCount = 0;
      let oAuthSuccess = false;
      this.oAuthTimerId = setInterval(() => {
        if (timeoutCount > expiryThreshold) {
          // OAuth failed, close window
          authWindow.close();
          clearInterval(this.oAuthTimerId);
        }
        if (!this.isAuthenticating) {
          // OAUth has finished authenticating, close the window
          authWindow.close();
          oAuthSuccess = true;
          clearInterval(this.oAuthTimerId);
        }
        timeoutCount++;
      }, 1000);
      this.isAuthenticating = false;
      if (oAuthSuccess) {
        console.log('Authentication success! Redirect to /dashboard');
      } else {
        console.log('Authentication FAILURE!');
      }
   */
}
