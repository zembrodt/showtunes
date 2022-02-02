import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { ImageResponse } from '../../models/image.model';
import {
  ChangeAlbum,
  ChangeDevice,
  ChangeDeviceIsActive,
  ChangeDeviceVolume,
  ChangePlaylist,
  ChangeRepeatState,
  ChangeTrack,
  SetAvailableDevices,
  SetIdle,
  SetLiked,
  SetPlaying,
  SetProgress,
  SetShuffle
} from './playback.actions';
import { AlbumModel, DEFAULT_PLAYBACK, DeviceModel, PLAYBACK_STATE_NAME, PlaybackModel, PlaylistModel, TrackModel } from './playback.model';

@State<PlaybackModel>({
  name: PLAYBACK_STATE_NAME,
  defaults: DEFAULT_PLAYBACK
})
@Injectable()
export class PlaybackState {
  constructor() { }

  @Selector()
  static track(state: PlaybackModel): TrackModel {
    return state.track;
  }

  @Selector()
  static album(state: PlaybackModel): AlbumModel {
    return state.album;
  }

  @Selector()
  static playlist(state: PlaybackModel): PlaylistModel {
    return state.playlist;
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
    return state.track.duration;
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

  @Action(ChangeTrack)
  changeTrack(ctx: StateContext<PlaybackModel>, action: ChangeTrack): void {
    ctx.patchState({track: action.track});
  }

  @Action(ChangeAlbum)
  changeAlbum(ctx: StateContext<PlaybackModel>, action: ChangeAlbum): void {
    ctx.patchState({album: action.album});
  }

  @Action(ChangePlaylist)
  changePlaylist(ctx: StateContext<PlaybackModel>, action: ChangePlaylist): void {
    ctx.patchState({playlist: action.playlist});
  }

  @Action(ChangeDevice)
  changeDevice(ctx: StateContext<PlaybackModel>, action: ChangeDevice): void {
    ctx.patchState({device: action.device});
  }

  @Action(ChangeDeviceVolume)
  changeDeviceVolume(ctx: StateContext<PlaybackModel>, action: ChangeDeviceVolume): void {
    const device = ctx.getState().device;
    ctx.patchState({device: {...device, volume: action.volume}});
  }

  @Action(ChangeDeviceIsActive)
  changeDeviceIsActive(ctx: StateContext<PlaybackModel>, action: ChangeDeviceIsActive): void {
    const device = ctx.getState().device;
    ctx.patchState({device: {...device, isActive: action.isActive}});
  }

  @Action(SetAvailableDevices)
  setAvailableDevices(ctx: StateContext<PlaybackModel>, action: SetAvailableDevices): void {
    ctx.patchState({availableDevices: action.devices});
  }

  @Action(SetProgress)
  setProgress(ctx: StateContext<PlaybackModel>, action: SetProgress): void {
    ctx.patchState({progress: action.progress});
  }

  @Action(SetPlaying)
  setPlaying(ctx: StateContext<PlaybackModel>, action: SetPlaying): void {
    ctx.patchState({isPlaying: action.isPlaying});
  }

  @Action(SetShuffle)
  setShuffle(ctx: StateContext<PlaybackModel>, action: SetShuffle): void {
    ctx.patchState({isShuffle: action.isShuffle});
  }

  @Action(ChangeRepeatState)
  changeRepeat(ctx: StateContext<PlaybackModel>, action: ChangeRepeatState): void {
    ctx.patchState({repeatState: action.repeatState});
  }

  @Action(SetLiked)
  setLiked(ctx: StateContext<PlaybackModel>, action: SetLiked): void {
    ctx.patchState({isLiked: action.isLiked});
  }

  @Action(SetIdle)
  setIdle(ctx: StateContext<PlaybackModel>, action: SetIdle): void {
    ctx.patchState({isIdle: action.isIdle});
  }
}
