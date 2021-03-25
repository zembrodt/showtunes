export class ChangeTheme {
  static readonly type = '[Settings] Change Theme';
  constructor(public theme: string) {}
}

export class ToggleSpotifyCode {
  static readonly type = '[Settings] Toggle Spotify Code';
}

export class ChangeSpotifyCodeBackgroundColor {
  static readonly type = '[Settings] Change Spotify Code Background Color';
  constructor(public backgroundColor: string) {}
}

export class ChangeSpotifyCodeBarColor {
  static readonly type = '[Settings] Change Spotify Code Bar Color';
  constructor(public barColor: string) {}
}
