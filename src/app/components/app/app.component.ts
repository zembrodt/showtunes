import { Component, OnDestroy, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PlayerControlsOptions } from '../../core/settings/settings.model';
import { SettingsState } from '../../core/settings/settings.state';
import { InactivityService } from '../../services/inactivity/inactivity.service';
import { PlaybackService } from '../../services/playback/playback.service';
import { SpotifyAuthService } from '../../services/spotify/auth/spotify-auth.service';
import { SpotifyControlsService } from '../../services/spotify/controls/spotify-controls.service';
import { SpotifyPollingService } from '../../services/spotify/polling/spotify-polling.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Select(SettingsState.theme) theme$: Observable<string>;
  @Select(SettingsState.customAccentColor) customAccentColor$: Observable<string>;
  @Select(SettingsState.showPlayerControls) showPlayerControls$: Observable<PlayerControlsOptions>;
  @Select(SettingsState.useDynamicThemeAccent) useDynamicThemeAccent$: Observable<boolean>;
  @Select(SettingsState.dynamicAccentColor) dynamicAccentColor$: Observable<string>;

  fadePlayerControls = false;
  fadeCursor = false;
  appInitialized = false;

  constructor(
    private auth: SpotifyAuthService,
    private controls: SpotifyControlsService,
    private polling: SpotifyPollingService,
    private playback: PlaybackService,
    private inactivity: InactivityService
  ) {}

  ngOnInit(): void {
    if (!SpotifyAuthService.initialized && !SpotifyAuthService.initialize()) {
      console.error('Failed to initialize the Spotify authentication service');
    } else {
      this.appInitialized = true;

      this.auth.initSubscriptions();
      this.controls.initSubscriptions();
      this.polling.initSubscriptions();
      this.playback.initialize();

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
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
