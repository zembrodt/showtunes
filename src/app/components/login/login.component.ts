import { Component, OnInit } from '@angular/core';
import {SpotifyService} from '../../services/spotify/spotify.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(private spotify: SpotifyService) { }

  ngOnInit(): void {
    const redirect = this.spotify.getAuthorizeRequestUrl();
    window.location.href = redirect;
  }
}
