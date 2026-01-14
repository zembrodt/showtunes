import { Injectable, OnDestroy } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Dashboard, Dashboards } from '../dashboard/dashboard.model';
import { DiscogsAccessToken } from '../discogs/auth/discogs-auth.model';
import { DiscogsAuthState } from '../discogs/auth/discogs-auth.state';
import { SpotifyAuthToken } from '../spotify/auth/spotify-auth.model';
import { SpotifyAuthState } from '../spotify/auth/spotify-auth.state';

@Injectable()
export class AuthGuard implements CanActivate, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Select(SpotifyAuthState.token) spotifyToken$: Observable<SpotifyAuthToken>;
  private spotifyAccessToken: string = null;

  @Select(DiscogsAuthState.accessToken) discogsAccessToken$: Observable<DiscogsAccessToken>;
  private discogsAccessToken: DiscogsAccessToken = null;

  constructor(private router: Router) {
    this.initSubscriptions();
  }

  initSubscriptions(): void {
    this.spotifyToken$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((token) => {
        this.spotifyAccessToken = token ? token.accessToken : null;
      });

    this.discogsAccessToken$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((accessToken) => {
        this.discogsAccessToken = accessToken;
      });
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const type = route.paramMap.get('type');
    if (type == null || type.trim().length === 0) {
      return false;
    }

    const dashboardType = Dashboards.find(d => d.name.toLowerCase() === type.toLowerCase());
    if (dashboardType === Dashboard.Spotify) {
      if (this.spotifyAccessToken) {
        return true;
      } else {
        console.log('Spotify access token does not exist, redirecting to /login/spotify');
        this.router.navigateByUrl('/login/spotify');
        return false;
      }
    } else if (dashboardType === Dashboard.Discogs) {
      if (this.discogsAccessToken) {
        return true;
      } else {
        console.log('Discogs access token does not exist, redirecting to /login/discogs');
        this.router.navigateByUrl('/login/discogs');
        return false;
      }
    } else {
      console.log(`Invalid auth type '${type}'`);
      this.router.navigateByUrl('/landing');
      return false;
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
