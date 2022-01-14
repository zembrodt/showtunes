import { Injectable } from '@angular/core';
import { AUTH_STATE_NAME } from '../../core/auth/auth.model';

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

  removeAuthToken(): void {
    window.localStorage.removeItem(AUTH_STATE_NAME);
  }

  private getKey(key: string): string {
    if (key) {
      return `${StorageService.prefix}_${key.toUpperCase()}`;
    }
    return null;
  }
}
