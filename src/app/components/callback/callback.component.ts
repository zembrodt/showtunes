import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { SpotifyAuthToken } from '../../core/auth/spotify-auth.model';
import { SpotifyAuthState } from '../../core/auth/spotify-auth.state';
import { Dashboard, Dashboards, DashboardType } from '../../models/dashboard.model';
import { SpotifyAuthService } from '../../services/spotify/auth/spotify-auth.service';

const codeKey = 'code';
const errorKey = 'error';
const stateKey = 'state';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.css']
})
export class CallbackComponent implements OnInit {

  @Select(SpotifyAuthState.token) spotifyToken$: Observable<SpotifyAuthToken>;

  private dashboardType: DashboardType;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: SpotifyAuthService) { }

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
    }
  }

  private handleSpotifyCallback(): void {
    // redirect to /dashboard if already authenticated
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

      if (!error && code && this.auth.compareState(state)) {
        // use code to get auth tokens
        this.auth.requestAuthToken(code, false)
          .catch((reason) => {
            console.error(`Spotify request failed: ${reason}`);
            this.router.navigateByUrl('/error');
          });
      } else {
        console.error(`Error with OAuth${error ? `: ${error}` : ''}`);
        if (!error) {
          if (!code) {
            console.error('No code value given for callback');
          } else if (!this.auth.compareState(state)) {
            console.error(`State value is not correct: ${state}`);
          }
        }
        this.router.navigateByUrl('/error');
      }
    });
  }
}
