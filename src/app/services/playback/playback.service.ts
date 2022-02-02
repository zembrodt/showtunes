import { Injectable, OnDestroy } from '@angular/core';
import { Select } from '@ngxs/store';
import { BehaviorSubject, interval, NEVER, Observable, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { AuthState } from '../../core/auth/auth.state';
import { PlaybackState } from '../../core/playback/playback.state';
import { SpotifyService } from '../spotify/spotify.service';

export const IDLE_POLLING = 3000; // ms
export const PLAYBACK_POLLING = 1000; // ms

@Injectable({providedIn: 'root'})
export class PlaybackService implements OnDestroy {
  private ngUnsubscribe = new Subject();

  private interval$ = new BehaviorSubject(PLAYBACK_POLLING);
  @Select(PlaybackState.isIdle) isIdle$: Observable<boolean>;
  private isIdle = true;
  @Select(AuthState.isAuthenticated) isAuthenticated$: Observable<boolean>;
  private isAuthenticated = false;

  constructor(private spotify: SpotifyService) { }

  initialize(): void {
    if (this.interval$) {
      this.interval$
        .pipe(
          switchMap(value => {
            return this.isAuthenticated ? interval(value) : NEVER;
          }),
          takeUntil(this.ngUnsubscribe))
        .subscribe((pollingInterval) => {
          this.spotify.pollCurrentPlayback(pollingInterval);
        });
    }

    if (this.isIdle$) {
      this.isIdle$
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe(isIdle => {
          this.isIdle = isIdle;
          this.interval$.next(isIdle ? IDLE_POLLING : PLAYBACK_POLLING);
        });
    }

    if (this.isAuthenticated$) {
      this.isAuthenticated$
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe(isAuthenticated => {
          this.isAuthenticated = isAuthenticated;
          // Send a new polling value to either start or stop playback
          this.interval$.next(this.isIdle ? IDLE_POLLING : PLAYBACK_POLLING);
        });
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
