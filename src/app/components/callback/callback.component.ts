import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {SpotifyService} from '../../services/spotify/spotify.service';
import {Store} from '@ngxs/store';
import {SetAuthToken} from '../../core/auth/auth.actions';

const codeKey = 'code';
const errorKey = 'error';
const stateKey = 'state';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.css']
})
export class CallbackComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private spotify: SpotifyService,
    private store: Store) { }

  ngOnInit(): void {
    // subscribe to anytime parameters change for a callback
    this.route.queryParamMap.subscribe(params => {
      const code = params.get(codeKey);
      const error = params.get(errorKey);
      const state = params.get(stateKey);

      if (code && this.spotify.compareState(state)) {
        // use code to get auth tokens
        this.spotify.requestAuthToken(code)
          .then((res) => {
            this.store.dispatch(new SetAuthToken(res));
            console.log('Redirect to /dashboard');
            this.router.navigateByUrl('/dashboard');
          })
          .catch((reason) => {
            console.error('Spotify request failed: ' + reason);
          });
      } else {
        console.error('Error with OAuth: ' + error);
        console.log('Redirect to /login here...?');
        // this.router.navigateByUrl('/login');
      }
    });
  }
}
