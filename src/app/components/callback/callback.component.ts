import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {SpotifyService} from '../../services/spotify/spotify.service';
import {Select, Store} from '@ngxs/store';
import {SetAuthToken} from '../../core/auth/auth.actions';
import {AuthState} from '../../core/auth/auth.state';
import {Observable} from 'rxjs';
import {AuthToken} from '../../core/auth/auth.model';
import {StorageService} from '../../services/storage/storage.service';
import {OAUTH_CODE, OAUTH_ERROR, OAUTH_STATE} from '../../core/globals';

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
    private storage: StorageService,
    private route: ActivatedRoute,
    private router: Router,
    private spotify: SpotifyService,
    private store: Store) { }

  ngOnInit(): void {
    // redirect to /dashboard if already authenticated
    /*this.token$.subscribe(token => {
      if (token) {
        // this.router.navigateByUrl('/dashboard');
        console.log('window opener location: ' + window.opener.location);
        // window.opener.location.reload();
      }
    });*/

    // subscribe to anytime parameters change for a callback
    this.route.queryParamMap.subscribe(params => {
      const code = params.get(codeKey);
      const error = params.get(errorKey);
      const state = params.get(stateKey);

      console.log('Saving OAuth values to storage');
      this.storage.set(OAUTH_CODE, code);
      this.storage.set(OAUTH_STATE, state);
      this.storage.set(OAUTH_ERROR, error);

      window.close();  

      /*if (code && this.spotify.compareState(state)) {
        // use code to get auth tokens
        this.spotify.requestAuthToken(code, false)
          .then((res) => {
            this.store.dispatch(new SetAuthToken(res));
          })
          .catch((reason) => {
            console.error('Spotify request failed: ' + reason);
          });
      } else {
        console.error('Error with OAuth: ' + error);
        console.log('Redirect to /login here...?');
        // this.router.navigateByUrl('/login');
      }*/
    });
  }
}
