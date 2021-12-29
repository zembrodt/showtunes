import {Injectable} from '@angular/core';
import {fromEvent, Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InactivityService {
  static readonly INACTIVITY_TIME = 3500; // ms

  inactive$: Subject<boolean> = new Subject();

  private isInactive = false;
  private inactivityTimer;

  constructor() {
    this.setInactivityTimer();
    fromEvent(document, 'keydown').subscribe(() => this.resetInactivity());
    fromEvent(document, 'mousemove').subscribe(() => this.resetInactivity());
    fromEvent(document, 'touchstart').subscribe(() => this.resetInactivity());
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
