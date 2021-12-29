import {Component, OnDestroy, OnInit} from '@angular/core';
import {Select} from '@ngxs/store';
import {PlaybackState} from '../../core/playback/playback.state';
import {Observable, Subject} from 'rxjs';
import {AlbumModel, PlaylistModel, TrackModel} from '../../core/playback/playback.model';
import {SettingsState} from '../../core/settings/settings.state';
import {PlayerControlsOptions} from '../../core/settings/settings.model';

@Component({
  selector: 'app-track-player',
  templateUrl: './track-player.component.html',
  styleUrls: ['./track-player.component.css']
})
export class TrackPlayerComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Select(PlaybackState.track) track$: Observable<TrackModel>;
  @Select(PlaybackState.album) album$: Observable<AlbumModel>;
  @Select(PlaybackState.playlist) playlist$: Observable<PlaylistModel>;
  @Select(PlaybackState.deviceVolume) volume$: Observable<number>;
  @Select(PlaybackState.progress) progress$: Observable<number>;
  @Select(PlaybackState.duration) duration$: Observable<number>;
  @Select(PlaybackState.isPlaying) isPlaying$: Observable<boolean>;
  @Select(PlaybackState.isShuffle) isShuffle$: Observable<boolean>;
  @Select(PlaybackState.repeat) repeat$: Observable<string>;
  @Select(PlaybackState.isLiked) isLiked$: Observable<boolean>;
  @Select(SettingsState.showPlayerControls) showPlayerControls$: Observable<PlayerControlsOptions>;
  @Select(SettingsState.showPlaylistName) showPlaylistName$: Observable<boolean>;

  showPlayerControls: boolean;

  constructor() {}

  ngOnInit(): void {
    this.showPlayerControls$.subscribe((option) => {
      this.showPlayerControls = option !== PlayerControlsOptions.Off;
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
