import {Action, NgxsOnInit, Selector, State, StateContext} from '@ngxs/store';
import {Injectable} from '@angular/core';
import {ChangeTheme, ToggleSpotifyCode, ChangeSpotifyCodeBackgroundColor, ChangeSpotifyCodeBarColor} from './settings.actions';
import {DEFAULT_SETTINGS, SettingsModel} from './settings.model';
import {OverlayContainer} from '@angular/cdk/overlay';

@State<SettingsModel>({
  name: 'MUSIC_DISPLAY_SETTINGS',
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
  static showSpotifyCode(state: SettingsModel): boolean {
    return state.showSpotifyCode;
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

  @Action(ToggleSpotifyCode)
  toggleSpotifyCode(ctx: StateContext<SettingsModel>): void {
    const state = ctx.getState();
    ctx.patchState({showSpotifyCode: !state.showSpotifyCode});
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
