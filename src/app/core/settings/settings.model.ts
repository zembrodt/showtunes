import { DominantColor } from '../dominant-color/dominant-color-finder';
import { capitalizeWords, Color, FontColor, hexToRgb, isHexColor } from '../util';

export const SETTINGS_STATE_NAME = 'SHOWTUNES_SETTINGS';

export enum Theme {
  Light = 'light-theme',
  Dark = 'dark-theme'
}

export enum PlayerControlsOptions {
  Off,
  Fade,
  On
}

export class ThemeColor {
  readonly name: string;
  readonly displayName: string;
  readonly hex: string;
  readonly color: Color;

  constructor(name: string, hexValue: string) {
    this.name = name;
    this.displayName = capitalizeWords(name, '-');
    if (isHexColor(hexValue)) {
      this.hex = hexValue;
      this.color = hexToRgb(hexValue);
    } else {
      console.error('Attempted to create DynamicColor with invalid hex value: ' + hexValue);
    }
  }
}

export const DYNAMIC_THEME_COLORS: ThemeColor[] = [
  // A400 palette values
  new ThemeColor('red', 'ff1744'),
  new ThemeColor('pink', 'f50057'),
  new ThemeColor('purple', 'd500f9'),
  new ThemeColor('deep-purple', '651fff'),
  new ThemeColor('indigo', '3d5afe'),
  new ThemeColor('blue', '2979ff'),
  new ThemeColor('light-blue', '00b0ff'),
  new ThemeColor('cyan', '00e5ff'),
  new ThemeColor('teal', '1de9b6'),
  new ThemeColor('green', '00e676'),
  new ThemeColor('light-green', '76ff03'),
  new ThemeColor('lime', 'c6ff00'),
  new ThemeColor('yellow', 'ffea00'),
  new ThemeColor('amber', 'ffc400'),
  new ThemeColor('orange', 'ff9100'),
  new ThemeColor('deep-orange', 'ff3d00'),
  new ThemeColor('brown', '8d6e63'),
  new ThemeColor('gray', 'bdbdbd'),
  new ThemeColor('blue-gray', '78909c'),
];

export interface SettingsModel {
  theme: string;
  customAccentColor: string;
  showPlayerControls: PlayerControlsOptions;
  showPlaylistName: boolean;
  showSpotifyCode: boolean;
  useDynamicCodeColor: boolean;
  dynamicColor: DominantColor;
  spotifyCode: {
    backgroundColor: string;
    barColor: string;
  };
  useDynamicThemeAccent: boolean;
  dynamicAccentColor: string;
}

export const DEFAULT_SETTINGS: SettingsModel = {
  theme: Theme.Light,
  customAccentColor: null,
  showPlayerControls: PlayerControlsOptions.On,
  showPlaylistName: true,
  showSpotifyCode: true,
  useDynamicCodeColor: false,
  dynamicColor: null,
  spotifyCode: {
    backgroundColor: '24E07D',
    barColor: FontColor.Black
  },
  useDynamicThemeAccent: false,
  dynamicAccentColor: null
};
