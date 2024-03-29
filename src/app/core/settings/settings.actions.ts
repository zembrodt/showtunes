import { DominantColor } from '../dominant-color/dominant-color-finder';
import { PlayerControlsOptions } from './settings.model';

const SETTINGS_ACTION_NAME = '[Settings]';

export class ChangeTheme {
  static readonly type = `${SETTINGS_ACTION_NAME} Change Theme`;
  constructor(public theme: string) {}
}

export class ChangeCustomAccentColor {
  static readonly type = `${SETTINGS_ACTION_NAME} Change Custom Accent Color`;
  constructor(public customAccentColor: string) {}
}

export class ChangePlayerControls {
  static readonly type = `${SETTINGS_ACTION_NAME} Change Player Controls`;
  constructor(public option: PlayerControlsOptions) {}
}
export class TogglePlaylistName {
  static readonly type = `${SETTINGS_ACTION_NAME} Toggle Playlist Name`;
}

export class ToggleSpotifyCode {
  static readonly type = `${SETTINGS_ACTION_NAME} Toggle Spotify Code`;
}

export class ToggleDynamicCodeColor {
  static readonly type = `${SETTINGS_ACTION_NAME} Toggle Dynamic Code Color`;
}

export class ChangeDynamicColor {
  static readonly type = `${SETTINGS_ACTION_NAME} Change Dynamic Color`;
  constructor(public dynamicColor: DominantColor) {}
}

export class ChangeSpotifyCodeBackgroundColor {
  static readonly type = `${SETTINGS_ACTION_NAME} Change Spotify Code Background Color`;
  constructor(public backgroundColor: string) {}
}

export class ChangeSpotifyCodeBarColor {
  static readonly type = `${SETTINGS_ACTION_NAME} Change Spotify Code Bar Color`;
  constructor(public barColor: string) {}
}

export class ToggleDynamicThemeAccent {
  static readonly type = `${SETTINGS_ACTION_NAME} Toggle Dynamic Theme Accent`;
}

export class ChangeDynamicAccentColor {
  static readonly type = `${SETTINGS_ACTION_NAME} Change Dynamic Accent Color`;
  constructor(public dynamicAccentColor: string) {}
}
