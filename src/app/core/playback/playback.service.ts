import {Injectable, OnDestroy} from '@angular/core';
import {Select, Store} from '@ngxs/store';
import {BehaviorSubject, interval, NEVER, Observable, Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';
import {PlaybackState} from './playback.state';
import {PollCurrentPlayback} from './playback.actions';
import {AuthState} from '../auth/auth.state';

const IDLE_POLLING = 3000; // ms
const PLAYBACK_POLLING = 1000; // ms

@Injectable({providedIn: 'root'})
export class PlaybackService implements OnDestroy {
  private ngUnsubscribe = new Subject();

  private intervalSubject = new BehaviorSubject(PLAYBACK_POLLING);
  @Select(PlaybackState.isIdle) isIdle$: Observable<boolean>;

  @Select(AuthState.isAuthenticated) isAuthenticated$: Observable<boolean>;
  private isAuthenticated = false;

  constructor(private store: Store) { }

  initialize(): void {
   this.intervalSubject
     .pipe(
       switchMap(value => {
         if (this.isAuthenticated) {
           console.log('Authenticated, starting playback');
           return interval(value);
         } else {
           console.log('Not authenticated, pausing playback');
           return NEVER;
         }
       }),
       takeUntil(this.ngUnsubscribe))
     .subscribe((pollingInterval) => {
       this.store.dispatch(new PollCurrentPlayback(pollingInterval));
     });

   this.isIdle$
     .pipe(takeUntil(this.ngUnsubscribe))
     .subscribe(isIdle => {
       if (isIdle) {
         console.log('Switching to idle polling');
         this.intervalSubject.next(IDLE_POLLING);
       } else {
         console.log('Switching to playback polling');
         this.intervalSubject.next(PLAYBACK_POLLING);
       }
     });

   this.isAuthenticated$
     .pipe(takeUntil(this.ngUnsubscribe))
     .subscribe(isAuthenticated => {
       this.isAuthenticated = isAuthenticated;
       // Send a new polling value to either start or stop playback
       this.intervalSubject.next(IDLE_POLLING);
     });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
