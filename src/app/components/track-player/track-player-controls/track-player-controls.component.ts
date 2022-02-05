import { Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import { Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PlayerControlsOptions } from '../../../core/settings/settings.model';
import { SettingsState } from '../../../core/settings/settings.state';
import { InactivityService } from '../../../services/inactivity/inactivity.service';
import { PREVIOUS_VOLUME, SpotifyService } from '../../../services/spotify/spotify.service';
import { StorageService } from '../../../services/storage/storage.service';

// Default values
const DEFAULT_VOLUME = 50;
const FADE_DURATION = 500; // ms

// Icons
const PLAY_ICON = 'play_arrow';
const PAUSE_ICON = 'pause';

const REPEAT_ICON = 'repeat';
const REPEAT_ONE_ICON = 'repeat_one';

const VOLUME_HIGH_ICON = 'volume_up';
const VOLUME_LOW_ICON = 'volume_down';
const VOLUME_MUTE_ICON = 'volume_off';

const ICON_CLASS_PRIMARY = 'track-player-icon';
const ICON_CLASS_ACCENT = 'track-player-icon-accent';

// Keys
const REPEAT_OFF = 'off';
const REPEAT_CONTEXT = 'context';
const REPEAT_TRACK = 'track';

@Component({
  selector: 'app-track-player-controls',
  templateUrl: './track-player-controls.component.html',
  styleUrls: ['./track-player-controls.component.css']
})
export class TrackPlayerControlsComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Input() isShuffle = false;
  @Input() isPlaying = false;
  @Input() repeatState: string;
  @Input() volume = DEFAULT_VOLUME;
  @Input() isLiked = false;

  @Select(SettingsState.showPlayerControls) showPlayerControls$: Observable<PlayerControlsOptions>;

  fadePlayerControls: boolean;

  constructor(private spotify: SpotifyService,
              private storage: StorageService,
              private inactivity: InactivityService,
              private element: ElementRef) {}

  ngOnInit(): void {
    this.showPlayerControls$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((option) => {
        const isFading = option === PlayerControlsOptions.Fade;
        // Make sure we display player controls if previously off
        if (this.fadePlayerControls && !isFading) {
          this.fadeControls(false);
        }
        this.fadePlayerControls = isFading;
      });

    this.inactivity.inactive$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((isInactive) => {
        if (this.fadePlayerControls) {
          this.fadeControls(isInactive);
        }
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  onPause(): void {
    this.spotify.togglePlaying();
  }

  onSkipPrevious(): void {
    this.spotify.skipPrevious(false);
  }

  onSkipNext(): void {
    this.spotify.skipNext();
  }

  onVolumeChange(change: MatSliderChange): void {
    this.spotify.setVolume(change.value);
  }

  onVolumeMute(): void {
    let volumeChange = DEFAULT_VOLUME;
    if (this.volume > 0) {
      this.storage.set(PREVIOUS_VOLUME, this.volume.toString());
      volumeChange = 0;
    } else {
      const previousVolume = parseInt(this.storage.get(PREVIOUS_VOLUME), 10);
      if (previousVolume && !isNaN(previousVolume) && previousVolume > 0) {
        volumeChange = previousVolume;
      }
    }
    this.spotify.setVolume(volumeChange);
  }

  onToggleShuffle(): void {
    this.spotify.toggleShuffle();
  }

  onRepeatChange(): void {
    let repeatState = REPEAT_OFF;
    switch (this.repeatState) {
      case REPEAT_OFF:
        repeatState = REPEAT_CONTEXT;
        break;
      case REPEAT_CONTEXT:
        repeatState = REPEAT_TRACK;
        break;
    }
    this.spotify.setRepeatState(repeatState);
  }

  onLikeChange(): void {
    this.spotify.toggleLiked();
  }

  getPlayIcon(isPlaying: boolean): string {
    return isPlaying ? PAUSE_ICON : PLAY_ICON;
  }

  getRepeatIcon(repeatState: string): string {
    let icon = REPEAT_ICON;
    if (repeatState === REPEAT_TRACK) {
      icon = REPEAT_ONE_ICON;
    }
    return icon;
  }

  getRepeatClass(repeatState: string): string {
    let repeatClass = ICON_CLASS_PRIMARY;
    if (repeatState !== REPEAT_OFF) {
      repeatClass = ICON_CLASS_ACCENT;
    }
    return repeatClass;
  }

  getVolumeIcon(volume: number): string {
    let icon = VOLUME_HIGH_ICON;
    if (volume === 0) {
      icon = VOLUME_MUTE_ICON;
    } else if (volume < 50) {
      icon = VOLUME_LOW_ICON;
    }
    return icon;
  }

  private fadeControls(isFaded: boolean): void {
    if (this.element.nativeElement) {
      this.element.nativeElement.animate(
        {
          opacity: isFaded ? 0 : 1
        }, {
          duration: FADE_DURATION,
          fill: 'forwards',
          easing: 'ease-out'
        });
    }
  }
}
