import { Component, Input } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import { Store } from '@ngxs/store';
import { ChangeProgress } from '../../core/playback/playback.actions';

@Component({
  selector: 'app-track-player-progress',
  templateUrl: './track-player-progress.component.html',
  styleUrls: ['./track-player.component.css']
})
export class TrackPlayerProgressComponent {

  @Input() progress = 0;
  @Input() duration = 100;

  constructor(private store: Store) {}

  onProgressChange(change: MatSliderChange): void {
    this.store.dispatch(new ChangeProgress(change.value));
  }

  getProgress(milliseconds: number): string {
    let seconds = Math.floor((milliseconds / 1000) % 60);
    seconds = seconds >= 0 ? seconds : 0;
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
    const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);
    let timestamp: string;
    if (hours > 0) {
      timestamp = `${hours}:${minutes.toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
      })}`;
    } else {
      timestamp = minutes >= 0 ? minutes.toString() : '0';
    }
    return `${timestamp}:${seconds.toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      useGrouping: false
    })}`;
  }
}
