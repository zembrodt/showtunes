import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InactivityService {
  static readonly INACTIVITY_TIME = 3500; // ms
  private static readonly INACTIVITY_RESET_EVENTS = [
    'keydown',
    'mousemove',
    'mousedown',
    'wheel',
    'touchstart'
  ];

  private inactivityTimer: NodeJS.Timeout;
  private isInactive = false;

  inactive$: BehaviorSubject<boolean> = new BehaviorSubject(this.isInactive);

  constructor() {
    this.setInactivityTimer();
    InactivityService.INACTIVITY_RESET_EVENTS.forEach((eventName) => {
      fromEvent(document, eventName).subscribe(() => this.resetInactivity());
    });
  }

  private setInactivity(isInactive: boolean): void {
    if (this.isInactive !== isInactive) {
      this.isInactive = isInactive;
      this.inactive$.next(isInactive);
    }
  }

  private resetInactivity(): void {
    this.setInactivity(false);
    clearTimeout(this.inactivityTimer);
    this.setInactivityTimer();
  }

  private setInactivityTimer(): void {
    this.inactivityTimer = setTimeout(() => {
      this.setInactivity(true);
    }, InactivityService.INACTIVITY_TIME);
  }
}
