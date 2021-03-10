import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';
import {SettingsService} from '../../services/settings/settings.service';
import {BAR_COLOR_BLACK, BAR_COLOR_WHITE, DEFAULT_OPTIONS} from '../../models/user-settings.model';
import {MenuCloseReason} from '@angular/material/menu/menu';
import {Subject, Subscription} from 'rxjs';
import {isValidHex} from '../../core/util';

const ENABLED_COLOR = 'accent';
const DISABLED_COLOR = 'primary';

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

  private darkModeSubscription: Subscription;
  private showSpotifyCodeSubscription: Subscription;
  private spotifyCodeBackgroundColorSubscription: Subscription;
  private spotifyCodeBarColorSubscription: Subscription;

  darkModeIconColor: string;
  currentBackGroundColor: string;
  colorPickerToggle = false;

  colorPickerResetEvent: Subject<void> = new Subject<void>();

  isDarkMode = DEFAULT_OPTIONS.isDarkMode;
  showSpotifyCode = DEFAULT_OPTIONS.showSpotifyCode;
  backgroundColor = DEFAULT_OPTIONS.spotifyCode.backgroundColor;
  barColor = DEFAULT_OPTIONS.spotifyCode.barColor;

  constructor(private settingsService: SettingsService) { }

  ngOnInit(): void {
    this.currentBackGroundColor = this.backgroundColor;

    this.darkModeSubscription = this.settingsService
      .getDarkMode().subscribe(value => {
        console.log('SettingsMenuComponent: Retrieved new dark mode value: ' + value);
        this.isDarkMode = value;
        this.calculateIconColor();
      });

    this.showSpotifyCodeSubscription = this.settingsService
      .getShowSpotifyCode().subscribe(value => {
        console.log('SettingsMenuComponent: Retrieved new show spotify code value: ' + value);
        this.showSpotifyCode = value;
      });

    this.spotifyCodeBackgroundColorSubscription = this.settingsService
      .getSpotifyCodeBackgroundColor().subscribe(value => {
        console.log('SettingsMenuComponent: Retrieved new code background color: ' + value);
        this.backgroundColor = value;
      });

    this.spotifyCodeBarColorSubscription = this.settingsService
      .getSpotifyCodeBarColor().subscribe(value => {
        console.log('SettingsMenuComponent: Retrieved new code bar color: ' + value);
        this.barColor = value;
      });
  }

  ngOnDestroy(): void {
    this.darkModeSubscription.unsubscribe();
    this.showSpotifyCodeSubscription.unsubscribe();
    this.spotifyCodeBackgroundColorSubscription.unsubscribe();
    this.spotifyCodeBarColorSubscription.unsubscribe();
  }

  onMenuClose(close: MenuCloseReason): void {
    this.colorPickerResetEvent.next();
  }

  onDarkModeChange(): void {
    this.settingsService.toggleDarkMode();
  }

  private calculateIconColor(): void {
    if (this.isDarkMode) {
      this.darkModeIconColor = ENABLED_COLOR;
    } else {
      this.darkModeIconColor = DISABLED_COLOR;
    }
  }

  onShowBarCodeChange(): void {
    this.settingsService.toggleShowSpotifyCode();
  }

  isBarColorBlack(): boolean {
    return this.barColor === BAR_COLOR_BLACK;
  }

  onBarColorChange(): void {
    if (this.isBarColorBlack()) {
      this.settingsService.setSpotifyCodeBarColor(BAR_COLOR_WHITE);
    } else {
      this.settingsService.setSpotifyCodeBarColor(BAR_COLOR_BLACK);
    }
  }

  getPlaceholderColor(): string {
    return DEFAULT_OPTIONS.spotifyCode.backgroundColor;
  }

  getPresetColors(): string[] {
    return PRESET_COLORS;
  }

  onColorChange(change: string): void {
    if (isValidHex(change)) {
      this.settingsService.setSpotifyCodeBackgroundColor(change);
    }
  }
}
