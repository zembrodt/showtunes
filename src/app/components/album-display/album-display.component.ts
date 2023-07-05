import { Component, OnDestroy, OnInit } from '@angular/core';
import { faSpotify } from '@fortawesome/free-brands-svg-icons';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppConfig } from '../../app.config';
import { AlbumModel, TrackModel } from '../../core/playback/playback.model';
import { PlaybackState } from '../../core/playback/playback.state';
import { ChangeSmartColor } from '../../core/settings/settings.actions';
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

  @Select(SettingsState.useSmartCodeColor) useSmartCodeColor$: Observable<boolean>;
  private useSmartCodeColor: boolean;

  @Select(SettingsState.showSpotifyCode) showSpotifyCode$: Observable<boolean>;
  private showSpotifyCode: boolean;

  @Select(SettingsState.spotifyCodeBackgroundColor) backgroundColor$: Observable<string>;
  private backgroundColor: string;

  @Select(SettingsState.spotifyCodeBarColor) barColor$: Observable<string>;
  private barColor: string;

  @Select(SettingsState.useDynamicThemeAccent) useDynamicThemeAccent$: Observable<boolean>;
  private useDynamicThemeAccent;

  spotifyCodeUrl: string;
  smartBackgroundColor: string;
  smartBarColor: string;

  // Template constants
  readonly spotifyIcon = faSpotify;

  constructor(private spotifyService: SpotifyService, private store: Store) {}

  ngOnInit(): void {
    // Set initial spotify code color
    if (this.useSmartCodeColor || this.useDynamicThemeAccent) {
      this.setSmartColor();
    }
    this.spotifyCodeUrl = this.getSpotifyCodeUrl();

    this.track$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((track) => {
        this.track = track;
        this.spotifyCodeUrl = this.getSpotifyCodeUrl();
      });
    this.coverArt$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((coverArt) => {
        // TODO: This adds a "loading" time to the spotify code while it fetches the new color, but album moves around while the
        // placeholder is switched to the new code
        /*if (!this.coverArt || coverArt.url !== this.coverArt.url) {
          this.smartBackgroundColor = null;
          this.smartBarColor = null;
        }*/
        this.coverArt = coverArt;
        if (this.useSmartCodeColor) {
          this.setSmartColor();
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
    this.useSmartCodeColor$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((useSmartCodeColor) => {
        this.useSmartCodeColor = useSmartCodeColor;
        if (useSmartCodeColor) {
          this.setSmartColor();
        }
        this.spotifyCodeUrl = this.getSpotifyCodeUrl();
      });
    this.showSpotifyCode$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showSpotifyCode) => this.showSpotifyCode = showSpotifyCode);
    this.useDynamicThemeAccent$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((useDynamicThemeAccent) => {
        this.useDynamicThemeAccent = useDynamicThemeAccent;
        if (useDynamicThemeAccent) {
          this.setSmartColor();
        }
      });
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
    if (this.useSmartCodeColor && AppConfig.settings.env.albumColorUrl) {
      return this.createSpotifyCodeUrl(this.smartBackgroundColor, this.smartBarColor);
    }
    return this.createSpotifyCodeUrl(this.backgroundColor, this.barColor);
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
