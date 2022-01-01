import {Component, Input} from '@angular/core';
import {MatSliderChange} from '@angular/material/slider';
import {ChangeProgress} from '../../core/playback/playback.actions';
import {Store} from '@ngxs/store';

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
}
