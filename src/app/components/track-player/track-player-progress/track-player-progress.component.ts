import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import { SpotifyControlsService } from '../../../services/spotify/controls/spotify-controls.service';

@Component({
  selector: 'app-track-player-progress',
  templateUrl: './track-player-progress.component.html',
  styleUrls: ['./track-player-progress.component.css']
})
export class TrackPlayerProgressComponent implements OnChanges {

  @Input() progress = 0;
  @Input() duration = 100;

  progressFormatted = this.getFormattedProgress(this.progress);
  durationFormatted = this.getFormattedProgress(this.duration);

  constructor(private controls: SpotifyControlsService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.progress) {
      this.progressFormatted = this.getFormattedProgress(this.progress);
    }
    if (changes.duration) {
      this.durationFormatted = this.getFormattedProgress(this.duration);
    }
  }

  onProgressChange(change: MatSliderChange): void {
    this.controls.setTrackPosition(change.value);
  }

  private getFormattedProgress(milliseconds: number): string {
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
