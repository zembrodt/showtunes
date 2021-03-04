import { Injectable } from '@angular/core';
import {Observable, of} from 'rxjs';

const DARK_MODE = 'DARK_MODE';

@Injectable({
  providedIn: 'root'
})
export class DarkModeService {

  private isDarkMode = false;

  constructor() {
    const savedIsDarkMode = window.localStorage.getItem(DARK_MODE);
    if (savedIsDarkMode !== null) {
      this.isDarkMode = (savedIsDarkMode === 'true' ? true : false);
    }
  }

  getDarkMode(): boolean { // Observable<boolean> {
    // return of(this.isDarkMode);
    return this.isDarkMode;
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    window.localStorage.setItem(DARK_MODE, this.isDarkMode ? 'true' : 'false');
  }
}
