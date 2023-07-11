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
    const state = ctx.getState();
    this.updateOverlayContainer(state.theme, state.customAccentColor, state.dynamicAccentColor);
  }

  @Action(ChangeTheme)
  changeTheme(ctx: StateContext<SettingsModel>, action: ChangeTheme): void {
    const state = ctx.getState();
    this.updateOverlayContainer(action.theme, state.customAccentColor, state.dynamicAccentColor);
    ctx.patchState({theme: action.theme});
  }

  @Action(ChangeCustomAccentColor)
  changeCustomAccentColor(ctx: StateContext<SettingsModel>, action: ChangeCustomAccentColor): void {
    const state = ctx.getState();
    this.updateOverlayContainer(state.theme, action.customAccentColor, state.dynamicAccentColor);
    ctx.patchState({customAccentColor: action.customAccentColor});
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
    const state = ctx.getState();
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
    this.updateOverlayContainer(state.theme, state.customAccentColor, ctx.getState().dynamicAccentColor);
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
    this.updateOverlayContainer(state.theme, state.customAccentColor, ctx.getState().dynamicAccentColor);
  }

  @Action(ChangeDynamicAccentColor)
  changeDynamicAccentColor(ctx: StateContext<SettingsModel>, action: ChangeDynamicAccentColor): void {
    const state = ctx.getState();
    this.updateOverlayContainer(state.theme, state.customAccentColor, action.dynamicAccentColor);
    ctx.patchState({dynamicAccentColor: action.dynamicAccentColor});
  }

  /**
   * Updates the theme class on the overlayContainer
   * @param theme the standard theme (light/dark)
   * @param customTheme a custom accent color for the theme
   * @param dynamicTheme a dynamic accent color for the theme (overwrites the custom color)
   * @private
   */
  private updateOverlayContainer(theme: string, customTheme: string, dynamicTheme: string): void {
    const classList = this.overlayContainer.getContainerElement().classList;
    const toRemove = Array.from(classList).filter((item: string) =>
      item.includes('-theme')
    );
    if (toRemove.length > 0) {
      classList.remove(...toRemove);
    }
    let additionalTheme = dynamicTheme;
    if (!additionalTheme) {
      additionalTheme = customTheme;
    }
    classList.add(additionalTheme ? `${additionalTheme}-${theme}` : theme);
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
