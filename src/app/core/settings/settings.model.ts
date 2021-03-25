// Spotify Code options
export const BAR_COLOR_BLACK = 'black';
export const BAR_COLOR_WHITE = 'white';

export interface SettingsModel {
  theme: string;
  showSpotifyCode: boolean;
  spotifyCode: {
    backgroundColor: string;
    barColor: string;
  };
}

export const DEFAULT_SETTINGS: SettingsModel = {
  theme: 'light-theme',
  showSpotifyCode: true,
  spotifyCode: {
    backgroundColor: '24E07D',
    barColor: BAR_COLOR_BLACK
  }
};
