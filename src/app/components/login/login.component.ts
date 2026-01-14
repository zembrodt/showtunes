import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { combineLatest, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Dashboard, Dashboards } from '../../core/dashboard/dashboard.model';
import { DiscogsAccessToken } from '../../core/discogs/auth/discogs-auth.model';
import { DiscogsAuthState } from '../../core/discogs/auth/discogs-auth.state';
import { SpotifyAuthToken } from '../../core/spotify/auth/spotify-auth.model';
import { SpotifyAuthState } from '../../core/spotify/auth/spotify-auth.state';
import { DiscogsAuthService } from '../../services/discogs/auth/discogs-auth.service';
import { SpotifyAuthService } from '../../services/spotify/auth/spotify-auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Select(SpotifyAuthState.token) spotifyToken$: Observable<SpotifyAuthToken>;

  @Select(DiscogsAuthState.requestToken) discogsRequestToken$: Observable<string>;
  @Select(DiscogsAuthState.accessToken) discogsAccessToken$: Observable<DiscogsAccessToken>;

  constructor(
    private spotifyAuth: SpotifyAuthService,
    private discogsAuth: DiscogsAuthService,
    private route: ActivatedRoute,
    private router: Router) {}

  ngOnInit(): void {
    const type = this.route.snapshot.paramMap.get('type');
    const validDashboardTypes = Dashboards.map(d => d.name.toLowerCase());
    if (type == null || !validDashboardTypes.includes(type.toLowerCase())) {
      console.error(`Invalid login type requested: '${type}'. Valid types are [${validDashboardTypes.join(', ')}]`);
      this.router.navigate(['/landing']);
      return;
    }
    const dashboardType = Dashboards.find(d => d.name.toLowerCase() === type.toLowerCase());

    if (dashboardType === Dashboard.Spotify) {
      this.spotifyToken$
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe(token => {
        // Redirect to Spotify OAuth if no token exists
        if (!token) {
          this.spotifyAuth.getAuthorizeRequestUrl()
            .then((authorizeRequestUrl) => {
              this.navigateToUrl(authorizeRequestUrl);
            });
        } else {
          this.router.navigateByUrl('/dashboard/spotify');
        }
      });
    } else if (dashboardType === Dashboard.Discogs) {
      combineLatest([this.discogsRequestToken$, this.discogsAccessToken$])
        .pipe(takeUntil(this.ngUnsubscribe),
          map(([requestToken$, accessToken$]) => ({
          requestToken: requestToken$,
          accessToken: accessToken$
        })))
        .subscribe((tokens) => {
          if (tokens.accessToken) {
            this.router.navigateByUrl('/dashboard/discogs');
            return;
          } else if (tokens.requestToken) {
            const requestUrl = this.discogsAuth.getAuthorizeRequestUrl();
            this.navigateToUrl(requestUrl);
            return;
          } else {
            this.discogsAuth.fetchRequestToken()
              .then((_) => {
                const requestUrl = this.discogsAuth.getAuthorizeRequestUrl();
                this.navigateToUrl(requestUrl);
              });
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
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
