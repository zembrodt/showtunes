import { Injectable } from '@angular/core';
import { SPOTIFY_AUTH_STATE_NAME } from '../../core/spotify/auth/spotify-auth.model';

export const PREVIOUS_VOLUME = 'PREVIOUS_VOLUME';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  static readonly prefix = 'SHOWTUNES';

  constructor() { }

  get(key: string): string {
    return window.localStorage.getItem(this.getKey(key));
  }

  set(key: string, value: string): void {
    window.localStorage.setItem(this.getKey(key), value);
  }

  remove(key: string): void {
    window.localStorage.removeItem(this.getKey(key));
  }

  removeSpotifyAuthToken(): void {
    window.localStorage.removeItem(SPOTIFY_AUTH_STATE_NAME);
  }

  private getKey(key: string): string {
    if (key) {
      return `${StorageService.prefix}_${key.toUpperCase()}`;
    }
    return null;
  }
}
