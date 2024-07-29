import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MenuCloseReason } from '@angular/material/menu/menu';
import { faGithub } from '@fortawesome/free-brands-svg-icons/faGithub';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ChangeCustomAccentColor,
  ChangePlayerControls,
  ChangeSpotifyCodeBackgroundColor,
  ChangeSpotifyCodeBarColor,
  ChangeTheme,
  ToggleDynamicCodeColor,
  ToggleDynamicThemeAccent,
  TogglePlaylistName,
  ToggleSpotifyCode
} from '../../core/settings/settings.actions';
import { DEFAULT_SETTINGS, DYNAMIC_THEME_COLORS, PlayerControlsOptions, Theme, ThemeColor } from '../../core/settings/settings.model';
import { SettingsState } from '../../core/settings/settings.state';
import { FontColor, isHexColor } from '../../core/util';
import { SpotifyAuthService } from '../../services/spotify/auth/spotify-auth.service';
import { HelpDialogComponent } from './help-dialog/help-dialog.component';

@Component({
  selector: 'app-settings-menu',
  templateUrl: './settings-menu.component.html',
  styleUrls: ['./settings-menu.component.css']
})
export class SettingsMenuComponent implements OnInit, OnDestroy {
  private static readonly presetColors = [
    'FFFFFF', '010101', '3C94F0', '4B23F2', '2A48B4', '1A3366',
    '8FBBCA', '78E9D7', '240E7D', '273FEA', '368A7D', '0B664F',
    'AFE8BD', 'BAED54', 'FDBC59', 'F4DC31', 'F88D25', '84482F',
    'C18B7F', 'C87951', 'FC572C', 'FC2D29', 'F40D2F', '8D0732',
    'FEC1C9', 'B091C1', 'FB6C98', 'F91D9F', 'B31990', '543651'
  ];
  private ngUnsubscribe = new Subject();

  @Select(SettingsState.theme) theme$: Observable<string>;
  @Select(SettingsState.customAccentColor) customAccentColor$: Observable<string>;
  @Select(SettingsState.showPlayerControls) showPlayerControls$: Observable<PlayerControlsOptions>;
  @Select(SettingsState.showPlaylistName) showPlaylistName$: Observable<boolean>;
  @Select(SettingsState.showSpotifyCode) showSpotifyCode$: Observable<boolean>;
  @Select(SettingsState.useDynamicCodeColor) useDynamicCodeColor$: Observable<boolean>;
  @Select(SettingsState.spotifyCodeBackgroundColor) backgroundColor$: Observable<string>;
  @Select(SettingsState.spotifyCodeBarColor) barColor$: Observable<string>;
  @Select(SettingsState.useDynamicThemeAccent) useDynamicThemeAccent$: Observable<boolean>;

  private currentTheme: string;
  private currentBarColor: string;
  private useDynamicCodeColor: boolean;
  private useDynamicThemeAccent: boolean;

  showDynamicColorSettings = false;
  customAccentColor: ThemeColor = null;

  colorPickerResetEvent = new Subject<void>();

  // Template constants
  readonly menuItemSpacing = '12px';
  readonly githubIcon = faGithub;
  readonly lightTheme = Theme.Light;
  readonly darkTheme = Theme.Dark;
  readonly fontColorBlack = FontColor.Black;
  readonly playerControlsOff = PlayerControlsOptions.Off;
  readonly playerControlsOn = PlayerControlsOptions.On;
  readonly playerControlsFade = PlayerControlsOptions.Fade;
  readonly placeholderColor = DEFAULT_SETTINGS.spotifyCode.backgroundColor;
  readonly presetColors = SettingsMenuComponent.presetColors;
  readonly presetAccentColors = DYNAMIC_THEME_COLORS;

  constructor(
    private store: Store,
    private auth: SpotifyAuthService,
    public helpDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.theme$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((theme) => this.currentTheme = theme);
    this.customAccentColor$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((customAccentColor) => {
        if (customAccentColor !== null) {
          for (const presetColor of this.presetAccentColors) {
            if (presetColor.name === customAccentColor) {
              this.customAccentColor = presetColor;
              break;
            }
          }
        }
      });
    this.barColor$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((barColor) => this.currentBarColor = barColor);
    this.useDynamicCodeColor$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((useDynamicCodeColor) => {
        this.useDynamicCodeColor = useDynamicCodeColor;
        if (useDynamicCodeColor && !this.showDynamicColorSettings) {
          this.showDynamicColorSettings = true;
        }
      });
    this.useDynamicThemeAccent$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((useDynamicThemeAccent) => {
        this.useDynamicThemeAccent = useDynamicThemeAccent;
        if (useDynamicThemeAccent && !this.showDynamicColorSettings) {
          this.showDynamicColorSettings = true;
        }
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  logout(): void {
    this.auth.logout();
  }

  onMenuClose(close: MenuCloseReason): void {
    this.colorPickerResetEvent.next();
  }

  onDarkModeChange(): void {
    const theme = this.currentTheme === Theme.Dark ? Theme.Light : Theme.Dark;
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

  onShowDynamicColorSettings(): void {
    this.showDynamicColorSettings = !this.showDynamicColorSettings;
    if (!this.showDynamicColorSettings) {
      if (this.useDynamicCodeColor) {
        this.onUseDynamicCodeColor();
      }
      if (this.useDynamicThemeAccent) {
        this.onUseDynamicThemeAccent();
      }
    }
  }

  onUseDynamicCodeColor(): void {
    this.store.dispatch(new ToggleDynamicCodeColor());
  }

  onBarColorChange(): void {
    const barColor = this.currentBarColor === FontColor.Black ? FontColor.White : FontColor.Black;
    this.store.dispatch(new ChangeSpotifyCodeBarColor(barColor));
  }

  onColorChange(change: string): void {
    if (isHexColor(change)) {
      this.store.dispatch(new ChangeSpotifyCodeBackgroundColor(change));
    }
  }

  onUseDynamicThemeAccent(): void {
    this.store.dispatch(new ToggleDynamicThemeAccent());
  }

  onAccentColorChange(): void {
    let accentColor: string = null;
    if (this.customAccentColor) {
      accentColor = this.customAccentColor.name;
    }
    this.store.dispatch(new ChangeCustomAccentColor(accentColor));
  }

  openHelpDialog(): void {
    this.helpDialog.open(HelpDialogComponent, {
      width: '90%',
      data: {
        version: environment.version,
        githubIcon: this.githubIcon,
        year: new Date().getFullYear(),
        isLightTheme: this.currentTheme === Theme.Light
      }
    });
  }
}
