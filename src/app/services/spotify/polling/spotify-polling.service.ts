import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ChangeAlbum,
  ChangeDevice,
  ChangeDeviceIsActive,
  ChangeDeviceVolume,
  ChangePlaylist, ChangeRepeatState,
  ChangeTrack, SetPlayerState, SetPlaying, SetProgress, SetShuffle
} from '../../../core/playback/playback.actions';
import { AlbumModel, DeviceModel, PlayerState, PlaylistModel, TrackModel } from '../../../core/playback/playback.model';
import { PlaybackState } from '../../../core/playback/playback.state';
import { SpotifyEndpoints } from '../../../core/spotify/spotify-endpoints';
import { SpotifyAPIResponse } from '../../../core/types';
import { checkResponse, getIdFromSpotifyUri, parseAlbum, parseDevice, parseTrack } from '../../../core/util';
import { CurrentPlaybackResponse } from '../../../models/current-playback.model';
import { PREVIOUS_VOLUME, StorageService } from '../../storage/storage.service';
import { SpotifyControlsService } from '../controls/spotify-controls.service';

@Injectable({providedIn: 'root'})
export class SpotifyPollingService {
  @Select(PlaybackState.track) private track$: BehaviorSubject<TrackModel>;
  private track: TrackModel = null;

  @Select(PlaybackState.album) private album$: BehaviorSubject<AlbumModel>;
  private album: AlbumModel = null;

  @Select(PlaybackState.playlist) private playlist$: BehaviorSubject<PlaylistModel>;
  private playlist: PlaylistModel = null;

  @Select(PlaybackState.device) private device$: BehaviorSubject<DeviceModel>;
  private device: DeviceModel = null;

  constructor(private http: HttpClient, private storage: StorageService, private store: Store, private controls: SpotifyControlsService) {}

  initSubscriptions(): void {
    this.track$.subscribe((track) => this.track = track);
    this.album$.subscribe((album) => this.album = album);
    this.playlist$.subscribe((playlist) => this.playlist = playlist);
    this.device$.subscribe((device) => this.device = device);
  }

  pollCurrentPlayback(): void {
    this.http.get<CurrentPlaybackResponse>(SpotifyEndpoints.getPlaybackEndpoint(), {observe: 'response'})
      .pipe(
        map((res: HttpResponse<CurrentPlaybackResponse>) => {
          const apiResponse = checkResponse(res, true, true);
          if (apiResponse === SpotifyAPIResponse.Success) {
            return res.body;
          }
          else if (apiResponse === SpotifyAPIResponse.NoPlayback) {
            // Playback not available or active
            return null;
          }
          return null;
        })).subscribe((playback) => {
      // if not locked?
      if (playback && playback.item) {
        const track = playback.item;

        // Check for new track
        if (track && track.id !== this.track.id) {
          this.store.dispatch(new ChangeTrack(parseTrack(track)));
          // Check if new track is saved
          this.controls.isTrackSaved(track.id);
        }

        // Check for new album
        if (track && track.album && track.album.id !== this.album.id) {
          this.store.dispatch(new ChangeAlbum(parseAlbum(track.album)));
        }

        // Check for new playlist
        if (playback.context && playback.context.type && playback.context.type === 'playlist') {
          const playlistId = getIdFromSpotifyUri(playback.context.uri);
          if (!this.playlist || this.playlist.id !== playlistId) {
            // Retrieve new playlist
            this.controls.setPlaylist(playlistId);
          }
        } else if (this.playlist) {
          // No longer playing a playlist, update if we previously were
          this.store.dispatch(new ChangePlaylist(null));
        }

        // Check if volume was muted externally to save previous value
        if (playback.device && playback.device.volume_percent === 0 && this.device.volume > 0) {
          this.storage.set(PREVIOUS_VOLUME, this.device.volume.toString());
        }

        // Get device changes
        if (playback.device) {
          // Check for new device
          if (playback.device && playback.device.id !== this.device.id) {
            this.store.dispatch(new ChangeDevice(parseDevice(playback.device)));
          }

          // Update which device is active
          this.store.dispatch(new ChangeDeviceIsActive(playback.device.is_active));
          this.store.dispatch(new ChangeDeviceVolume(playback.device.volume_percent));
        }

        // Update remaining playback values
        this.store.dispatch(new SetProgress(playback.progress_ms));
        this.store.dispatch(new SetPlaying(playback.is_playing));
        this.store.dispatch(new SetShuffle(playback.shuffle_state));
        this.store.dispatch(new ChangeRepeatState(playback.repeat_state));
        this.store.dispatch(new SetPlayerState(PlayerState.Playing));
      } else {
        this.store.dispatch(new SetPlayerState(PlayerState.Idling));
      }
      // else locked
      // update progress to current + pollingInterval
    });
  }
}
