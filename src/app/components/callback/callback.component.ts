import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {SpotifyService} from '../../services/spotify/spotify.service';

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
    private spotify: SpotifyService) { }

  ngOnInit(): void {
    // subscribe to anytime parameters change for a callback
    this.route.queryParamMap.subscribe(params => {
      const code = params.get(codeKey);
      const error = params.get(errorKey);
      const state = params.get(stateKey);

      if (code && this.spotify.compareState(state)) {
        // use code to get auth tokens
        this.spotify.requestAuthToken(code).then(success => {
          if (success) {
            this.router.navigateByUrl('/dashboard').then(
              (success2) => {
                if (!success2) {
                  console.log('Navigation to /dashboard failed');
                }
              },
              (reason) => {
                console.log('Navigation to /dashboard failed: ' + reason);
              }
            );
          } else {
            console.log('Failed to request auth tokens');
          }
        });
      } else {
        console.log('Error with OAuth: ' + error);
        this.router.navigateByUrl('/login').then(
          (success) => {
            if (!success) {
              console.log('Navigation to /login failed');
            }
          },
          (reason) => {
            console.log('Navigation to /login failed: ' + reason);
          }
        );
      }
    });
  }

}
