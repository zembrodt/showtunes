import { capitalizeWords, Color, hexToRgb, isHexColor } from '../util';

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

export class CustomColor {
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

class DynamicColors {
  private readonly colors: CustomColor[];

  constructor(colors: CustomColor[]) {
    this.colors = colors;
  }

  getColors(): CustomColor[] {
    return this.colors;
  }
}

export const DYNAMIC_THEME_COLORS: DynamicColors = new DynamicColors([
  // A400 palette values
  new CustomColor('red', 'ff1744'),
  new CustomColor('pink', 'f50057'),
  new CustomColor('purple', 'd500f9'),
  new CustomColor('deep-purple', '651fff'),
  new CustomColor('indigo', '3d5afe'),
  new CustomColor('blue', '2979ff'),
  new CustomColor('light-blue', '00b0ff'),
  new CustomColor('cyan', '00e5ff'),
  new CustomColor('teal', '1de9b6'),
  new CustomColor('green', '00e676'),
  new CustomColor('light-green', '76ff03'),
  new CustomColor('lime', 'c6ff00'),
  new CustomColor('yellow', 'ffea00'),
  new CustomColor('amber', 'ffc400'),
  new CustomColor('orange', 'ff9100'),
  new CustomColor('deep-orange', 'ff3d00'),
  new CustomColor('brown', '8d6e63'),
  new CustomColor('gray', 'bdbdbd'),
  new CustomColor('blue-gray', '78909c'),
]);

export interface SettingsModel {
  theme: string;
  customAccentColor: string;
  showPlayerControls: PlayerControlsOptions;
  showPlaylistName: boolean;
  showSpotifyCode: boolean;
  useSmartCodeColor: boolean;
  smartColor: string;
  spotifyCode: {
    backgroundColor: string;
    barColor: string;
  };
  useDynamicThemeAccent: boolean;
  dynamicAccentColor: string;
}

export const DEFAULT_SETTINGS: SettingsModel = {
  theme: 'light-theme',
  customAccentColor: null,
  showPlayerControls: PlayerControlsOptions.On,
  showPlaylistName: true,
  showSpotifyCode: true,
  useSmartCodeColor: false,
  smartColor: null,
  spotifyCode: {
    backgroundColor: DEFAULT_CODE_COLOR,
    barColor: DEFAULT_BAR_CODE_COLOR
  },
  useDynamicThemeAccent: false,
  dynamicAccentColor: null
};
