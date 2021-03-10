import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Album} from '../../models/album.model';
import {SettingsService} from '../../services/settings/settings.service';
import {DEFAULT_OPTIONS} from '../../models/user-settings.model';
import {Subscription} from 'rxjs';

const MAX_CODE_WIDTH = 512;
const IMAGES_DIR = 'assets/images';

@Component({
  selector: 'app-album-display',
  templateUrl: './album-display.component.html',
  styleUrls: ['./album-display.component.css']
})
export class AlbumDisplayComponent implements OnInit, OnDestroy {

  private showSpotifyCodeSubscription: Subscription;
  private spotifyCodeBackgroundColorSubscription: Subscription;
  private spotifyCodeBarColorSubscription: Subscription;

  @Input() album: Album;
  @Input() uri: string;

  showSpotifyCode = DEFAULT_OPTIONS.showSpotifyCode;
  backgroundColor = DEFAULT_OPTIONS.spotifyCode.backgroundColor;
  barColor = DEFAULT_OPTIONS.spotifyCode.barColor;

  constructor(private settingsService: SettingsService) { }

  ngOnInit(): void {
    this.showSpotifyCodeSubscription = this.settingsService
      .getShowSpotifyCode().subscribe(value => {
        console.log('AlbumDisplayComponent: received new show spotify code value: ' + value);
        this.showSpotifyCode = value;
      });

    this.spotifyCodeBackgroundColorSubscription = this.settingsService
      .getSpotifyCodeBackgroundColor().subscribe(value => {
        console.log('AlbumDisplayComponent: received new background color value: ' + value);
        this.backgroundColor = value;
      });

    this.spotifyCodeBarColorSubscription = this.settingsService
      .getSpotifyCodeBarColor().subscribe(value => {
        console.log('AlbumDisplayComponent: received new bar color value: ' + value);
        this.barColor = value;
      });
  }

  ngOnDestroy(): void {
    this.showSpotifyCodeSubscription.unsubscribe();
    this.spotifyCodeBackgroundColorSubscription.unsubscribe();
    this.spotifyCodeBarColorSubscription.unsubscribe();
  }

  getAlbumArtUrl(): string {
    if (this.album) {
      return this.album.coverArt.url;
    }
    return '';
  }

  getSpotifyCodeUrl(): string {
    if (this.album && this.backgroundColor && this.barColor && this.uri) {
      return 'https://www.spotifycodes.com/downloadCode.php?uri='
        + encodeURIComponent('jpeg/'
          + this.backgroundColor + '/'
          + this.barColor + '/'
          + MAX_CODE_WIDTH + '/'
          + this.uri
        );
    }
    return IMAGES_DIR + '/placeholder_spotify_code.png';
  }
}
