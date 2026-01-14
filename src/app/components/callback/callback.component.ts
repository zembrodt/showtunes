import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { DiscogsAccessToken } from '../../core/discogs/auth/discogs-auth.model';
import { DiscogsAuthState } from '../../core/discogs/auth/discogs-auth.state';
import { SpotifyAuthToken } from '../../core/spotify/auth/spotify-auth.model';
import { SpotifyAuthState } from '../../core/spotify/auth/spotify-auth.state';
import { Dashboard, Dashboards, DashboardType } from '../../core/dashboard/dashboard.model';
import { DiscogsAuthService } from '../../services/discogs/auth/discogs-auth.service';
import { SpotifyAuthService } from '../../services/spotify/auth/spotify-auth.service';

const codeKey = 'code';
const errorKey = 'error';
const stateKey = 'state';
const verifierKey = 'verifier';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.css']
})
export class CallbackComponent implements OnInit {

  @Select(SpotifyAuthState.token) spotifyToken$: Observable<SpotifyAuthToken>;
  @Select(DiscogsAuthState.accessToken) discogsToken$: Observable<DiscogsAccessToken>;

  private dashboardType: DashboardType;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private spotifyAuth: SpotifyAuthService,
    private discogsAuth: DiscogsAuthService
  ) { }

  ngOnInit(): void {
    const type = this.route.snapshot.paramMap.get('type');
    const validDashboardTypes = Dashboards.map(d => d.name.toLowerCase());
    if (type == null || !validDashboardTypes.includes(type.toLowerCase())) {
      console.error(`Invalid callback type requested: '${type}'. Valid types are [${validDashboardTypes.join(', ')}]`);
      this.router.navigate(['/landing']);
      return;
    }
    this.dashboardType = Dashboards.find(d => d.name.toLowerCase() === type.toLowerCase());

    if (this.dashboardType === Dashboard.Spotify) {
      this.handleSpotifyCallback();
    } else if (this.dashboardType === Dashboard.Discogs) {
      this.handleDiscogsCallback();
    }
  }

  private handleSpotifyCallback(): void {
    // redirect to /dashboard/spotify if already authenticated
    this.spotifyToken$.subscribe(token => {
      if (token) {
        this.router.navigateByUrl('/dashboard/spotify');
      }
    });

    // subscribe to anytime parameters change for a callback
    this.route.queryParamMap.subscribe(params => {
      const code = params.get(codeKey);
      const error = params.get(errorKey);
      const state = params.get(stateKey);

      if (!error && code && this.spotifyAuth.compareState(state)) {
        // use code to get auth tokens
        this.spotifyAuth.requestAuthToken(code, false)
          .catch((reason) => {
            console.error(`Spotify request failed: ${reason}`);
            this.router.navigateByUrl('/error');
          });
      } else {
        console.error(`Error with Spotify OAuth: ${error ? `: ${error}` : ''}`);
        if (!error) {
          if (!code) {
            console.error('No code value given for callback');
          } else if (!this.spotifyAuth.compareState(state)) {
            console.error(`State value is not correct: ${state}`);
          }
        }
        this.router.navigateByUrl('/error');
      }
    });
  }

  private handleDiscogsCallback(): void {
    // redirect to /dashboard/discogs if already authenticated
    this.discogsToken$.subscribe(accessToken => {
      if (accessToken) {
        this.router.navigateByUrl('/dashboard/discogs');
      }
    });

    // subscribe to anytime parameters change for a callback
    this.route.queryParamMap.subscribe(params => {
      const verifier = params.get(verifierKey);
      const error = params.get(errorKey);

      if (!error && verifier) {
        // use code to get auth tokens
        this.discogsAuth.fetchAccessToken(verifier)
          .catch((reason) => {
            console.error(`Discogs request failed: ${reason}`);
            this.router.navigateByUrl('/error');
          });
      } else {
        console.error(`Error with Discogs OAuth: ${error ? `: ${error}` : ''}`);
        if (!error && !verifier) {
          console.error('No verifier value given for callback');
        }
        this.router.navigateByUrl('/error');
      }
    });
  }
}
