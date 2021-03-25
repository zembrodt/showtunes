import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {Select} from '@ngxs/store';
import {SettingsState} from '../../core/settings/settings.state';
import {PlaybackState} from '../../core/playback/playback.state';
import {TrackModel} from '../../core/playback/playback.model';
import {ImageResponse} from '../../models/image.model';
import {takeUntil} from 'rxjs/operators';

const MAX_CODE_WIDTH = 512;
const IMAGES_DIR = 'assets/images';

@Component({
  selector: 'app-album-display',
  templateUrl: './album-display.component.html',
  styleUrls: ['./album-display.component.css']
})
export class AlbumDisplayComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Select(PlaybackState.covertArt) coverArt$: Observable<ImageResponse>;

  @Select(PlaybackState.track) track$: Observable<TrackModel>;
  private track: TrackModel;

  @Select(SettingsState.showSpotifyCode) showSpotifyCode$: Observable<boolean>;

  @Select(SettingsState.spotifyCodeBackgroundColor) backgroundColor$: Observable<string>;
  private backgroundColor: string;

  @Select(SettingsState.spotifyCodeBarColor) barColor$: Observable<string>;
  private barColor: string;

  constructor() { }

  ngOnInit(): void {
    this.track$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((track) => this.track = track);
    this.backgroundColor$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((backgroundColor) => {
        this.backgroundColor = backgroundColor;
      });
    this.barColor$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((barColor) => this.barColor = barColor);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  getSpotifyCodeUrl(): string {
    if (this.backgroundColor && this.barColor && this.track) {
      return 'https://www.spotifycodes.com/downloadCode.php?uri='
        + encodeURIComponent('jpeg/'
          + this.backgroundColor + '/'
          + this.barColor + '/'
          + MAX_CODE_WIDTH + '/'
          + this.track.uri
        );
    }
    return IMAGES_DIR + '/placeholder_spotify_code.png';
  }
}
