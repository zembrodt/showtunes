import {Component, OnDestroy, OnInit} from '@angular/core';
import { map } from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import {interval, Subscription} from 'rxjs';
import { Track } from '../../models/track.model';
import { Album } from '../../models/album.model';
import {AlbumDisplayComponent} from '../album-display/album-display.component';
import {SpotifyService} from '../../services/spotify.service';
import {Router} from '@angular/router';
import {PREVIOUS_VOLUME} from '../../core/globals';

// Default values
const PLAYBACK_INTERVAL = 1000; // ms
const REQUEST_INTERVAL = 1000; // ms
const SKIP_PREVIOUS_THRESHOLD = 3000; // ms
const ALBUM_IMAGE_SIZE = 512;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  nextPlaybackRequest: Subscription;

  currentTrack: Track = {
    id: '',
    title: '',
    artist: '',
    album: 'Loading...',
    progress: 0,
    duration: 100,
    isPlaying: false,
    isShuffle: false,
    repeatState: 'off',
    volume: 100
  };

  album: Album = {
    id: '',
    coverArt: { url: 'assets/images/placeholder.png', width: 512, height: 512 },
    name: '',
    release_date: '',
    total_tracks: 0,
    album_type: '',
    artists: [
      {id: '', name: '', type: '', uri: ''}
    ],
    type: '',
    uri: ''
  };

  changeOccurring = false;
  changeOccurred = false;

  constructor(private spotifyService: SpotifyService, private router: Router) {}

  ngOnInit(): void {
    if (!this.spotifyService.isAuthTokenSet()) {
      this.router.navigateByUrl('/login').then(
        (success) => {
          if (!success) {
            console.log('Failed to redirect to /login');
          }
        },
        (reason) => {
          console.log('Failed to redirect to /login + ' + reason);
        }
      );
      return;
    }

    this.updateInfo();
    this.startPlaybackRequests();
  }

  ngOnDestroy(): void {
    if (this.nextPlaybackRequest) {
      this.nextPlaybackRequest.unsubscribe();
    }
  }

  startPlaybackRequests(): void {
    this.nextPlaybackRequest = interval(REQUEST_INTERVAL).subscribe(x => {
      if (!this.changeOccurring) {
        this.changeOccurred = false;
        this.updateInfo();
      } else {
        this.currentTrack.progress += REQUEST_INTERVAL;
      }
    });
  }

  private updateInfo(): void {
    this.spotifyService.getCurrentTrack().subscribe(res => {
      if (res && !this.changeOccurring && !this.changeOccurred) {
        if (res.item) {
          if (this.currentTrack.id !== res.item.id) {
            this.currentTrack.id = res.item.id;
            this.currentTrack.title = res.item.name;
            this.currentTrack.duration = res.item.duration_ms;
            // Artist info
            if (res.item.artists && res.item.artists.length > 0) {
              this.currentTrack.artist = res.item.artists[0].name;
            }
            // Album info
            if (res.item.album) {
              this.currentTrack.album = res.item.album.name;

              this.album.id = res.item.album.id;
              this.album.name = res.item.album.name;
              this.album.album_type = res.item.album.type;
              this.album.release_date = res.item.album.release_date;
              this.album.total_tracks = res.item.album.total_tracks;
              this.album.uri = res.item.album.uri;
              if (res.item.album.images && res.item.album.images.length > 0) {
                const images = res.item.album.images;
                let foundCorrectImage = false;
                let i: number;
                for (i = 0; i < images.length; i++) {
                  if (images[i].width === ALBUM_IMAGE_SIZE) {
                    this.album.coverArt = images[i];
                    foundCorrectImage = true;
                    break;
                  }
                }
                if (!foundCorrectImage) {
                  // Use the first image if we can't find one of the configured size
                  this.album.coverArt = images[0];
                }
              }
              // this.album.artists = res.item.artists;
            }
          }
        }
        if (this.currentTrack.isPlaying !== res.is_playing) {
          this.currentTrack.isPlaying = res.is_playing;
        }
        if (this.currentTrack.isShuffle !== res.shuffle_state) {
          this.currentTrack.isShuffle = res.shuffle_state;
        }
        if (this.currentTrack.repeatState !== res.repeat_state) {
          this.currentTrack.repeatState = res.repeat_state;
        }
        if (this.currentTrack.volume !== res.device.volume_percent) {
          if (this.currentTrack.volume > 0 && res.device.volume_percent === 0) {
            window.localStorage.setItem(PREVIOUS_VOLUME, this.currentTrack.volume.toString());
          }
          this.currentTrack.volume = res.device.volume_percent;
        }
        this.currentTrack.progress = res.progress_ms;
      }
    });
  }

  onProgressChange(value: number): void {
    this.changeOccurring = true;
    this.changeOccurred = true;
    this.currentTrack.progress = value;
    // Send progress request
    this.spotifyService.setTrackPosition(this.currentTrack.progress).subscribe(res => {
      this.changeOccurring = false;
      console.log('Changed progress. response: ' + JSON.stringify(res));
    });
  }

  onPlayingChange(value: boolean): void {
    this.changeOccurring = true;
    this.changeOccurred = true;
    this.currentTrack.isPlaying = value;
    this.spotifyService.setPlaying(this.currentTrack.isPlaying).subscribe(res => {
      this.changeOccurring = false;
      console.log('Changed playing. response: ' + JSON.stringify(res));
    });
  }

  onSkipNextChange(skipNext: boolean): void {
    this.changeOccurring = true;
    this.changeOccurred = true;
    if (skipNext) {
      this.spotifyService.skipNext().subscribe(res => {
        this.changeOccurring = false;
        console.log('Skipped to next song. Response: ' + JSON.stringify(res));
      });
    } else {
      // Restart the track if outside the default threshold
      if (this.currentTrack.progress > SKIP_PREVIOUS_THRESHOLD && !((SKIP_PREVIOUS_THRESHOLD * 2) >= this.currentTrack.duration)) {
        this.spotifyService.setTrackPosition(0).subscribe(res => {
          this.changeOccurring = false;
          console.log('Restarted track. Response: ' + JSON.stringify(res));
        });
      } else {
        this.spotifyService.skipPrevious().subscribe(res => {
          this.changeOccurring = false;
          console.log('Skipped to next song. Response: ' + JSON.stringify(res));
        });
      }
    }
  }

  onVolumeChange(value: number): void {
    this.changeOccurring = true;
    this.changeOccurred = true;
    this.currentTrack.volume = value;
    // Send volume request
    this.spotifyService.setVolume(this.currentTrack.volume).subscribe(res => {
      this.changeOccurring = false;
      console.log('Changed volume. response: ' + JSON.stringify(res));
    });
  }

  onShuffleChange(isShuffle: boolean): void {
    this.changeOccurring = true;
    this.changeOccurred = true;
    this.currentTrack.isShuffle = isShuffle;
    this.spotifyService.toggleShuffle(this.currentTrack.isShuffle).subscribe(res => {
      this.changeOccurring = false;
      console.log('Changed shuffle. response: ' + JSON.stringify(res));
    });
  }

  onRepeatChange(value: string): void {
    this.changeOccurring = true;
    this.changeOccurred = true;
    this.currentTrack.repeatState = value;
    this.spotifyService.setRepeatState(this.currentTrack.repeatState).subscribe(res => {
      this.changeOccurring = false;
      console.log('Changed repeat state. response: ' + JSON.stringify(res));
    });
  }
}
