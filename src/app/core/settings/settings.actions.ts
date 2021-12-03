export class ChangeTheme {
  static readonly type = '[Settings] Change Theme';
  constructor(public theme: string) {}
}

export class TogglePlayerControls {
  static readonly type = '[Settings] Toggle Player Controls';
}
export class TogglePlaylistName {
  static readonly type = '[Settings] Toggle Playlist Name';
}

export class ToggleSpotifyCode {
  static readonly type = '[Settings] Toggle Spotify Code';
}

export class ToggleSmartCodeColor {
  static readonly type = '[Settings] Toggle Smart Code Color';
}

export class ChangeSpotifyCodeBackgroundColor {
  static readonly type = '[Settings] Change Spotify Code Background Color';
  constructor(public backgroundColor: string) {}
}

export class ChangeSpotifyCodeBarColor {
  static readonly type = '[Settings] Change Spotify Code Bar Color';
  constructor(public barColor: string) {}
}
