// Spotify Code options
export const BAR_COLOR_BLACK = 'black';
export const BAR_COLOR_WHITE = 'white';

export const DEFAULT_OPTIONS: IUserSettings = {
  isDarkMode: false,
  showSpotifyCode: true,
  spotifyCode: {
    backgroundColor: '24E07D',
    barColor: BAR_COLOR_BLACK
  }
};

export function isValidBarColor(barCodeColor: string): boolean {
  return barCodeColor === BAR_COLOR_BLACK || barCodeColor === BAR_COLOR_WHITE;
}

export function isValidHexColor(codeColor: string): boolean {
  return /^#?[0-9A-F]{6}$/i.test(codeColor);
}

export interface IUserSettings {
  isDarkMode: boolean;
  showSpotifyCode: boolean;
  spotifyCode: {
    backgroundColor: string;
    barColor: string;
  };
}
