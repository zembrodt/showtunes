import { Component, OnDestroy, OnInit } from '@angular/core';
import { faSpotify } from '@fortawesome/free-brands-svg-icons';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DominantColor, DominantColorFinder } from '../../core/dominant-color/dominant-color-finder';
import { AlbumModel, PlayerState, TrackModel } from '../../core/playback/playback.model';
import { PlaybackState } from '../../core/playback/playback.state';
import { ChangeDynamicColor } from '../../core/settings/settings.actions';
import { SettingsState } from '../../core/settings/settings.state';
import { expandHexColor, isHexColor } from '../../core/util';
import { ImageResponse } from '../../models/image.model';

@Component({
  selector: 'app-album-display',
  templateUrl: './album-display.component.html',
  styleUrls: ['./album-display.component.css']
})
export class AlbumDisplayComponent implements OnInit, OnDestroy {
  private static readonly spotifyCodesUrl = 'https://www.spotifycodes.com/downloadCode.php';
  private static readonly maxCodeWidth = 512;
  private ngUnsubscribe = new Subject();

  @Select(PlaybackState.covertArt) coverArt$: Observable<ImageResponse>;
  private coverArt: ImageResponse;

  @Select(PlaybackState.track) track$: Observable<TrackModel>;
  private track: TrackModel;

  @Select(PlaybackState.album) album$: Observable<AlbumModel>;

  @Select(PlaybackState.playerState) playerState$: Observable<PlayerState>;

  @Select(SettingsState.useDynamicCodeColor) useDynamicCodeColor$: Observable<boolean>;
  private useDynamicCodeColor: boolean;

  @Select(SettingsState.dynamicColor) dynamicColor$: Observable<DominantColor>;
  private dynamicColor: DominantColor;

  @Select(SettingsState.showSpotifyCode) showSpotifyCode$: Observable<boolean>;
  private showSpotifyCode: boolean;

  @Select(SettingsState.spotifyCodeBackgroundColor) backgroundColor$: Observable<string>;
  private backgroundColor: string;

  @Select(SettingsState.spotifyCodeBarColor) barColor$: Observable<string>;
  private barColor: string;

  @Select(SettingsState.useDynamicThemeAccent) useDynamicThemeAccent$: Observable<boolean>;
  private useDynamicThemeAccent;

  private dominantColorFinder: DominantColorFinder = null;

  spotifyCodeUrl: string;

  // Template constants
  readonly spotifyIcon = faSpotify;
  readonly playingState = PlayerState.Playing;

  constructor(private store: Store) {}

  ngOnInit(): void {
    if (!this.dominantColorFinder) {
      this.dominantColorFinder = new DominantColorFinder();
    }

    this.track$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((track) => {
        this.track = track;
        this.setSpotifyCodeUrl();
      });
    this.coverArt$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((coverArt) => {
        this.coverArt = coverArt;
        // Calculate the dynamic color from the cover art
        if (this.coverArt && this.coverArt.url) {
          this.dominantColorFinder.getColor(this.coverArt.url).then((dominantColor) => {
            if (dominantColor && isHexColor(dominantColor.hex)) {
              this.store.dispatch(new ChangeDynamicColor(dominantColor));
            } else {
              this.store.dispatch(new ChangeDynamicColor(null));
            }
          }).catch((e) => {
            console.error(`Error attempting to get the dominant color for ${this.coverArt.url}: ${JSON.stringify(e)}`);
            this.store.dispatch(new ChangeDynamicColor(null));
          });
        }
      });
    this.backgroundColor$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((backgroundColor) => {
        this.backgroundColor = backgroundColor;
        this.setSpotifyCodeUrl();
      });
    this.barColor$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((barColor) => {
        this.barColor = barColor;
        this.setSpotifyCodeUrl();
      });
    this.useDynamicCodeColor$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((useDynamicCodeColor) => {
        this.useDynamicCodeColor = useDynamicCodeColor;
        this.setSpotifyCodeUrl();
      });
    this.dynamicColor$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((dynamicColor) => {
        this.dynamicColor = dynamicColor;
        this.setSpotifyCodeUrl();
      });
    this.showSpotifyCode$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showSpotifyCode) => this.showSpotifyCode = showSpotifyCode);
    this.useDynamicThemeAccent$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((useDynamicThemeAccent) => this.useDynamicThemeAccent = useDynamicThemeAccent);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private createSpotifyCodeUrl(backgroundColor, barColor: string): string {
    if (backgroundColor && barColor && this.track && this.track.uri) {
      return AlbumDisplayComponent.spotifyCodesUrl + '?uri='
        + encodeURIComponent('jpeg/'
          + expandHexColor(backgroundColor) + '/'
          + barColor + '/'
          + AlbumDisplayComponent.maxCodeWidth + '/'
          + this.track.uri
        );
    }
    return null;
  }

  private setSpotifyCodeUrl(): void {
    if (this.dynamicColor && this.useDynamicCodeColor) {
      this.spotifyCodeUrl = this.createSpotifyCodeUrl(this.dynamicColor.hex, this.dynamicColor.foregroundFontColor);
    } else {
      // Set to default
      this.spotifyCodeUrl = this.createSpotifyCodeUrl(this.backgroundColor, this.barColor);
    }
  }
}
