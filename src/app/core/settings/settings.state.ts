import {Action, NgxsOnInit, Selector, State, StateContext} from '@ngxs/store';
import {Injectable} from '@angular/core';
import {
  ChangeTheme,
  ChangePlayerControls,
  TogglePlaylistName,
  ToggleSpotifyCode,
  ChangeSpotifyCodeBackgroundColor,
  ChangeSpotifyCodeBarColor,
  ToggleSmartCodeColor
} from './settings.actions';
import {DEFAULT_SETTINGS, PlayerControlsOptions, SETTINGS_STATE_NAME, SettingsModel} from './settings.model';
import {OverlayContainer} from '@angular/cdk/overlay';

@State<SettingsModel>({
  name: SETTINGS_STATE_NAME,
  defaults: DEFAULT_SETTINGS
})
@Injectable()
export class SettingsState implements NgxsOnInit {
  constructor(private overlayContainer: OverlayContainer) { }

  @Selector()
  static theme(state: SettingsModel): string {
    return state.theme;
  }

  @Selector()
  static showPlayerControls(state: SettingsModel): PlayerControlsOptions {
    return state.showPlayerControls;
  }

  @Selector()
  static showPlaylistName(state: SettingsModel): boolean {
    return state.showPlaylistName;
  }

  @Selector()
  static showSpotifyCode(state: SettingsModel): boolean {
    return state.showSpotifyCode;
  }

  @Selector()
  static useSmartCodeColor(state: SettingsModel): boolean {
    return state.useSmartCodeColor;
  }

  @Selector()
  static spotifyCodeBackgroundColor(state: SettingsModel): string {
    return state.spotifyCode.backgroundColor;
  }

  @Selector()
  static spotifyCodeBarColor(state: SettingsModel): string {
    return state.spotifyCode.barColor;
  }

  ngxsOnInit(ctx: StateContext<SettingsModel>): void {
    this.updateOverlayContainer(ctx.getState().theme);
  }

  @Action(ChangeTheme)
  changeTheme(ctx: StateContext<SettingsModel>, action: ChangeTheme): void {
    this.updateOverlayContainer(action.theme);
    ctx.patchState({theme: action.theme});
  }

  @Action(ChangePlayerControls)
  changePlayerControls(ctx: StateContext<SettingsModel>, action: ChangePlayerControls): void {
    console.log('Player controls updated: ' + action.option);
    ctx.patchState({showPlayerControls: action.option});
  }

  @Action(TogglePlaylistName)
  togglePlaylistName(ctx: StateContext<SettingsModel>): void {
    const state = ctx.getState();
    ctx.patchState({showPlaylistName: !state.showPlaylistName});
  }

  @Action(ToggleSpotifyCode)
  toggleSpotifyCode(ctx: StateContext<SettingsModel>): void {
    const state = ctx.getState();
    ctx.patchState({showSpotifyCode: !state.showSpotifyCode});
  }

  @Action(ToggleSmartCodeColor)
  toggleSmartCodeColor(ctx: StateContext<SettingsModel>): void {
    const state = ctx.getState();
    ctx.patchState({useSmartCodeColor: !state.useSmartCodeColor});
  }

  @Action(ChangeSpotifyCodeBackgroundColor)
  changeSpotifyCodeBackgroundColor(ctx: StateContext<SettingsModel>, action: ChangeSpotifyCodeBackgroundColor): void {
    const state = ctx.getState();
    ctx.patchState({spotifyCode: {...state.spotifyCode, backgroundColor: action.backgroundColor}});
  }

  @Action(ChangeSpotifyCodeBarColor)
  changeSpotifyCodeBarColor(ctx: StateContext<SettingsModel>, action: ChangeSpotifyCodeBarColor): void {
    const state = ctx.getState();
    ctx.patchState({spotifyCode: {...state.spotifyCode, barColor: action.barColor}});
  }

  private updateOverlayContainer(theme: string): void {
    const classList = this.overlayContainer.getContainerElement().classList;
    const toRemove = Array.from(classList).filter((item: string) =>
      item.includes('-theme')
    );
    if (toRemove.length > 0) {
      classList.remove(...toRemove);
    }
    classList.add(theme);
  }
}
