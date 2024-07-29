import { OverlayContainer } from '@angular/cdk/overlay';
import { Injectable } from '@angular/core';
import { Action, NgxsOnInit, Selector, State, StateContext } from '@ngxs/store';
import { DominantColor } from '../dominant-color/dominant-color-finder';
import { calculateColorDistance, Color, isHexColor } from '../util';
import {
  ChangeCustomAccentColor,
  ChangeDynamicAccentColor,
  ChangeDynamicColor,
  ChangePlayerControls,
  ChangeSpotifyCodeBackgroundColor,
  ChangeSpotifyCodeBarColor,
  ChangeTheme,
  ToggleDynamicThemeAccent,
  TogglePlaylistName,
  ToggleDynamicCodeColor,
  ToggleSpotifyCode
} from './settings.actions';
import { DEFAULT_SETTINGS, DYNAMIC_THEME_COLORS, PlayerControlsOptions, SETTINGS_STATE_NAME, SettingsModel } from './settings.model';

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
  static customAccentColor(state: SettingsModel): string {
    return state.customAccentColor;
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
  static useDynamicCodeColor(state: SettingsModel): boolean {
    return state.useDynamicCodeColor;
  }

  @Selector()
  static dynamicColor(state: SettingsModel): DominantColor {
    return state.dynamicColor;
  }

  @Selector()
  static spotifyCodeBackgroundColor(state: SettingsModel): string {
    return state.spotifyCode.backgroundColor;
  }

  @Selector()
  static spotifyCodeBarColor(state: SettingsModel): string {
    return state.spotifyCode.barColor;
  }

  @Selector()
  static useDynamicThemeAccent(state: SettingsModel): boolean {
    return state.useDynamicThemeAccent;
  }

  @Selector()
  static dynamicAccentColor(state: SettingsModel): string {
    return state.dynamicAccentColor;
  }

  ngxsOnInit(ctx: StateContext<SettingsModel>): void {
    this.updateOverlayContainer(ctx.getState());
  }

  @Action(ChangeTheme)
  changeTheme(ctx: StateContext<SettingsModel>, action: ChangeTheme): void {
    ctx.patchState({theme: action.theme});
    this.updateOverlayContainer(ctx.getState());
  }

  @Action(ChangeCustomAccentColor)
  changeCustomAccentColor(ctx: StateContext<SettingsModel>, action: ChangeCustomAccentColor): void {
    ctx.patchState({customAccentColor: action.customAccentColor});
    this.updateOverlayContainer(ctx.getState());
  }

  @Action(ChangePlayerControls)
  changePlayerControls(ctx: StateContext<SettingsModel>, action: ChangePlayerControls): void {
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

  @Action(ToggleDynamicCodeColor)
  toggleDynamicCodeColor(ctx: StateContext<SettingsModel>): void {
    const state = ctx.getState();
    ctx.patchState({useDynamicCodeColor: !state.useDynamicCodeColor});
  }

  @Action(ChangeDynamicColor)
  changeDynamicColor(ctx: StateContext<SettingsModel>, action: ChangeDynamicColor): void {
    ctx.patchState({dynamicColor: action.dynamicColor});
    if ((action.dynamicColor && isHexColor(action.dynamicColor.hex))) {
      ctx.patchState({
        dynamicColor: action.dynamicColor,
        dynamicAccentColor: this.calculateDynamicAccentColor(action.dynamicColor.rgb)
      });
    } else {
      ctx.patchState({
        dynamicColor: null,
        dynamicAccentColor: null
      });
    }
    this.updateOverlayContainer(ctx.getState());
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

  @Action(ToggleDynamicThemeAccent)
  toggleDynamicThemeAccent(ctx: StateContext<SettingsModel>): void {
    const state = ctx.getState();
    ctx.patchState({
      dynamicAccentColor: !state.useDynamicThemeAccent && state.dynamicColor !== null ?
        this.calculateDynamicAccentColor(state.dynamicColor.rgb) : null,
      useDynamicThemeAccent: !state.useDynamicThemeAccent,
    });
    this.updateOverlayContainer(ctx.getState());
  }

  @Action(ChangeDynamicAccentColor)
  changeDynamicAccentColor(ctx: StateContext<SettingsModel>, action: ChangeDynamicAccentColor): void {
    ctx.patchState({dynamicAccentColor: action.dynamicAccentColor});
    this.updateOverlayContainer(ctx.getState());
  }

  /**
   * Updates the theme class on the overlayContainer
   * @param state the current state
   * @private
   */
  private updateOverlayContainer(state: SettingsModel): void {
    const classList = this.overlayContainer.getContainerElement().classList;
    const toRemove = Array.from(classList).filter((item: string) =>
      item.includes('-theme')
    );
    if (toRemove.length > 0) {
      classList.remove(...toRemove);
    }
    if (state.theme !== null) {
      let theme = state.theme;
      if (state.useDynamicThemeAccent && state.dynamicAccentColor !== null) {
        theme = `${state.dynamicAccentColor}-${state.theme}`;
      }
      else if (state.customAccentColor !== null) {
        theme = `${state.customAccentColor}-${state.theme}`;
      }
      classList.add(theme);
    }
  }

  /**
   * Find the closest pre-defined theme color to the given color
   * @param color a {@link Color} object
   * @private
   */
  private calculateDynamicAccentColor(color: Color): string {
    let colorIndex: number = null;
    let closestColorValue: number = null;
    DYNAMIC_THEME_COLORS.forEach((dynamicColor, index) => {
      const distance = calculateColorDistance(color, dynamicColor.color);
      if (closestColorValue === null || distance < closestColorValue) {
        closestColorValue = distance;
        colorIndex = index;
      }
    });
    return colorIndex !== null ? DYNAMIC_THEME_COLORS[colorIndex].name : null;
  }
}
