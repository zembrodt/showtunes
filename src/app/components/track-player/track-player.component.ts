import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Track} from '../../models/track.model';
import {MatSliderChange} from '@angular/material/slider';
import {PREVIOUS_VOLUME} from '../../core/globals';
import {StorageService} from '../../services/storage/storage.service';

// Default values
const DEFAULT_VOLUME = 50;

// Icons
const PLAY_ICON = 'play_arrow';
const PAUSE_ICON = 'pause';

const REPEAT_ICON = 'repeat';
const REPEAT_ONE_ICON = 'repeat_one';

const VOLUME_HIGH_ICON = 'volume_up';
const VOLUME_LOW_ICON = 'volume_down';
const VOLUME_MUTE_ICON = 'volume_off';

// Keys
const REPEAT_OFF = 'off';
const REPEAT_CONTEXT = 'context';
const REPEAT_TRACK = 'track';

@Component({
  selector: 'app-track-player',
  templateUrl: './track-player.component.html',
  styleUrls: ['./track-player.component.css']
})
export class TrackPlayerComponent implements OnInit {

  @Input() track: Track;

  // Outputs
  @Output() progressChange = new EventEmitter<number>();
  @Output() playingChange = new EventEmitter<boolean>();
  // true if skipping to next, false if skipping to previous
  @Output() skipNextChange = new EventEmitter<boolean>();
  @Output() volumeChange = new EventEmitter<number>();
  @Output() shuffleChange = new EventEmitter<boolean>();
  @Output() repeatChange = new EventEmitter<string>();

  constructor(private storage: StorageService) { }

  ngOnInit(): void {
  }

  getProgress(milliseconds: number): string {
    const seconds = Math.floor((milliseconds / 1000) % 60)
      .toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
      });
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
    const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);
    let timestamp = '';
    if (hours > 0) {
      timestamp += hours + ':' + minutes.toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
      });
    } else {
      timestamp += minutes;
    }
    timestamp += ':' + seconds;
    return timestamp;
  }

  onProgressChange(change: MatSliderChange): void {
    if (this.track) {
      if (change.value >= 0 && change.value <= this.track.duration) {
        this.progressChange.emit(change.value);
      }
    }
  }

  onPause(): void {
    if (this.track) {
      this.playingChange.emit(!this.track.isPlaying);
    }
  }

  onSkipPrevious(): void {
    if (this.track) {
      this.skipNextChange.emit(false);
    }
  }

  onSkipNext(): void {
    if (this.track) {
      this.skipNextChange.emit(true);
    }
  }

  onVolumeChange(change: MatSliderChange): void {
    if (this.track && change.value >= 0 && change.value <= 100) {
      this.volumeChange.emit(change.value);
    }
  }

  onVolumeMute(): void {
    if (this.track) {
      if (this.track.volume > 0) {
        this.storage.set(PREVIOUS_VOLUME, this.track.volume.toString());
        this.volumeChange.emit(0);
      } else {
        const previousVolume = parseInt(this.storage.get(PREVIOUS_VOLUME), 10);
        if (previousVolume && !isNaN(previousVolume) && previousVolume > 0) {
          this.volumeChange.emit(previousVolume);
        } else {
          // Emit a default volume
          this.volumeChange.emit(DEFAULT_VOLUME);
        }
      }
    }
  }

  onToggleShuffle(): void {
    if (this.track) {
      this.shuffleChange.emit(!this.track.isShuffle);
    }
  }

  onRepeatChange(): void {
    if (this.track) {
      switch (this.track.repeatState) {
        case REPEAT_OFF:
          this.repeatChange.emit(REPEAT_CONTEXT);
          break;
        case REPEAT_CONTEXT:
          this.repeatChange.emit(REPEAT_TRACK);
          break;
        default:
          this.repeatChange.emit(REPEAT_OFF);
      }
    }
  }

  onLikeChange(): void {
    console.log('TODO: Track like');
  }

  getPlayIcon(): string {
    if (this.track && this.track.isPlaying) {
      return PAUSE_ICON;
    }
    return PLAY_ICON;
  }

  getRepeatIcon(): string {
    let icon = REPEAT_ICON;
    if (this.track && this.track.repeatState === REPEAT_TRACK) {
      icon = REPEAT_ONE_ICON;
    }
    return icon;
  }

  getRepeatColor(): string {
    if (!this.track || this.track.repeatState === REPEAT_OFF) {
      return 'primary';
    }
    return 'accent';
  }

  getShuffleColor(): string {
    if (!this.track || !this.track.isShuffle) {
      return 'primary';
    }
    return 'accent';
  }

  getVolumeIcon(): string {
    if (!this.track) {
      return VOLUME_HIGH_ICON;
    }
    let icon = VOLUME_MUTE_ICON;
    if (this.track.volume >= 50) {
      icon = VOLUME_HIGH_ICON;
    } else if (this.track.volume > 0) {
      icon = VOLUME_LOW_ICON;
    }
    return icon;
  }
}
