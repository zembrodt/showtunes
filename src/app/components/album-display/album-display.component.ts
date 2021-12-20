import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {Select} from '@ngxs/store';
import {faSpotify} from '@fortawesome/free-brands-svg-icons';
import {SettingsState} from '../../core/settings/settings.state';
import {PlaybackState} from '../../core/playback/playback.state';
import {AlbumModel, TrackModel} from '../../core/playback/playback.model';
import {ImageResponse} from '../../models/image.model';
import {takeUntil} from 'rxjs/operators';
import {SpotifyService} from '../../services/spotify/spotify.service';
import {
  BAR_COLOR_BLACK,
  BAR_COLOR_WHITE,
  DEFAULT_BAR_CODE_COLOR,
  DEFAULT_CODE_COLOR
} from '../../core/settings/settings.model';
import {hexToRgb, isHexColor} from '../../core/util';
import {AppConfig} from '../../app.config';

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

  spotifyCodeUrl: string;
  smartBackgroundColor: string;
  smartBarColor: string;

  spotifyIcon = faSpotify;

  constructor(private spotifyService: SpotifyService) {}

  ngOnInit(): void {
    // Set initial spotify code color
    if (this.useSmartCodeColor) {
      this.setSmartCodeColor();
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
          this.setSmartCodeColor();
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
          this.setSmartCodeColor();
        }
        this.spotifyCodeUrl = this.getSpotifyCodeUrl();
      });
    this.showSpotifyCode$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showSpotifyCode) => this.showSpotifyCode = showSpotifyCode);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private createSpotifyCodeUrl(backgroundColor, barColor: string): string {
    if (backgroundColor && barColor && this.track && this.track.uri) {
      return SPOTIFY_CODES_URL + '?uri='
        + encodeURIComponent('jpeg/'
          + backgroundColor + '/'
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

  private setSmartCodeColor(): void {
    if (AppConfig.settings.env.albumColorUrl && this.coverArt && this.coverArt.url) {
      this.spotifyService.getAlbumColor(this.coverArt.url).subscribe((smartColor) => {
        this.smartBackgroundColor = smartColor.replace('#', '');
        // Check we have a valid code color value
        if (isHexColor(this.smartBackgroundColor)) {
          // Determine if the bar code should be white or black
          // See https://stackoverflow.com/questions/3942878/how-to-decide-font-color-in-white-or-black-depending-on-background-color
          const rgbColor = hexToRgb(this.smartBackgroundColor);
          this.smartBarColor = rgbColor.r * 0.299 + rgbColor.g * 0.587 + rgbColor.b * 0.144 > BAR_CODE_COLOR_THRESHOLD ?
            BAR_COLOR_BLACK : BAR_COLOR_WHITE;
        } else {
          console.error(`Retrieved invalid smart code color ${smartColor}: not a valid hex color`);
          this.smartBackgroundColor = DEFAULT_CODE_COLOR;
          this.smartBarColor = DEFAULT_BAR_CODE_COLOR;
        }
        this.spotifyCodeUrl = this.getSpotifyCodeUrl();
      });
    }
  }
}
