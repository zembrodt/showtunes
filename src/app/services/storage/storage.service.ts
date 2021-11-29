import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  static prefix = 'MUSIC_DISPLAY';

  constructor() { }

  get(key: string): string {
    const item = window.localStorage.getItem(this.getKey(key));
    if (item) {
      return item;
    }
    return null;
  }

  set(key: string, value: string): void {
    window.localStorage.setItem(this.getKey(key), value);
  }

  remove(key: string): void {
    window.localStorage.removeItem(this.getKey(key));
  }

  private getKey(key: string): string {
    return `${StorageService.prefix}_${key}`;
  }
}
