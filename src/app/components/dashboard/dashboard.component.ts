import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { newTrack, Track } from '../../models/track.model';
import {Album, newAlbum} from '../../models/album.model';
import { SpotifyService } from '../../services/spotify/spotify.service';
import { Router } from '@angular/router';
import { PREVIOUS_VOLUME } from '../../core/globals';
import { CurrentPlaybackResponse } from '../../models/current-playback.model';
import {StorageService} from '../../services/storage/storage.service';

const LAST_TRACK = 'LAST_TRACK';
const LAST_ALBUM = 'LAST_ALBUM';

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

  currentTrack: Track;

  album: Album;

  changeOccurring = false;
  changeOccurred = false;

  constructor(private router: Router, private spotifyService: SpotifyService, private storage: StorageService) { }

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
    // load previous track progress if no track is playing
    if (!this.currentTrack) {
      const prevTrack = this.storage.get(LAST_TRACK);
      if (prevTrack) {
        this.currentTrack = JSON.parse(prevTrack);
        const prevAlbum = this.storage.get(LAST_ALBUM);
        if (prevAlbum) {
          this.album = JSON.parse(prevAlbum);
        }
      }
    }
    // delete outdated progress if exists
    this.storage.remove(LAST_TRACK);
    this.storage.remove(LAST_ALBUM);

    this.startPlaybackRequests();
  }

  ngOnDestroy(): void {
    if (this.nextPlaybackRequest) {
      this.nextPlaybackRequest.unsubscribe();
    }
  }

  @HostListener('window:unload', ['$event'])
  unloadHandler(event): void {
    // Save the current track
    if (this.currentTrack) {
      this.storage.set(LAST_TRACK, JSON.stringify(this.currentTrack));
      if (this.album) {
        this.storage.set(LAST_ALBUM, JSON.stringify(this.album));
      }
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
    this.spotifyService.getCurrentTrack().subscribe((res: CurrentPlaybackResponse) => {
      console.log('Playback response: ' + JSON.stringify(res));
      if (res && !this.changeOccurring && !this.changeOccurred) {
        if (res.item) {
          if (!this.currentTrack) {
            this.currentTrack = newTrack();
          }
          if (this.currentTrack.id !== res.item.id) {
            this.currentTrack.id = res.item.id;
            this.currentTrack.title = res.item.name;
            this.currentTrack.duration = res.item.duration_ms;
            this.currentTrack.uri = res.item.uri;
            // Artist info
            if (res.item.artists && res.item.artists.length > 0) {
              this.currentTrack.artist = res.item.artists[0].name;
            }
            // Album info
            if (res.item.album) {
              this.currentTrack.album = res.item.album.name;

              if (!this.album) {
                this.album = newAlbum();
              }
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
            this.storage.set(PREVIOUS_VOLUME, this.currentTrack.volume.toString());
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
