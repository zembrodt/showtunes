import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MenuCloseReason } from '@angular/material/menu/menu';
import { Router } from '@angular/router';
import { faGithub } from '@fortawesome/free-brands-svg-icons/faGithub';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AppConfig } from '../../app.config';
import { LogoutAuth } from '../../core/auth/auth.actions';
import {
  ChangePlayerControls,
  ChangeSpotifyCodeBackgroundColor,
  ChangeSpotifyCodeBarColor,
  ChangeTheme,
  TogglePlaylistName,
  ToggleSmartCodeColor,
  ToggleSpotifyCode
} from '../../core/settings/settings.actions';
import { BAR_COLOR_BLACK, BAR_COLOR_WHITE, DEFAULT_SETTINGS, PlayerControlsOptions } from '../../core/settings/settings.model';
import { SettingsState } from '../../core/settings/settings.state';
import { isHexColor } from '../../core/util';
import { HelpDialogComponent } from './help-dialog/help-dialog.component';

const LIGHT_THEME = 'light-theme';
const DARK_THEME = 'dark-theme';

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
  @Select(SettingsState.showPlayerControls) showPlayerControls$: Observable<PlayerControlsOptions>;
  @Select(SettingsState.showPlaylistName) showPlaylistName$: Observable<boolean>;
  @Select(SettingsState.showSpotifyCode) showSpotifyCode$: Observable<boolean>;
  @Select(SettingsState.useSmartCodeColor) useSmartCodeColor$: Observable<boolean>;
  @Select(SettingsState.spotifyCodeBackgroundColor) backgroundColor$: Observable<string>;
  @Select(SettingsState.spotifyCodeBarColor) barColor$: Observable<string>;

  private currentTheme: string;
  private currentBarColor: string;

  smartCodeColorUrlSet = false;

  colorPickerResetEvent = new Subject<void>();

  // Template constants
  readonly menuItemSpacing = '12px';
  readonly githubIcon = faGithub;
  readonly playerControlsOff = PlayerControlsOptions.Off;
  readonly playerControlsOn = PlayerControlsOptions.On;
  readonly playerControlsFade = PlayerControlsOptions.Fade;

  constructor(private store: Store, private router: Router, public helpDialog: MatDialog) {}

  ngOnInit(): void {
    this.theme$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((theme) => this.currentTheme = theme);
    this.barColor$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((barColor) => this.currentBarColor = barColor);

    if (AppConfig.settings.env.albumColorUrl) {
      this.smartCodeColorUrlSet = true;
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  logout(): void {
    this.store.dispatch(new LogoutAuth());
    this.router.navigateByUrl('/login');
  }

  onMenuClose(close: MenuCloseReason): void {
    this.colorPickerResetEvent.next();
  }

  onDarkModeChange(): void {
    const theme = this.currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
    this.store.dispatch(new ChangeTheme(theme));
  }

  onShowPlayerControlsChange(change: MatButtonToggleChange): void {
    this.store.dispatch(new ChangePlayerControls(change.value));
  }

  onShowPlaylistNameChange(): void {
    this.store.dispatch(new TogglePlaylistName());
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
    if (isHexColor(change)) {
      this.store.dispatch(new ChangeSpotifyCodeBackgroundColor(change));
    }
  }

  openHelpDialog(): void {
    this.helpDialog.open(HelpDialogComponent, {
      width: '90%',
      data: {
        version: environment.version,
        githubIcon: this.githubIcon,
        year: new Date().getFullYear(),
        isLightTheme: this.currentTheme === LIGHT_THEME
      }
    });
  }
}
