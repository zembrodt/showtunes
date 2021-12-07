// Spotify Code options
export const BAR_COLOR_BLACK = 'black';
export const BAR_COLOR_WHITE = 'white';
export const DEFAULT_CODE_COLOR = '24E07D';
export const DEFAULT_BAR_CODE_COLOR = BAR_COLOR_BLACK;

export interface SettingsModel {
  theme: string;
  showPlayerControls: boolean;
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
  showPlayerControls: true,
  showPlaylistName: true,
  showSpotifyCode: true,
  useSmartCodeColor: false,
  spotifyCode: {
    backgroundColor: DEFAULT_CODE_COLOR,
    barColor: DEFAULT_BAR_CODE_COLOR
  }
};
