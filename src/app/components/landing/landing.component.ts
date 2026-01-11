import { Component } from '@angular/core';
import { faSpotify } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  readonly spotifyIcon = faSpotify;

  constructor() { }
}
