import {AlbumModel, DEFAULT_PLAYBACK, DeviceModel, PlaybackModel, TrackModel} from './playback.model';
import {Injectable} from '@angular/core';
import {Action, NgxsAfterBootstrap, Selector, State, StateContext} from '@ngxs/store';
import {ImageResponse} from '../../models/image.model';
import {
  ChangeAlbum,
  ChangeDevice, ChangeDeviceIsActive, ChangeDeviceVolume,
  ChangeProgress,
  ChangeRepeatState,
  ChangeTrack, GetAvailableDevices, PollCurrentPlayback, SetLiked, SkipNextTrack, SkipPreviousTrack,
  ToggleLiked,
  TogglePlaying,
  ToggleShuffle
} from './playback.actions';
import {SpotifyService} from '../../services/spotify/spotify.service';
import {tap} from 'rxjs/operators';
import {CurrentPlaybackResponse} from '../../models/current-playback.model';
import {parseAlbum, parseDevice, parseTrack} from '../util';
import {Observable} from 'rxjs';
import {MultipleDevicesResponse} from '../../models/device.model';

const SKIP_PREVIOUS_THRESHOLD = 3000; // ms

@State<PlaybackModel>({
  name: 'MUSIC_DISPLAY_PLAYBACK',
  defaults: DEFAULT_PLAYBACK
})
@Injectable()
export class PlaybackState implements NgxsAfterBootstrap {
  constructor(private spotifyService: SpotifyService) { }

  @Selector()
  static track(state: PlaybackModel): TrackModel {
    return state.track;
  }

  @Selector()
  static album(state: PlaybackModel): AlbumModel {
    return state.album;
  }

  @Selector()
  static covertArt(state: PlaybackModel): ImageResponse {
    return state.album.coverArt;
  }

  @Selector()
  static device(state: PlaybackModel): DeviceModel {
    return state.device;
  }

  @Selector()
  static deviceVolume(state: PlaybackModel): number {
    return state.device.volume;
  }

  @Selector()
  static availableDevices(state: PlaybackModel): DeviceModel[] {
    return state.availableDevices;
  }

  @Selector()
  static progress(state: PlaybackModel): number {
    return state.progress;
  }

  @Selector()
  static duration(state: PlaybackModel): number {
    return state.duration;
  }

  @Selector()
  static isPlaying(state: PlaybackModel): boolean {
    return state.isPlaying;
  }

  @Selector()
  static isShuffle(state: PlaybackModel): boolean {
    return state.isShuffle;
  }

  @Selector()
  static repeat(state: PlaybackModel): string {
    return state.repeatState;
  }

  @Selector()
  static isLiked(state: PlaybackModel): boolean {
    return state.isLiked;
  }

  @Selector()
  static isIdle(state: PlaybackModel): boolean {
    return state.isIdle;
  }

  ngxsAfterBootstrap(ctx: StateContext<PlaybackModel>): void {
    if (!SpotifyService.initialized && !SpotifyService.initialize()) {
      console.error('Failed to initialize spotify service');
    } else {
      // Initialize state?
    }
  }

  @Action(ChangeTrack)
  changeTrack(ctx: StateContext<PlaybackModel>, action: ChangeTrack): void {
    ctx.patchState({track: action.track, duration: action.duration});
  }

  @Action(ChangeAlbum)
  changeAlbum(ctx: StateContext<PlaybackModel>, action: ChangeAlbum): void {
    ctx.patchState({album: action.album});
  }

  @Action(ChangeDevice)
  changeDevice(ctx: StateContext<PlaybackModel>, action: ChangeDevice): Observable<any> {
    return this.spotifyService.setDevice(action.device.id).pipe(
      tap(res => {
        console.log('Set device response: ' + JSON.stringify(res));
        ctx.patchState({device: action.device});
      })
    );
  }

  @Action(ChangeDeviceVolume)
  changeDeviceVolume(ctx: StateContext<PlaybackModel>, action: ChangeDeviceVolume): Observable<any> {
    this.lockState(ctx);
    const device = ctx.getState().device;
    return this.spotifyService.setVolume(action.volume).pipe(
      tap(res => {
        ctx.patchState({device: {...device, volume: action.volume}});
        this.unlockState(ctx);
      })
    );
  }

  @Action(ChangeDeviceIsActive)
  changeDeviceIsActive(ctx: StateContext<PlaybackModel>, action: ChangeDeviceIsActive): void {
    const device = ctx.getState().device;
    ctx.patchState({device: {...device, isActive: action.isActive}});
  }

  @Action(GetAvailableDevices)
  getAvailableDevices(ctx: StateContext<PlaybackModel>): Observable<any> {
    return this.spotifyService.getDevices().pipe(
      tap((response: MultipleDevicesResponse) => {
        ctx.patchState({availableDevices: response.devices.map(device => parseDevice(device))});
      })
    );
  }

  @Action(ChangeProgress)
  changeProgress(ctx: StateContext<PlaybackModel>, action: ChangeProgress): Observable<any> {
    this.lockState(ctx);
    return this.spotifyService.setTrackPosition(action.progress).pipe(
      tap(res => {
        ctx.patchState({progress: action.progress});
        this.unlockState(ctx);
      })
    );
  }

