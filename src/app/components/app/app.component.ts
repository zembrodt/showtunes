import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {Select} from '@ngxs/store';
import {SettingsState} from '../../core/settings/settings.state';
import {PlaybackService} from '../../core/playback/playback.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ShowTunes';

  @Select(SettingsState.theme) theme$: Observable<string>;

  constructor(private playbackService: PlaybackService) { }

  ngOnInit(): void {
    this.playbackService.initialize();
  }
}
