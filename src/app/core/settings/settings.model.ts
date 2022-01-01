export const SETTINGS_STATE_NAME = 'SHOWTUNES_SETTINGS';

// Spotify Code options
export const BAR_COLOR_BLACK = 'black';
export const BAR_COLOR_WHITE = 'white';
export const DEFAULT_CODE_COLOR = '24E07D';
export const DEFAULT_BAR_CODE_COLOR = BAR_COLOR_BLACK;

export enum PlayerControlsOptions {
  Off,
  Fade,
  On
}

export interface SettingsModel {
  theme: string;
  showPlayerControls: PlayerControlsOptions;
  showPlaylistName: boolean;
  showSpotifyCode: boolean;
  useSmartCodeColor: boolean;
  spotifyCode: {
    backgroundColor: string;
    barColor: string;
  };
}

export const DEFAULT_SETTINGS: SettingsModel = {
  theme: 'light-theme',
  showPlayerControls: PlayerControlsOptions.On,
  showPlaylistName: true,
  showSpotifyCode: true,
  useSmartCodeColor: false,
  spotifyCode: {
    backgroundColor: DEFAULT_CODE_COLOR,
    barColor: DEFAULT_BAR_CODE_COLOR
  }
};