  @Action(TogglePlaying)
  togglePlaying(ctx: StateContext<PlaybackModel>): Observable<any> {
    this.lockState(ctx);
    const isPlaying = ctx.getState().isPlaying;
    return this.spotifyService.setPlaying(!isPlaying).pipe(
      tap(res => {
        ctx.patchState({isPlaying: !isPlaying});
        this.unlockState(ctx);
      })
    );
  }

  @Action(SkipNextTrack)
  skipNextTrack(ctx: StateContext<PlaybackModel>): Observable<any> {
    console.log('Skipping to next track');
    this.lockState(ctx);
    return this.spotifyService.skipNext().pipe(
      tap(res => this.unlockState(ctx))
    );
  }

  @Action(SkipPreviousTrack)
  skipPreviousTrack(ctx: StateContext<PlaybackModel>): Observable<any> {
    // Restart the playback if outside the default threshold
    this.lockState(ctx);
    const state = ctx.getState();
    if (state.progress > SKIP_PREVIOUS_THRESHOLD && !((SKIP_PREVIOUS_THRESHOLD * 2) >= state.duration)) {
      console.log('Setting track position back to 0');
      return this.spotifyService.setTrackPosition(0).pipe(
        tap(res => this.unlockState(ctx))
      );
    } else {
      console.log('Skipping to previous track');
      return this.spotifyService.skipPrevious().pipe(
        tap(res => this.unlockState(ctx))
      );
    }
  }

  @Action(ToggleShuffle)
  toggleShuffle(ctx: StateContext<PlaybackModel>): Observable<any> {
    this.lockState(ctx);
    const isShuffle = ctx.getState().isShuffle;
    return this.spotifyService.toggleShuffle(!isShuffle).pipe(
      tap(res => {
        // TODO: check errors
        ctx.patchState({isShuffle: !isShuffle});
        this.unlockState(ctx);
      })
    );
  }

  @Action(ChangeRepeatState)
  changeRepeat(ctx: StateContext<PlaybackModel>, action: ChangeRepeatState): Observable<any> {
    this.lockState(ctx);
    return this.spotifyService.setRepeatState(action.repeatState).pipe(
      tap(res => {
        ctx.patchState({repeatState: action.repeatState});
        this.unlockState(ctx);
      })
    );
  }

  @Action(ToggleLiked)
  toggleLiked(ctx: StateContext<PlaybackModel>): Observable<any> {
    this.lockState(ctx);
    const isLiked = ctx.getState().isLiked;
    const track = ctx.getState().track;

    return this.spotifyService.setSavedTrack(track.id, !isLiked).pipe(
      tap(res => {
        ctx.patchState({isLiked: !isLiked});
        this.unlockState(ctx);
      })
    );
  }

  @Action(SetLiked)
  setLiked(ctx: StateContext<PlaybackModel>, action: SetLiked): void {
    ctx.patchState({isLiked: action.isLiked});
  }

  @Action(PollCurrentPlayback)
  pollCurrentPlayback(ctx: StateContext<PlaybackModel>, action: PollCurrentPlayback): Observable<any> {
    const state = ctx.getState();
    // check if another spotify service request is being executed
    if (!state.locked) {
      return this.spotifyService.getCurrentTrack().pipe(
        tap((currentPlayback: CurrentPlaybackResponse) => {
          if (currentPlayback && currentPlayback.item) {
            // check if we have a new track
            const track = currentPlayback.item;
            if (track.id !== state.track.id) {
              ctx.dispatch(new ChangeTrack(parseTrack(track), track.duration_ms));
              // Check status of if new track is saved
              this.spotifyService.isTrackSaved(track.id).pipe(
                tap((isSaved) => {
                  if (isSaved.length === 1) {
                    ctx.dispatch(new SetLiked(isSaved[0]));
                  }
                })
              );
            }
            // check if we have a new album
            if (track.album.id !== state.album.id) {
              ctx.dispatch(new ChangeAlbum(parseAlbum(track.album)));
            }
            // check if using a new device
            if (currentPlayback.device && currentPlayback.device.id !== state.device.id) {
              ctx.dispatch(new ChangeDevice(parseDevice(currentPlayback.device)));
            }
            // check all other items that can change during playback
            ctx.dispatch(new ChangeDeviceIsActive(currentPlayback.device.is_active));
            const device = ctx.getState().device;
            ctx.patchState({
              device: {...device, volume: currentPlayback.device.volume_percent},
              progress: currentPlayback.progress_ms,
              isPlaying: currentPlayback.is_playing,
              isShuffle: currentPlayback.shuffle_state,
              repeatState: currentPlayback.repeat_state
            });
            // set the playback to not be idling
            ctx.patchState({isIdle: false});
          } else {
            // Set the playback state to idling
            ctx.patchState({isIdle: true});
          }
        })// TODO: check if track has been liked here?
      );
    } else {
      ctx.patchState({progress: state.progress + action.interval});
      return null;
    }
  }

  private lockState(ctx: StateContext<PlaybackModel>): void {
    ctx.patchState({locked: true});
  }

  private unlockState(ctx: StateContext<PlaybackModel>): void {
    ctx.patchState({locked: false});
  }
}
