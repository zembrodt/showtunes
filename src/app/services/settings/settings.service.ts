import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DEFAULT_OPTIONS, isValidBarColor, isValidHexColor, IUserSettings} from '../../models/user-settings.model';
import {StorageService} from '../storage/storage.service';

const USER_OPTIONS = 'USER_OPTIONS';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private readonly settings: IUserSettings = DEFAULT_OPTIONS;

  private darkModeSub = new BehaviorSubject<boolean>(this.settings.isDarkMode);
  private showSpotifyCodeSub = new BehaviorSubject<boolean>(this.settings.showSpotifyCode);
  private spotifyCodeBackgroundColorSub = new BehaviorSubject<string>(this.settings.spotifyCode.backgroundColor);
  private spotifyCodeBarColorSub = new BehaviorSubject<string>(this.settings.spotifyCode.barColor);

  constructor(private storage: StorageService) {
    const savedOptions = this.storage.get(USER_OPTIONS);
    if (savedOptions !== null) {
      this.settings = JSON.parse(savedOptions);
      // Update with saved values
      this.darkModeSub.next(this.settings.isDarkMode);
      this.showSpotifyCodeSub.next(this.settings.showSpotifyCode);
      this.spotifyCodeBackgroundColorSub.next(this.settings.spotifyCode.backgroundColor);
      this.spotifyCodeBarColorSub.next(this.settings.spotifyCode.barColor);
    }
  }

  getDarkMode(): BehaviorSubject<boolean> {
    return this.darkModeSub;
  }

  toggleDarkMode(): void {
    this.settings.isDarkMode = !this.settings.isDarkMode;
    this.saveOptions();
    this.darkModeSub.next(this.settings.isDarkMode);
  }

  getShowSpotifyCode(): BehaviorSubject<boolean> {
    return this.showSpotifyCodeSub;
  }

  toggleShowSpotifyCode(): void {
    this.settings.showSpotifyCode = !this.settings.showSpotifyCode;
    this.saveOptions();
    this.showSpotifyCodeSub.next(this.settings.showSpotifyCode);
  }

  getSpotifyCodeBackgroundColor(): BehaviorSubject<string> {
    return this.spotifyCodeBackgroundColorSub;
  }

  setSpotifyCodeBackgroundColor(backgroundColor: string): void {
    if (isValidHexColor(backgroundColor) && backgroundColor.length > 1) {
      if (backgroundColor[0] === '#') {
        backgroundColor = backgroundColor.substring(1);
      }
      this.settings.spotifyCode.backgroundColor = backgroundColor;
      this.saveOptions();
      this.spotifyCodeBackgroundColorSub.next(backgroundColor);
    }
  }

  getSpotifyCodeBarColor(): BehaviorSubject<string> {
    return this.spotifyCodeBarColorSub;
  }

  setSpotifyCodeBarColor(barColor: string): void {
    if (isValidBarColor(barColor)) {
      this.settings.spotifyCode.barColor = barColor;
      this.saveOptions();
      this.spotifyCodeBarColorSub.next(barColor);
    } else {
      console.log('Invalid Spotify bar code color: \'' + barColor + '\'');
    }
  }

  private saveOptions(): void {
    this.storage.set(USER_OPTIONS, JSON.stringify(this.settings))
  }
}
