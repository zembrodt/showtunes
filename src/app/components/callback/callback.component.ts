import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { AuthToken } from '../../core/auth/auth.model';
import { AuthState } from '../../core/auth/auth.state';
import { SpotifyService } from '../../services/spotify/spotify.service';

const codeKey = 'code';
const errorKey = 'error';
const stateKey = 'state';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.css']
})
export class CallbackComponent implements OnInit {

  @Select(AuthState.token) token$: Observable<AuthToken>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private spotify: SpotifyService) { }

  ngOnInit(): void {
    // redirect to /dashboard if already authenticated
    this.token$.subscribe(token => {
      if (token) {
        this.router.navigateByUrl('/dashboard');
      }
    });

    // subscribe to anytime parameters change for a callback
    this.route.queryParamMap.subscribe(params => {
      const code = params.get(codeKey);
      const error = params.get(errorKey);
      const state = params.get(stateKey);

      if (!error && code && this.spotify.compareState(state)) {
        // use code to get auth tokens
        this.spotify.requestAuthToken(code, false)
          .catch((reason) => {
            console.error(`Spotify request failed: ${reason}`);
            this.router.navigateByUrl('/error');
          });
      } else {
        console.error(`Error with OAuth${error ? `: ${error}` : ''}`);
        if (!error) {
          if (!code) {
            console.error('No code value given for callback');
          }
          else if (!this.spotify.compareState(state)) {
            console.error(`State value is not correct: ${state}`);
          }
        }
        this.router.navigateByUrl('/error');
      }
    });
  }
}
