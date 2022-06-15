import { OverlayContainer } from '@angular/cdk/overlay';
import { Injectable } from '@angular/core';
import { Action, NgxsOnInit, Selector, State, StateContext } from '@ngxs/store';
import { calculateColorDistance, hexToRgb, isHexColor } from '../util';
import {
  ChangeCustomAccentColor,
  ChangeDynamicAccentColor,
  ChangePlayerControls,
  ChangeSmartColor,
  ChangeSpotifyCodeBackgroundColor,
  ChangeSpotifyCodeBarColor,
  ChangeTheme,
  ToggleDynamicThemeAccent,
  TogglePlaylistName,
  ToggleSmartCodeColor,
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
  static useSmartCodeColor(state: SettingsModel): boolean {
    return state.useSmartCodeColor;
  }

  @Selector()
  static smartColor(state: SettingsModel): string {
    return state.smartColor;
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

  @Action(ToggleSmartCodeColor)
  toggleSmartCodeColor(ctx: StateContext<SettingsModel>): void {
    const state = ctx.getState();
    ctx.patchState({useSmartCodeColor: !state.useSmartCodeColor});
  }

  @Action(ChangeSmartColor)
  changeSmartColor(ctx: StateContext<SettingsModel>, action: ChangeSmartColor): void {
    const state = ctx.getState();
    if ((state.useDynamicThemeAccent || state.useSmartCodeColor) && isHexColor(action.smartColor)) {
      ctx.patchState({smartColor: action.smartColor});
      if (state.useDynamicThemeAccent) {
        const dynamicColor = this.calculateDynamicAccentColor(action.smartColor);
        ctx.patchState({dynamicAccentColor: dynamicColor});
      }
    } else {
      ctx.patchState({
        smartColor: null,
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
      dynamicAccentColor: !state.useDynamicThemeAccent && state.smartColor !== null ?
        this.calculateDynamicAccentColor(state.smartColor) : null,
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

  private updateOverlayContainer(theme: string, customTheme: string, dynamicTheme: string): void {
    const classList = this.overlayContainer.getContainerElement().classList;
    const toRemove = Array.from(classList).filter((item: string) =>
      item.includes('-theme')
    );
    if (toRemove.length > 0) {
      classList.remove(...toRemove);
    }
    let additionalTheme = dynamicTheme;
    if (additionalTheme === null) {
      additionalTheme = customTheme;
    }
    classList.add(additionalTheme ? `${additionalTheme}-${theme}` : theme);
  }

  /**
   * Find the closest pre-defined theme color to the smart color
   */
  private calculateDynamicAccentColor(smartColor: string): string {
    const smartColorRgb = hexToRgb(smartColor);
    let colorIndex: number = null;
    let closestColorValue: number = null;
    DYNAMIC_THEME_COLORS.getColors().forEach((dynamicColor, index) => {
      const distance = calculateColorDistance(smartColorRgb, dynamicColor.color);
      if (closestColorValue === null || distance < closestColorValue) {
        closestColorValue = distance;
        colorIndex = index;
      }
    });
    return colorIndex !== null ? DYNAMIC_THEME_COLORS.getColors()[colorIndex].name : null;
  }
}
