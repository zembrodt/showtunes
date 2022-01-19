import { Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  ChangeDeviceVolume,
  ChangeRepeatState,
  SkipNextTrack,
  SkipPreviousTrack,
  ToggleLiked,
  TogglePlaying,
  ToggleShuffle
} from '../../../core/playback/playback.actions';
import { PREVIOUS_VOLUME } from '../../../core/playback/playback.state';
import { PlayerControlsOptions } from '../../../core/settings/settings.model';
import { SettingsState } from '../../../core/settings/settings.state';
import { InactivityService } from '../../../services/inactivity/inactivity.service';
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

  constructor(private store: Store,
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
    this.store.dispatch(new TogglePlaying());
  }

  onSkipPrevious(): void {
    this.store.dispatch(new SkipPreviousTrack());
  }

  onSkipNext(): void {
    this.store.dispatch(new SkipNextTrack());
  }

  onVolumeChange(change: MatSliderChange): void {
    this.store.dispatch(new ChangeDeviceVolume(change.value));
  }

  onVolumeMute(): void {
    if (this.volume > 0) {
      this.storage.set(PREVIOUS_VOLUME, this.volume.toString());
      this.store.dispatch(new ChangeDeviceVolume(0));
    } else {
      const previousVolume = parseInt(this.storage.get(PREVIOUS_VOLUME), 10);
      if (previousVolume && !isNaN(previousVolume) && previousVolume > 0) {
        this.store.dispatch(new ChangeDeviceVolume(previousVolume));
      } else {
        // Emit a default volume
        this.store.dispatch(new ChangeDeviceVolume(DEFAULT_VOLUME));
      }
    }
  }

  onToggleShuffle(): void {
    this.store.dispatch(new ToggleShuffle());
  }

  onRepeatChange(): void {
    switch (this.repeatState) {
      case REPEAT_OFF:
        this.store.dispatch(new ChangeRepeatState(REPEAT_CONTEXT));
        break;
      case REPEAT_CONTEXT:
        this.store.dispatch(new ChangeRepeatState(REPEAT_TRACK));
        break;
      default:
        this.store.dispatch(new ChangeRepeatState(REPEAT_OFF));
    }
  }

  onLikeChange(): void {
    this.store.dispatch(new ToggleLiked());
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