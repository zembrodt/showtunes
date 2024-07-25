import { Injectable, OnDestroy } from '@angular/core';
import { Select } from '@ngxs/store';
import { BehaviorSubject, interval, NEVER, Observable, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { AppConfig } from '../../app.config';
import { AuthState } from '../../core/auth/auth.state';
import { PlayerState } from '../../core/playback/playback.model';
import { PlaybackState } from '../../core/playback/playback.state';
import { SpotifyPollingService } from '../spotify/polling/spotify-polling.service';

@Injectable({providedIn: 'root'})
export class PlaybackService implements OnDestroy {
  private ngUnsubscribe = new Subject();

  private interval$ = new BehaviorSubject(AppConfig.settings.env.playbackPolling);
  @Select(PlaybackState.playerState) playerState$: Observable<PlayerState>;
  private playerState = PlayerState.Idling;
  @Select(AuthState.isAuthenticated) isAuthenticated$: Observable<boolean>;
  private isAuthenticated = false;

  constructor(private polling: SpotifyPollingService) { }

  initialize(): void {
    if (this.interval$) {
      this.interval$
        .pipe(
          switchMap(value => {
            // Don't poll playback if not authenticated or currently refreshing the auth token
            if (this.isAuthenticated && this.playerState !== PlayerState.Refreshing) {
              return interval(value);
            }
            return NEVER;
          }),
          takeUntil(this.ngUnsubscribe))
        .subscribe((_) => {
          this.polling.pollCurrentPlayback();
        });
    }

    if (this.playerState$) {
      this.playerState$
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe(playerState => {
          this.playerState = playerState;
          this.interval$.next(this.calculatePollingRate(playerState));
        });
    }

    if (this.isAuthenticated$) {
      this.isAuthenticated$
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe(isAuthenticated => {
          this.isAuthenticated = isAuthenticated;
          // Send a new polling value to either start or stop playback
          this.interval$.next(this.calculatePollingRate(this.playerState));
        });
    }
  }

  private calculatePollingRate(playerState: PlayerState): number {
    return playerState === PlayerState.Playing ?
      AppConfig.settings.env.playbackPolling : AppConfig.settings.env.idlePolling;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
