import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { IAppConfig } from './models/app-config.model';

@Injectable()
export class AppConfig {
  static settings: IAppConfig;

  private static readonly idlePollingDefault = 3000;
  private static readonly playbackPollingDefault = 1000;
  private static readonly expiryThresholdDefault = 0;

  constructor(private http: HttpClient) {}

  load(): Promise<void> {
    const jsonFile = `assets/config/config.${environment.name}.json`;
    return new Promise<void>((resolve, reject) => {
      this.http.get(jsonFile).toPromise().then((response: IAppConfig) => {
        AppConfig.settings = response as IAppConfig;
        this.checkTypes();
        this.loadDefaults();
        resolve();
      }).catch((response: any) => {
        reject(`Could not load file '${jsonFile}': ${JSON.stringify(response)}`);
      });
    });
  }

  private checkTypes(): void {
    AppConfig.settings.env.idlePolling = this.parseInt(AppConfig.settings.env.idlePolling);
    AppConfig.settings.env.playbackPolling = this.parseInt(AppConfig.settings.env.playbackPolling);
    AppConfig.settings.auth.forcePkce = this.parseBoolean(AppConfig.settings.auth.forcePkce);
    AppConfig.settings.auth.showDialog = this.parseBoolean(AppConfig.settings.auth.showDialog);
    AppConfig.settings.auth.expiryThreshold = this.parseInt(AppConfig.settings.auth.expiryThreshold);
  }

  private loadDefaults(): void {
    if (AppConfig.settings.env.idlePolling == null) {
      AppConfig.settings.env.idlePolling = AppConfig.idlePollingDefault;
    }
    if (AppConfig.settings.env.playbackPolling == null) {
      AppConfig.settings.env.playbackPolling = AppConfig.playbackPollingDefault;
    }
    if (AppConfig.settings.auth.expiryThreshold == null) {
      AppConfig.settings.auth.expiryThreshold = AppConfig.expiryThresholdDefault;
    }
  }

  private parseInt(valueRaw: any): number {
    if (valueRaw != null) {
      if (typeof valueRaw === 'number') {
        return valueRaw;
      } else if (typeof valueRaw === 'string') {
        const value = parseInt(valueRaw, 10);
        if (!isNaN(value)) {
          return value;
        }
      }
    }
    return null;
  }

  private parseBoolean(valueRaw: any): boolean {
    if (valueRaw != null) {
      if (typeof valueRaw === 'boolean') {
        return valueRaw;
      } else if (typeof valueRaw === 'string') {
        return valueRaw.toLowerCase() === 'true';
      }
    }
    return false;
  }
}
