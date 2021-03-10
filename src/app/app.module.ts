import { APP_INITIALIZER } from '@angular/core';
import { AppConfig } from './app.config';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './components/app/app.component';
import { LoginComponent } from './components/login/login.component';
import { AppRoutingModule } from './app-routing.module';
import { CallbackComponent } from './components/callback/callback.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ColorPickerModule } from 'ngx-color-picker';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TrackPlayerComponent } from './components/track-player/track-player.component';
import { AlbumDisplayComponent } from './components/album-display/album-display.component';
import { MaterialModule } from './modules/material.module';
import { SettingsMenuComponent } from './components/options-menu/settings-menu.component';
import { ColorPickerComponent } from './components/color-picker/color-picker.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DevicesComponent } from './components/devices/devices.component';
import { StorageService } from './services/storage/storage.service';
import { StoreModule } from '@ngrx/store';

export function initializeApp(appConfig: AppConfig): () => Promise<void> {
  return () => appConfig.load();
}

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    CallbackComponent,
    DashboardComponent,
    TrackPlayerComponent,
    AlbumDisplayComponent,
    SettingsMenuComponent,
    ColorPickerComponent,
    DevicesComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    MaterialModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    ColorPickerModule,
    FontAwesomeModule,
    StoreModule.forRoot({}, {}),
  ],
  providers: [
    AppConfig,
    { provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppConfig],
      multi: true },
    StorageService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
