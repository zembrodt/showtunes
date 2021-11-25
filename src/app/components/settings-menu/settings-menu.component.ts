import {Component, OnDestroy, OnInit} from '@angular/core';
import {BAR_COLOR_BLACK, BAR_COLOR_WHITE} from '../../core/settings/settings.model';
import {MenuCloseReason} from '@angular/material/menu/menu';
import {Observable, Subject, Subscription} from 'rxjs';
import {isValidHex} from '../../core/util';
import {SettingsState} from '../../core/settings/settings.state';
import {Select, Store} from '@ngxs/store';
import {
  ChangeSpotifyCodeBackgroundColor,
  ChangeSpotifyCodeBarColor,
  ChangeTheme, ToggleSmartCodeColor,
  ToggleSpotifyCode
} from '../../core/settings/settings.actions';
import {DEFAULT_SETTINGS} from '../../core/settings/settings.model';
import {takeUntil} from 'rxjs/operators';

const ENABLED_COLOR = 'accent';
const DISABLED_COLOR = 'primary';

const LIGHT_THEME = 'light-theme';
const DARK_THEME = 'dark-theme';
const THEMES = [LIGHT_THEME, DARK_THEME];

const PRESET_COLORS = [
  'FFFFFF', '010101', '3C94F0', '4B23F2', '2A48B4', '1A3366',
  '8FBBCA', '78E9D7', '240E7D', '273FEA', '368A7D', '0B664F',
  'AFE8BD', 'BAED54', 'FDBC59', 'F4DC31', 'F88D25', '84482F',
  'C18B7F', 'C87951', 'FC572C', 'FC2D29', 'F40D2F', '8D0732',
  'FEC1C9', 'B091C1', 'FB6C98', 'F91D9F', 'B31990', '543651'
];

@Component({
  selector: 'app-settings-menu',
  templateUrl: './settings-menu.component.html',
  styleUrls: ['./settings-menu.component.css']
})
export class SettingsMenuComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Select(SettingsState.theme) theme$: Observable<string>;
  @Select(SettingsState.showSpotifyCode) showSpotifyCode$: Observable<boolean>;
  @Select(SettingsState.useSmartCodeColor) useSmartCodeColor$: Observable<boolean>;
  @Select(SettingsState.spotifyCodeBackgroundColor) backgroundColor$: Observable<string>;
  @Select(SettingsState.spotifyCodeBarColor) barColor$: Observable<string>;

  private currentTheme: string;
  private currentBarColor: string;

  colorPickerResetEvent = new Subject<void>();

  constructor(private store: Store) { }

  ngOnInit(): void {
    this.theme$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((theme) => this.currentTheme = theme);
    this.barColor$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((barColor) => this.currentBarColor = barColor);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  onMenuClose(close: MenuCloseReason): void {
    this.colorPickerResetEvent.next();
  }

  onDarkModeChange(): void {
    const theme = this.currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
    this.store.dispatch(new ChangeTheme(theme));
  }

  onShowBarCodeChange(): void {
    this.store.dispatch(new ToggleSpotifyCode());
  }

  onUseSmartCodeColor(): void {
    this.store.dispatch(new ToggleSmartCodeColor());
  }

  onBarColorChange(): void {
    const barColor = this.currentBarColor === BAR_COLOR_BLACK ? BAR_COLOR_WHITE : BAR_COLOR_BLACK;
    this.store.dispatch(new ChangeSpotifyCodeBarColor(barColor));
  }

  getPlaceholderColor(): string {
    return DEFAULT_SETTINGS.spotifyCode.backgroundColor;
  }

  getPresetColors(): string[] {
    return PRESET_COLORS;
  }

  onColorChange(change: string): void {
    if (isValidHex(change)) {
      this.store.dispatch(new ChangeSpotifyCodeBackgroundColor(change));
    }
  }
}
