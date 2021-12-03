import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatSliderChange} from '@angular/material/slider';
import {PREVIOUS_VOLUME} from '../../core/globals';
import {StorageService} from '../../services/storage/storage.service';
import {Select, Store} from '@ngxs/store';
import {PlaybackState} from '../../core/playback/playback.state';
import {Observable, Subject} from 'rxjs';
import {AlbumModel, TrackModel} from '../../core/playback/playback.model';
import {
  ChangeDeviceVolume,
  ChangeProgress,
  ChangeRepeatState, SkipNextTrack, SkipPreviousTrack, ToggleLiked,
  TogglePlaying,
  ToggleShuffle
} from '../../core/playback/playback.actions';
import {takeUntil} from 'rxjs/operators';
import {SettingsState} from '../../core/settings/settings.state';

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
export class TrackPlayerComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Select(PlaybackState.track) track$: Observable<TrackModel>;
  @Select(PlaybackState.album) album$: Observable<AlbumModel>;
  @Select(PlaybackState.deviceVolume) volume$: Observable<number>;
  @Select(PlaybackState.progress) progress$: Observable<number>;
  @Select(PlaybackState.duration) duration$: Observable<number>;
  @Select(PlaybackState.isPlaying) isPlaying$: Observable<boolean>;
  @Select(PlaybackState.isShuffle) isShuffle$: Observable<boolean>;
  @Select(PlaybackState.repeat) repeat$: Observable<string>;
  @Select(PlaybackState.isLiked) isLiked$: Observable<boolean>;
  @Select(SettingsState.showPlayerControls) showPlayerControls$: Observable<boolean>;

  private volume: number;
  private repeatState: string;

  constructor(private storage: StorageService, private store: Store) { }

  ngOnInit(): void {
    this.volume$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((volume) => this.volume = volume);
    this.repeat$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((repeat) => this.repeatState = repeat);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
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
    // TODO: check this is within 0 and track duration?
    console.log('Updating progress to: ' + change.value);
    this.store.dispatch(new ChangeProgress(change.value));
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
    // TODO: check value is within 0 and 100?
    console.log('Changing volume to: ' + change.value);
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
    if (repeatState === REPEAT_OFF) {
      return 'track-player-icon';
    }
    return 'track-player-icon-accent';
  }

  getVolumeIcon(volume: number): string {
    let icon = VOLUME_MUTE_ICON;
    if (volume >= 50) {
      icon = VOLUME_HIGH_ICON;
    } else if (volume > 0) {
      icon = VOLUME_LOW_ICON;
    }
    return icon;
  }
}
