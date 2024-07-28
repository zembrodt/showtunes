import { Directive, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import { Subject } from 'rxjs';
import { takeUntil, throttleTime } from 'rxjs/operators';
import { AppConfig } from '../../app.config';

export const DELAY_DEFAULT = 1000; // ms

@Directive({
  selector: '[appInteractionThrottle]'
})
export class InteractionThrottleDirective implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Input()
  delay = DELAY_DEFAULT;

  @Output()
  throttledClick = new EventEmitter();

  @Output()
  throttledChange = new EventEmitter();

  private throttledClicks = new Subject();
  private throttledChanges = new Subject();

  constructor() {
    if (AppConfig.isEnvInitialized() && AppConfig.settings.env.throttleDelay) {
      this.delay = AppConfig.settings.env.throttleDelay;
    }
  }

  ngOnInit(): void {
    this.throttledClicks.pipe(
      takeUntil(this.ngUnsubscribe),
      throttleTime(this.delay)
    ).subscribe(e => this.emitClick(e));

    this.throttledChanges.pipe(
      takeUntil(this.ngUnsubscribe),
      throttleTime(this.delay)
    ).subscribe(e => this.emitChange(e));
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private emitClick(e: any): void {
    this.throttledClick.emit(e);
  }

  private emitChange(e: any): void {
    this.throttledChange.emit(e);
  }

  @HostListener('click', ['$event'])
  clickEvent(event): void {
    event.preventDefault();
    event.stopPropagation();
    this.throttledClicks.next(event);
  }

  @HostListener('change', ['$event'])
  changeEvent(event: MatSliderChange): void {
    this.throttledChanges.next(event);
  }
}
