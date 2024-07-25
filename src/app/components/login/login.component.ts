import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { AuthToken } from '../../core/auth/auth.model';
import { AuthState } from '../../core/auth/auth.state';
import { SpotifyAuthService } from '../../services/spotify/auth/spotify-auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  @Select(AuthState.token) token$: Observable<AuthToken>;

  constructor(private auth: SpotifyAuthService, private router: Router) { }

  ngOnInit(): void {
    this.token$.subscribe(token => {
      // Redirect to Spotify OAuth if no token exists
      if (!token) {
        this.auth.getAuthorizeRequestUrl()
          .then((authorizeRequestUrl) => {
            this.navigateToUrl(authorizeRequestUrl);
          });
      } else {
        this.router.navigateByUrl('/dashboard');
      }
    });
  }

  private navigateToUrl(url: string): void {
    window.location.href = url;
  }

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
