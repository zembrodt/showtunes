const SETTINGS_ACTION_NAME = '[Settings]';

export class ChangeTheme {
  static readonly type = `${SETTINGS_ACTION_NAME} Change Theme`;
  constructor(public theme: string) {}
}

export class TogglePlayerControls {
  static readonly type = `${SETTINGS_ACTION_NAME} Toggle Player Controls`;
}
export class TogglePlaylistName {
  static readonly type = `${SETTINGS_ACTION_NAME} Toggle Playlist Name`;
}

export class ToggleSpotifyCode {
  static readonly type = `${SETTINGS_ACTION_NAME} Toggle Spotify Code`;
}

export class ToggleSmartCodeColor {
  static readonly type = `${SETTINGS_ACTION_NAME} Toggle Smart Code Color`;
}

export class ChangeSpotifyCodeBackgroundColor {
  static readonly type = `${SETTINGS_ACTION_NAME} Change Spotify Code Background Color`;
  constructor(public backgroundColor: string) {}
}

export class ChangeSpotifyCodeBarColor {
  static readonly type = `${SETTINGS_ACTION_NAME} Change Spotify Code Bar Color`;
  constructor(public barColor: string) {}
}
