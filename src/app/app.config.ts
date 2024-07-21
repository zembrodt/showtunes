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
        this.loadDefaults();
        resolve();
      }).catch((response: any) => {
        reject(`Could not load file '${jsonFile}': ${JSON.stringify(response)}`);
      });
    });
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
}
