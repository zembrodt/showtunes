import { Component, OnDestroy, OnInit } from '@angular/core';
import { faSpotify } from '@fortawesome/free-brands-svg-icons';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppConfig } from '../../app.config';
import { DominantColor, DominantColorFinder } from '../../core/dominant-color/dominant-color-finder';
import { AlbumModel, TrackModel } from '../../core/playback/playback.model';
import { PlaybackState } from '../../core/playback/playback.state';
import { ChangeDynamicColor, ChangeSmartColor } from '../../core/settings/settings.actions';
import { BAR_COLOR_BLACK, BAR_COLOR_WHITE, DEFAULT_BAR_CODE_COLOR, DEFAULT_CODE_COLOR } from '../../core/settings/settings.model';
import { SettingsState } from '../../core/settings/settings.state';
import { expandHexColor, hexToRgb, isHexColor } from '../../core/util';
import { ImageResponse } from '../../models/image.model';
import { SpotifyService } from '../../services/spotify/spotify.service';

const SPOTIFY_CODES_URL = 'https://www.spotifycodes.com/downloadCode.php';
const MAX_CODE_WIDTH = 512;
const BAR_CODE_COLOR_THRESHOLD = 186;

@Component({
  selector: 'app-album-display',
  templateUrl: './album-display.component.html',
  styleUrls: ['./album-display.component.css']
})
export class AlbumDisplayComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Select(PlaybackState.covertArt) coverArt$: Observable<ImageResponse>;
  private coverArt: ImageResponse;

  @Select(PlaybackState.track) track$: Observable<TrackModel>;
  private track: TrackModel;

  @Select(PlaybackState.album) album$: Observable<AlbumModel>;

  @Select(PlaybackState.isIdle) isIdle$: Observable<boolean>;

  @Select(SettingsState.useSmartCodeColor) userDynamicCodeColor: Observable<boolean>;
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
  smartBackgroundColor: string;
  smartBarColor: string;

  // Template constants
  readonly spotifyIcon = faSpotify;

  constructor(private spotifyService: SpotifyService, private store: Store) {}

  ngOnInit(): void {
    if (!this.dominantColorFinder) {
      this.dominantColorFinder = new DominantColorFinder();
    }

    this.track$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((track) => {
        this.track = track;
        this.spotifyCodeUrl = this.getSpotifyCodeUrl();
      });
    this.coverArt$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((coverArt) => {
        this.coverArt = coverArt;
        // Calculate the dynamic color from the cover art
        if (this.coverArt.url) {
          this.dominantColorFinder.getColor(this.coverArt.url).then((dominantColor) => {
            if (dominantColor && isHexColor(dominantColor.hex)) {
              this.store.dispatch(new ChangeDynamicColor(dominantColor));
            } else {
              this.store.dispatch(new ChangeDynamicColor(null));
            }
          });
        }
      });
    this.backgroundColor$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((backgroundColor) => {
        this.backgroundColor = backgroundColor;
        this.spotifyCodeUrl = this.getSpotifyCodeUrl();
      });
    this.barColor$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((barColor) => {
        this.barColor = barColor;
        this.spotifyCodeUrl = this.getSpotifyCodeUrl();
      });
    this.userDynamicCodeColor
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((useDynamicCodeColor) => {
        this.useDynamicCodeColor = useDynamicCodeColor;
        this.setSpotifyCodeUrl();
      });
    this.dynamicColor$.pipe(takeUntil(this.ngUnsubscribe))
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
      return SPOTIFY_CODES_URL + '?uri='
        + encodeURIComponent('jpeg/'
          + expandHexColor(backgroundColor) + '/'
          + barColor + '/'
          + MAX_CODE_WIDTH + '/'
          + this.track.uri
        );
    }
    return null;
  }

  private getSpotifyCodeUrl(): string {
    if (this.useDynamicCodeColor && AppConfig.settings.env.albumColorUrl) {
      return this.createSpotifyCodeUrl(this.smartBackgroundColor, this.smartBarColor);
    }
    return this.createSpotifyCodeUrl(this.backgroundColor, this.barColor);
  }

  private setSpotifyCodeUrl(): void {
    console.log('dynamicColor=' + JSON.stringify(this.dynamicColor));
    if (this.dynamicColor && this.useDynamicCodeColor) {
      this.spotifyCodeUrl = this.createSpotifyCodeUrl(this.dynamicColor.hex, this.dynamicColor.foregroundFontColor);
    } else {
      // Set to default
      this.spotifyCodeUrl = this.createSpotifyCodeUrl(this.backgroundColor, this.barColor);
    }
  }

  private setSmartColor(): void {
    if (AppConfig.settings.env.albumColorUrl && this.coverArt && this.coverArt.url) {
      this.spotifyService.getAlbumColor(this.coverArt.url).subscribe((response) => {
        const smartColor = response && response.color ? response.color.replace('#', '') : null;
        // Check we have a valid code color value
        if (isHexColor(smartColor)) {
          this.smartBackgroundColor = smartColor;
          this.store.dispatch(new ChangeSmartColor(this.smartBackgroundColor));
          // Determine if the bar code should be white or black
          // See https://stackoverflow.com/questions/3942878/how-to-decide-font-color-in-white-or-black-depending-on-background-color
          const rgbColor = hexToRgb(this.smartBackgroundColor);
          this.smartBarColor = rgbColor.r * 0.299 + rgbColor.g * 0.587 + rgbColor.b * 0.144 > BAR_CODE_COLOR_THRESHOLD ?
            BAR_COLOR_BLACK : BAR_COLOR_WHITE;
        } else {
          this.store.dispatch(new ChangeSmartColor(null));
          console.error(`Retrieved invalid smart code color ${smartColor}: not a valid hex color`);
          this.smartBackgroundColor = DEFAULT_CODE_COLOR;
          this.smartBarColor = DEFAULT_BAR_CODE_COLOR;
        }
        this.spotifyCodeUrl = this.getSpotifyCodeUrl();
      });
    }
  }
}
