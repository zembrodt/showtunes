import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import { Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PlayerControlsOptions } from '../../../core/settings/settings.model';
import { SettingsState } from '../../../core/settings/settings.state';
import { InactivityService } from '../../../services/inactivity/inactivity.service';
import { SpotifyControlsService } from '../../../services/spotify/controls/spotify-controls.service';
import { PREVIOUS_VOLUME, StorageService } from '../../../services/storage/storage.service';

// Default values
const DEFAULT_VOLUME = 50;
const FADE_DURATION = 500; // ms

// Icons
const SHUFFLE_ICON = 'shuffle';
const SMART_SHUFFLE_ICON = 'model_training';

const PLAY_ICON = 'play_arrow';
const PAUSE_ICON = 'pause';

const REPEAT_ICON = 'repeat';
const REPEAT_ONE_ICON = 'repeat_one';

const VOLUME_HIGH_ICON = 'volume_up';
const VOLUME_LOW_ICON = 'volume_down';
const VOLUME_MUTE_ICON = 'volume_off';

const ICON_CLASS_PRIMARY = 'track-player-icon';
const ICON_CLASS_ACCENT = 'track-player-icon-accent';

const DEFAULT_POINTER = 'default-cursor';

// Keys
const REPEAT_OFF = 'off';
const REPEAT_CONTEXT = 'context';
const REPEAT_TRACK = 'track';

@Component({
  selector: 'app-track-player-controls',
  templateUrl: './track-player-controls.component.html',
  styleUrls: ['./track-player-controls.component.css']
})
export class TrackPlayerControlsComponent implements OnInit, OnChanges, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Input() isShuffle = false;
  @Input() isSmartShuffle = false;
  @Input() isPlaying = false;
  @Input() repeatState: string;
  @Input() volume = DEFAULT_VOLUME;
  @Input() isLiked = false;

  shuffleClasses = this.getShuffleClasses();
  shuffleIcon = this.getShuffleIcon();
  playIcon = this.getPlayIcon();
  repeatIcon = this.getRepeatIcon();
  repeatClass = this.getRepeatClass();
  volumeIcon = this.getVolumeIcon();
  likedClass = this.getLikedClass();

  @Select(SettingsState.showPlayerControls) showPlayerControls$: Observable<PlayerControlsOptions>;

  fadePlayerControls: boolean;

  constructor(
    private controls: SpotifyControlsService,
    private storage: StorageService,
    private inactivity: InactivityService,
    private element: ElementRef
  ) {}

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.isShuffle) {
      this.shuffleClasses = this.getShuffleClasses();
    }
    if (changes.isSmartShuffle) {
      this.shuffleIcon = this.getShuffleIcon();
      this.shuffleClasses = this.getShuffleClasses();
    }
    if (changes.isPlaying) {
      this.playIcon = this.getPlayIcon();
    }
    if (changes.repeatState) {
      this.repeatIcon = this.getRepeatIcon();
      this.repeatClass = this.getRepeatClass();
    }
    if (changes.volume) {
      this.volumeIcon = this.getVolumeIcon();
    }
    if (changes.isLiked) {
      this.likedClass = this.getLikedClass();
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  onPause(): void {
    this.controls.togglePlaying();
  }

  onSkipPrevious(): void {
    this.controls.skipPrevious(false);
  }

  onSkipNext(): void {
    this.controls.skipNext();
  }

  onVolumeChange(change: MatSliderChange): void {
    this.controls.setVolume(change.value);
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
    this.controls.setVolume(volumeChange);
  }

  onToggleShuffle(): void {
    if (!this.isSmartShuffle) {
      this.controls.toggleShuffle();
    }
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
    this.controls.setRepeatState(repeatState);
  }

  onLikeChange(): void {
    this.controls.toggleLiked();
  }

  private getShuffleClasses(): string[] {
    return [
      this.isShuffle || this.isSmartShuffle ? ICON_CLASS_ACCENT : ICON_CLASS_PRIMARY,
      this.isSmartShuffle ? DEFAULT_POINTER : ''
    ];
  }

  private getShuffleIcon(): string {
    return this.isSmartShuffle ? SMART_SHUFFLE_ICON : SHUFFLE_ICON;
  }

  private getPlayIcon(): string {
    return this.isPlaying ? PAUSE_ICON : PLAY_ICON;
  }

  private getRepeatIcon(): string {
    let icon = REPEAT_ICON;
    if (this.repeatState === REPEAT_TRACK) {
      icon = REPEAT_ONE_ICON;
    }
    return icon;
  }

  private getRepeatClass(): string {
    let repeatClass = ICON_CLASS_PRIMARY;
    if (this.repeatState !== REPEAT_OFF) {
      repeatClass = ICON_CLASS_ACCENT;
    }
    return repeatClass;
  }

  private getVolumeIcon(): string {
    let icon = VOLUME_HIGH_ICON;
    if (this.volume === 0) {
      icon = VOLUME_MUTE_ICON;
    } else if (this.volume < 50) {
      icon = VOLUME_LOW_ICON;
    }
    return icon;
  }

  private getLikedClass(): string {
    return this.isLiked ? ICON_CLASS_ACCENT : ICON_CLASS_PRIMARY;
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
