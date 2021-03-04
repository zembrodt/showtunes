import { Component, Input, OnInit } from '@angular/core';
import {Album} from '../../models/album.model';

const spotifyCodeUrl = 'https://www.spotifycodes.com/downloadCode.php?uri=jpeg%2F24E07D%2Fblack%2F640%2Fspotify%3Atrack%3A';

@Component({
  selector: 'app-album-display',
  templateUrl: './album-display.component.html',
  styleUrls: ['./album-display.component.css']
})
export class AlbumDisplayComponent implements OnInit {
  static albumAndSpotifyCodePaddingScale = 0.0625;

  @Input() album: Album;
  @Input() codeId: number;

  constructor() { }

  ngOnInit(): void {
  }

  getAlbumArtUrl(): string {
    return this.album.coverArt.url;
  }

  getSpotifyCodeUrl(): string {
    return spotifyCodeUrl + this.codeId;
  }

  getPadding(): number {
    return this.album.coverArt.height * AlbumDisplayComponent.albumAndSpotifyCodePaddingScale;
  }
}
