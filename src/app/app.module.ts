import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { NgxsModule } from '@ngxs/store';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppConfig } from './app.config';
import { AlbumDisplayComponent } from './components/album-display/album-display.component';

import { AppComponent } from './components/app/app.component';
import { CallbackComponent } from './components/callback/callback.component';
import { ColorPickerComponent } from './components/color-picker/color-picker.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DevicesComponent } from './components/devices/devices.component';
import { ErrorComponent } from './components/error/error.component';
import { LoadingComponent } from './components/loading/loading.component';
import { LoginComponent } from './components/login/login.component';
import { HelpDialogComponent } from './components/settings-menu/help-dialog/help-dialog.component';
import { SettingsMenuComponent } from './components/settings-menu/settings-menu.component';
import { TrackPlayerControlsComponent } from './components/track-player/track-player-controls/track-player-controls.component';
import { TrackPlayerProgressComponent } from './components/track-player/track-player-progress/track-player-progress.component';
import { TrackPlayerComponent } from './components/track-player/track-player.component';
import { AUTH_STATE_NAME } from './core/auth/auth.model';
import { AuthState } from './core/auth/auth.state';
import { PlaybackState } from './core/playback/playback.state';
import { SETTINGS_STATE_NAME } from './core/settings/settings.model';
import { SettingsState } from './core/settings/settings.state';
import { MaterialModule } from './modules/material.module';
import { InactivityService } from './services/inactivity/inactivity.service';
import { PlaybackService } from './services/playback/playback.service';
import { SpotifyAuthService } from './services/spotify/auth/spotify-auth.service';
import { SpotifyControlsService } from './services/spotify/controls/spotify-controls.service';
import { SpotifyPollingService } from './services/spotify/polling/spotify-polling.service';
import { SpotifyInterceptor } from './services/spotify/interceptor/spotify.interceptor';
import { StorageService } from './services/storage/storage.service';

export function initializeApp(appConfig: AppConfig): () => Promise<void> {
  return () => appConfig.load();
}

@NgModule({
  declarations: [
    AppComponent,
    AlbumDisplayComponent,
    CallbackComponent,
    ColorPickerComponent,
    DashboardComponent,
    DevicesComponent,
    ErrorComponent,
    HelpDialogComponent,
    LoadingComponent,
    LoginComponent,
    SettingsMenuComponent,
    TrackPlayerComponent,
    TrackPlayerControlsComponent,
    TrackPlayerProgressComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    MaterialModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    FontAwesomeModule,
    FormsModule,
    NgxsModule.forRoot(
      [ AuthState, PlaybackState, SettingsState ],
      { developmentMode: !environment.production }
      ),
    NgxsStoragePluginModule.forRoot({
      key: [ AUTH_STATE_NAME, SETTINGS_STATE_NAME ],
      afterDeserialize: (obj: any, key: string) => {
        if (key === AUTH_STATE_NAME && obj.token && obj.token.expiry) {
          return {
            ...obj,
            token: {
              ...obj.token,
              expiry: new Date(obj.token.expiry)
            }
          };
        }
        return obj;
      }
    }),
    NgxsReduxDevtoolsPluginModule.forRoot({
      disabled: environment.production
    })
  ],
  providers: [
    AppConfig,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ AppConfig ],
      multi: true
    },
    InactivityService,
    StorageService,
    SpotifyAuthService,
    SpotifyControlsService,
    SpotifyPollingService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SpotifyInterceptor,
      multi: true
    },
    PlaybackService,
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
