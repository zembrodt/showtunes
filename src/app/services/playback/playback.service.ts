import {Injectable, OnDestroy} from '@angular/core';
import {Select, Store} from '@ngxs/store';
import {BehaviorSubject, interval, NEVER, Observable, Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';
import {PlaybackState} from '../../core/playback/playback.state';
import {PollCurrentPlayback} from '../../core/playback/playback.actions';
import {AuthState} from '../../core/auth/auth.state';

const IDLE_POLLING = 3000; // ms
const PLAYBACK_POLLING = 1000; // ms

@Injectable({providedIn: 'root'})
export class PlaybackService implements OnDestroy {
  private ngUnsubscribe = new Subject();

  private interval$ = new BehaviorSubject(PLAYBACK_POLLING);
  @Select(PlaybackState.isIdle) isIdle$: Observable<boolean>;
  private isIdle = true;
  @Select(AuthState.isAuthenticated) isAuthenticated$: Observable<boolean>;
  private isAuthenticated = false;

  constructor(private store: Store) { }

  initialize(): void {
    this.interval$
     .pipe(
       switchMap(value => {
         return this.isAuthenticated ? interval(value) : NEVER;
       }),
       takeUntil(this.ngUnsubscribe))
     .subscribe((pollingInterval) => {
       this.store.dispatch(new PollCurrentPlayback(pollingInterval)).subscribe();
     });

    this.isIdle$
     .pipe(takeUntil(this.ngUnsubscribe))
     .subscribe(isIdle => {
       this.isIdle = isIdle;
       this.interval$.next(isIdle ? IDLE_POLLING : PLAYBACK_POLLING);
     });

    this.isAuthenticated$
     .pipe(takeUntil(this.ngUnsubscribe))
     .subscribe(isAuthenticated => {
       this.isAuthenticated = isAuthenticated;
       // Send a new polling value to either start or stop playback
       this.interval$.next(this.isIdle ? IDLE_POLLING : PLAYBACK_POLLING);
     });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
