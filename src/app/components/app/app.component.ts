import { Component, OnDestroy, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PlayerControlsOptions } from '../../core/settings/settings.model';
import { SettingsState } from '../../core/settings/settings.state';
import { InactivityService } from '../../services/inactivity/inactivity.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Select(SettingsState.theme) theme$: Observable<string>;
  @Select(SettingsState.showPlayerControls) showPlayerControls$: Observable<PlayerControlsOptions>;

  fadePlayerControls = false;
  fadeCursor = false;

  constructor(private inactivity: InactivityService) {}

  ngOnInit(): void {
    this.inactivity.inactive$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((isInactive) => {
        if (this.fadePlayerControls) {
          this.fadeCursor = isInactive;
        }
      });

    this.showPlayerControls$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((option) => {
        const isFading = option === PlayerControlsOptions.Fade || option === PlayerControlsOptions.Off;
        // Make sure we display cursor if previously off
        if (this.fadePlayerControls && !isFading) {
          this.fadeCursor = false;
        }
        this.fadePlayerControls = isFading;
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
