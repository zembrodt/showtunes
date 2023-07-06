import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpClient } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, flushMicrotasks, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { FlexLayoutModule } from '@angular/flex-layout';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonToggle, MatButtonToggleChange, MatButtonToggleGroup, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonToggleHarness } from '@angular/material/button-toggle/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatOption } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatSlideToggle, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { NgxsModule, Store } from '@ngxs/store';
import { MockComponent, MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { AppConfig } from '../../app.config';
import {
  ChangePlayerControls,
  ChangeSpotifyCodeBackgroundColor,
  ChangeSpotifyCodeBarColor,
  ChangeTheme,
  TogglePlaylistName,
  ToggleSmartCodeColor,
  ToggleSpotifyCode
} from '../../core/settings/settings.actions';
import { BAR_COLOR_BLACK, BAR_COLOR_WHITE, DYNAMIC_THEME_COLORS, PlayerControlsOptions } from '../../core/settings/settings.model';
import { SettingsState } from '../../core/settings/settings.state';
import { NgxsSelectorMock } from '../../core/testing/ngxs-selector-mock';
import { cssRgbToHex } from '../../core/util';
import { SpotifyService } from '../../services/spotify/spotify.service';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
import { SettingsMenuComponent } from './settings-menu.component';

const THEME_INDEX = 0;
const CONTROLS_INDEX = 1;
const PLAYLIST_INDEX = 2;
const SHOW_CODE_INDEX = 3;
const SMART_COLOR_INDEX = 4;
const SMART_SETTINGS_INDEX = 5;
const BAR_COLOR_INDEX = 6;

const CONTROLS_OFF_INDEX = 0;
const CONTROLS_FADE_INDEX = 1;
const CONTROLS_ON_INDEX = 2;

const SMART_ACCENT_INDEX = 0;
const SMART_CODE_INDEX = 1;

const LOGOUT_INDEX = 0;
const HELP_INDEX = 1;

describe('SettingsMenuComponent', () => {
  const mockSelectors = new NgxsSelectorMock<SettingsMenuComponent>();
  let component: SettingsMenuComponent;
  let fixture: ComponentFixture<SettingsMenuComponent>;
  let loader: HarnessLoader;
  let rootLoader: HarnessLoader;
  let store: Store;
  let spotify: SpotifyService;
  let router: Router;

  let themeProducer: BehaviorSubject<string>;
  let customAccentColorProducer: BehaviorSubject<string>;
  let showPlayerControlsProducer: BehaviorSubject<PlayerControlsOptions>;
  let showPlaylistNameProducer: BehaviorSubject<boolean>;
  let showSpotifyCodeProducer: BehaviorSubject<boolean>;
  let useSmartCodeColorProducer: BehaviorSubject<boolean>;
  let backgroundColorProducer: BehaviorSubject<string>;
  let barColorProducer: BehaviorSubject<string>;
  let useDynamicThemeAccentProducer: BehaviorSubject<boolean>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        SettingsMenuComponent,
        MockComponent(ColorPickerComponent)
      ],
      imports: [
        BrowserAnimationsModule,
        FlexLayoutModule,
        FormsModule,
        MatButtonToggleModule,
        MatDialogModule,
        MatIconModule,
        MatMenuModule,
        MatSelectModule,
        MatSlideToggleModule,
        NgxsModule.forRoot([SettingsState], { developmentMode: true })
      ],
      providers: [
        MockProvider(Store),
        MockProvider(SpotifyService),
        MockProvider(Router),
        {
          provide: AppConfig,
          deps: [ MockProvider(HttpClient) ]
        }
      ]
    }).compileComponents();
    store = TestBed.inject(Store);
    spotify = TestBed.inject(SpotifyService);
    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(SettingsMenuComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);

    themeProducer = mockSelectors.defineNgxsSelector<string>(component, 'theme$');
    customAccentColorProducer = mockSelectors.defineNgxsSelector<string>(component, 'customAccentColor$');
    showPlayerControlsProducer = mockSelectors.defineNgxsSelector<PlayerControlsOptions>(component, 'showPlayerControls$');
    showPlaylistNameProducer = mockSelectors.defineNgxsSelector<boolean>(component, 'showPlaylistName$');
    showSpotifyCodeProducer = mockSelectors.defineNgxsSelector<boolean>(component, 'showSpotifyCode$');
    useSmartCodeColorProducer = mockSelectors.defineNgxsSelector<boolean>(component, 'useSmartCodeColor$');
    backgroundColorProducer = mockSelectors.defineNgxsSelector<string>(component, 'backgroundColor$');
    barColorProducer = mockSelectors.defineNgxsSelector<string>(component, 'barColor$');
    useDynamicThemeAccentProducer = mockSelectors.defineNgxsSelector<boolean>(component, 'useDynamicThemeAccent$');

    AppConfig.settings = {
      env: {
        spotifyApiUrl: null,
        albumColorUrl: null,
        name: null,
        domain: null
      },
      auth: null,
      logging: null
    };

    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the menu when the button is clicked', fakeAsync(() => {
    let button: MatButtonHarness;
    loader.getHarness(MatButtonHarness).then((harness) => button = harness);
    flushMicrotasks();
    expect(button).toBeTruthy();

    button.click();
    flushMicrotasks();

    let settings: MatMenuHarness;
    rootLoader.getHarness(MatMenuHarness).then((harness) => settings = harness);
    flushMicrotasks();

    expect(settings).toBeTruthy();

    let actualIsOpen = null;
    settings.isOpen().then((isOpen) => actualIsOpen = isOpen);
    flushMicrotasks();
    expect(actualIsOpen).toBeTrue();
  }));

  it('should display the theme toggle setting', fakeAsync(() => {
    openMenuHelper(loader);

    const items = fixture.debugElement.queryAll(By.css('.menu-item'));
    expect(items.length).toBeGreaterThanOrEqual(THEME_INDEX + 1);
    const theme = items[THEME_INDEX];
    expect(theme.query(By.directive(MatIcon)).nativeElement.textContent.trim()).toEqual('dark_mode');
    expect(theme.query(By.directive(MatSlideToggle))).toBeTruthy();
  }));

  it('should add the app-icon class to theme toggle when light theme', fakeAsync(() => {
    themeProducer.next('light-theme');
    fixture.detectChanges();
    openMenuHelper(loader);

    const theme = fixture.debugElement.queryAll(By.css('.menu-item'))[THEME_INDEX];
    expect(theme.query(By.directive(MatIcon)).classes['app-icon']).toBeTruthy();
  }));

  it('should not add the app-icon class to theme toggle when dark theme', fakeAsync(() => {
    themeProducer.next('dark-theme');
    fixture.detectChanges();
    openMenuHelper(loader);

    const theme = fixture.debugElement.queryAll(By.css('.menu-item'))[THEME_INDEX];
    expect(theme.query(By.directive(MatIcon)).classes['app-icon']).toBeFalsy();
  }));

  it('should set the theme icon color to null when light theme', fakeAsync(() => {
    themeProducer.next('light-theme');
    fixture.detectChanges();
    openMenuHelper(loader);

    const theme = fixture.debugElement.queryAll(By.css('.menu-item'))[THEME_INDEX];
    const icon = theme.query(By.directive(MatIcon)).componentInstance as MatIcon;
    expect(icon.color).toBeFalsy();
  }));

  it('should set the theme icon color to accent when dark theme', fakeAsync(() => {
    themeProducer.next('dark-theme');
    fixture.detectChanges();
    openMenuHelper(loader);

    const theme = fixture.debugElement.queryAll(By.css('.menu-item'))[THEME_INDEX];
    const icon = theme.query(By.directive(MatIcon)).componentInstance as MatIcon;
    expect(icon.color).toEqual('accent');
  }));

  it('should set theme toggle to uncheck when light theme', fakeAsync(() => {
    themeProducer.next('light-theme');
    fixture.detectChanges();
    openMenuHelper(loader);

    const theme = fixture.debugElement.queryAll(By.css('.menu-item'))[THEME_INDEX];
    const toggle = theme.query(By.directive(MatSlideToggle)).componentInstance as MatSlideToggle;
    expect(toggle.checked).toBeFalse();
  }));

  it('should set theme toggle to check when dark theme', fakeAsync(() => {
    themeProducer.next('dark-theme');
    fixture.detectChanges();
    openMenuHelper(loader);

    const theme = fixture.debugElement.queryAll(By.css('.menu-item'))[THEME_INDEX];
    const toggle = theme.query(By.directive(MatSlideToggle)).componentInstance as MatSlideToggle;
    expect(toggle.checked).toBeTrue();
  }));

  it('should set the theme toggle to primary color', fakeAsync(() => {
    openMenuHelper(loader);

    const theme = fixture.debugElement.queryAll(By.css('.menu-item'))[THEME_INDEX];
    const toggle = theme.query(By.directive(MatSlideToggle)).componentInstance as MatSlideToggle;
    expect(toggle.color).toEqual('primary');
  }));

  it('should call onDarkModeChange when theme toggle clicked', fakeAsync(() => {
    spyOn(component, 'onDarkModeChange');
    openMenuHelper(loader);

    const theme = fixture.debugElement.queryAll(By.css('.menu-item'))[THEME_INDEX];
    const toggle = theme.query(By.directive(MatSlideToggle));
    toggle.triggerEventHandler('toggleChange', null);
    fixture.detectChanges();
    expect(component.onDarkModeChange).toHaveBeenCalled();
  }));

  it('should stopPropagation when theme toggle clicked', fakeAsync(() => {
    const event = new Event('click');
    spyOn(event, 'stopPropagation');
    openMenuHelper(loader);

    const theme = fixture.debugElement.queryAll(By.css('.menu-item'))[THEME_INDEX];
    const toggle = theme.query(By.directive(MatSlideToggle));
    toggle.triggerEventHandler('click', event);
    fixture.detectChanges();
    expect(event.stopPropagation).toHaveBeenCalled();
  }));

  it('should display the player control option toggle group setting', fakeAsync(() => {
    openMenuHelper(loader);

    const items = fixture.debugElement.queryAll(By.css('.menu-item'));
    expect(items.length).toBeGreaterThanOrEqual(CONTROLS_INDEX + 1);
    const playerOptions = items[CONTROLS_INDEX];
    expect(playerOptions.query(By.directive(MatButtonToggleGroup))).toBeTruthy();
  }));

  it('should display the player control options', fakeAsync(() => {
    openMenuHelper(loader);

    const item = fixture.debugElement.queryAll(By.css('.menu-item'))[CONTROLS_INDEX];
    const playerOptions = item.query(By.directive(MatButtonToggleGroup));
    const buttons = playerOptions.queryAll(By.directive(MatButtonToggle));
    expect(buttons.length).toEqual(CONTROLS_ON_INDEX + 1);
    expect((buttons[CONTROLS_OFF_INDEX].componentInstance as MatButtonToggle).value).toEqual(PlayerControlsOptions.Off);
    expect(buttons[CONTROLS_OFF_INDEX].query(By.directive(MatIcon)).nativeElement.textContent.trim()).toEqual('play_disabled');
    expect((buttons[CONTROLS_FADE_INDEX].componentInstance as MatButtonToggle).value).toEqual(PlayerControlsOptions.Fade);
    expect(buttons[CONTROLS_FADE_INDEX].query(By.directive(MatIcon)).nativeElement.textContent.trim()).toEqual('play_circle_outline');
    expect((buttons[CONTROLS_ON_INDEX].componentInstance as MatButtonToggle).value).toEqual(PlayerControlsOptions.On);
    expect(buttons[CONTROLS_ON_INDEX].query(By.directive(MatIcon)).nativeElement.textContent.trim()).toEqual('play_circle_filled');
  }));

  it('should set player control group value to off when showPlayerControls is off', fakeAsync(() => {
    showPlayerControlsProducer.next(PlayerControlsOptions.Off);
    fixture.detectChanges();
    openMenuHelper(loader);

    const item = fixture.debugElement.queryAll(By.css('.menu-item'))[CONTROLS_INDEX];
    const playerOptions = item.query(By.directive(MatButtonToggleGroup));
    const off = playerOptions.queryAll(By.directive(MatButtonToggle))[CONTROLS_OFF_INDEX].componentInstance as MatButtonToggle;
    expect(off.checked).toBeTrue();
  }));

  it('should set player control group value to fade when showPlayerControls is fade', fakeAsync(() => {
    showPlayerControlsProducer.next(PlayerControlsOptions.Fade);
    fixture.detectChanges();
    openMenuHelper(loader);

    const item = fixture.debugElement.queryAll(By.css('.menu-item'))[CONTROLS_INDEX];
    const playerOptions = item.query(By.directive(MatButtonToggleGroup));
    const fade = playerOptions.queryAll(By.directive(MatButtonToggle))[CONTROLS_FADE_INDEX].componentInstance as MatButtonToggle;
    expect(fade.checked).toBeTrue();
  }));

  it('should set player control group value to fade when showPlayerControls is fade', fakeAsync(() => {
    showPlayerControlsProducer.next(PlayerControlsOptions.On);
    fixture.detectChanges();
    openMenuHelper(loader);

    const item = fixture.debugElement.queryAll(By.css('.menu-item'))[CONTROLS_INDEX];
    const playerOptions = item.query(By.directive(MatButtonToggleGroup));
    const on = playerOptions.queryAll(By.directive(MatButtonToggle))[CONTROLS_ON_INDEX].componentInstance as MatButtonToggle;
    expect(on.checked).toBeTrue();
  }));

  it('should call onShowPlayerControlsChange when player controls clicked', fakeAsync(() => {
    spyOn(component, 'onShowPlayerControlsChange');
    openMenuHelper(loader);

    const item = fixture.debugElement.queryAll(By.css('.menu-item'))[CONTROLS_INDEX];
    const playerOptions = item.query(By.directive(MatButtonToggleGroup));
    playerOptions.triggerEventHandler('change', null);
    expect(component.onShowPlayerControlsChange).toHaveBeenCalled();
  }));

  it('should stop propagation when player controls clicked', fakeAsync(() => {
    const event = new Event('click');
    spyOn(event, 'stopPropagation');
    openMenuHelper(loader);

    const item = fixture.debugElement.queryAll(By.css('.menu-item'))[CONTROLS_INDEX];
    const playerOptions = item.query(By.directive(MatButtonToggleGroup));
    playerOptions.triggerEventHandler('click', event);
    expect(event.stopPropagation).toHaveBeenCalled();
  }));

  it('should set player controls off when off button clicked', fakeAsync(() => {
    spyOn(component, 'onShowPlayerControlsChange');
    showPlayerControlsProducer.next(PlayerControlsOptions.On);
    fixture.detectChanges();
    openMenuHelper(loader);

    toggleHarnessAtIndexHelper(rootLoader, CONTROLS_OFF_INDEX);

    const toggle = fixture.debugElement.queryAll(By.directive(MatButtonToggle))[CONTROLS_OFF_INDEX].componentInstance as MatButtonToggle;
    expect(component.onShowPlayerControlsChange).toHaveBeenCalledWith(new MatButtonToggleChange(toggle, PlayerControlsOptions.Off));
  }));

  it('should set player controls to fade when fade button clicked', fakeAsync(() => {
    spyOn(component, 'onShowPlayerControlsChange');
    showPlayerControlsProducer.next(PlayerControlsOptions.On);
    fixture.detectChanges();
    openMenuHelper(loader);

    toggleHarnessAtIndexHelper(rootLoader, CONTROLS_FADE_INDEX);

    const toggle = fixture.debugElement.queryAll(By.directive(MatButtonToggle))[CONTROLS_FADE_INDEX].componentInstance as MatButtonToggle;
    expect(component.onShowPlayerControlsChange).toHaveBeenCalledWith(new MatButtonToggleChange(toggle, PlayerControlsOptions.Fade));
  }));

  it('should set player controls on when on button clicked', fakeAsync(() => {
    spyOn(component, 'onShowPlayerControlsChange');
    showPlayerControlsProducer.next(PlayerControlsOptions.Off);
    fixture.detectChanges();
    openMenuHelper(loader);

    toggleHarnessAtIndexHelper(rootLoader, CONTROLS_ON_INDEX);

    const toggle = fixture.debugElement.queryAll(By.directive(MatButtonToggle))[CONTROLS_ON_INDEX].componentInstance as MatButtonToggle;
    expect(component.onShowPlayerControlsChange).toHaveBeenCalledWith(new MatButtonToggleChange(toggle, PlayerControlsOptions.On));
  }));

  it('should display the playlist toggle setting', fakeAsync(() => {
    openMenuHelper(loader);

    const items = fixture.debugElement.queryAll(By.css('.menu-item'));
    expect(items.length).toBeGreaterThanOrEqual(PLAYLIST_INDEX + 1);
    const playlist = items[PLAYLIST_INDEX];
    expect(playlist.query(By.directive(MatIcon)).nativeElement.textContent.trim()).toEqual('queue_music');
    expect(playlist.query(By.directive(MatSlideToggle))).toBeTruthy();
  }));

  it('should set playlist toggle to uncheck when not show playlist', fakeAsync(() => {
    showPlaylistNameProducer.next(false);
    fixture.detectChanges();
    openMenuHelper(loader);

    const playlist = fixture.debugElement.queryAll(By.css('.menu-item'))[PLAYLIST_INDEX];
    const toggle = playlist.query(By.directive(MatSlideToggle)).componentInstance as MatSlideToggle;
    expect(toggle.checked).toBeFalse();
  }));

  it('should set playlist toggle to check when show playlist', fakeAsync(() => {
    showPlaylistNameProducer.next(true);
    fixture.detectChanges();
    openMenuHelper(loader);

    const playlist = fixture.debugElement.queryAll(By.css('.menu-item'))[PLAYLIST_INDEX];
    const toggle = playlist.query(By.directive(MatSlideToggle)).componentInstance as MatSlideToggle;
    expect(toggle.checked).toBeTrue();
  }));

  it('should set the playlist toggle to primary color', fakeAsync(() => {
    openMenuHelper(loader);

    const playlist = fixture.debugElement.queryAll(By.css('.menu-item'))[PLAYLIST_INDEX];
    const toggle = playlist.query(By.directive(MatSlideToggle)).componentInstance as MatSlideToggle;
    expect(toggle.color).toEqual('primary');
  }));

  it('should call onShowPlaylistNameChange when playlist toggle clicked', fakeAsync(() => {
    spyOn(component, 'onShowPlaylistNameChange');
    openMenuHelper(loader);

    const playlist = fixture.debugElement.queryAll(By.css('.menu-item'))[PLAYLIST_INDEX];
    const toggle = playlist.query(By.directive(MatSlideToggle));
    toggle.triggerEventHandler('toggleChange', null);
    fixture.detectChanges();
    expect(component.onShowPlaylistNameChange).toHaveBeenCalled();
  }));

  it('should stopPropagation when playlist toggle clicked', fakeAsync(() => {
    const event = new Event('click');
    spyOn(event, 'stopPropagation');
    openMenuHelper(loader);

    const playlist = fixture.debugElement.queryAll(By.css('.menu-item'))[PLAYLIST_INDEX];
    const toggle = playlist.query(By.directive(MatSlideToggle));
    toggle.triggerEventHandler('click', event);
    fixture.detectChanges();
    expect(event.stopPropagation).toHaveBeenCalled();
  }));

  it('should display the spotify code toggle setting', fakeAsync(() => {
    openMenuHelper(loader);

    const items = fixture.debugElement.queryAll(By.css('.menu-item'));
    expect(items.length).toBeGreaterThanOrEqual(SHOW_CODE_INDEX);
    const code = items[SHOW_CODE_INDEX];
    expect(code.query(By.directive(MatIcon)).nativeElement.textContent.trim()).toEqual('qr_code_2');
    expect(code.query(By.directive(MatSlideToggle))).toBeTruthy();
  }));

  it('should set spotify code toggle to uncheck when not show spotify code', fakeAsync(() => {
    showSpotifyCodeProducer.next(false);
    fixture.detectChanges();
    openMenuHelper(loader);

    const code = fixture.debugElement.queryAll(By.css('.menu-item'))[SHOW_CODE_INDEX];
    const toggle = code.query(By.directive(MatSlideToggle)).componentInstance as MatSlideToggle;
    expect(toggle.checked).toBeFalse();
  }));

  it('should set spotify code toggle to check when show spotify code', fakeAsync(() => {
    showSpotifyCodeProducer.next(true);
    fixture.detectChanges();
    openMenuHelper(loader);

    const code = fixture.debugElement.queryAll(By.css('.menu-item'))[SHOW_CODE_INDEX];
    const toggle = code.query(By.directive(MatSlideToggle)).componentInstance as MatSlideToggle;
    expect(toggle.checked).toBeTrue();
  }));

  it('should set the spotify code toggle to primary color', fakeAsync(() => {
    openMenuHelper(loader);

    const code = fixture.debugElement.queryAll(By.css('.menu-item'))[SHOW_CODE_INDEX];
    const toggle = code.query(By.directive(MatSlideToggle)).componentInstance as MatSlideToggle;
    expect(toggle.color).toEqual('primary');
  }));

  it('should call onShowBarCodeChange when spotify code toggle clicked', fakeAsync(() => {
    spyOn(component, 'onShowBarCodeChange');
    openMenuHelper(loader);

    const code = fixture.debugElement.queryAll(By.css('.menu-item'))[SHOW_CODE_INDEX];
    const toggle = code.query(By.directive(MatSlideToggle));
    toggle.triggerEventHandler('toggleChange', null);
    fixture.detectChanges();
    expect(component.onShowBarCodeChange).toHaveBeenCalled();
  }));

  it('should stopPropagation when spotify code toggle clicked', fakeAsync(() => {
    const event = new Event('click');
    spyOn(event, 'stopPropagation');
    openMenuHelper(loader);

    const code = fixture.debugElement.queryAll(By.css('.menu-item'))[SHOW_CODE_INDEX];
    const toggle = code.query(By.directive(MatSlideToggle));
    toggle.triggerEventHandler('click', event);
    fixture.detectChanges();
    expect(event.stopPropagation).toHaveBeenCalled();
  }));

  it('should display the smart color toggle setting', fakeAsync(() => {
    openMenuHelper(loader);

    const items = fixture.debugElement.queryAll(By.css('.menu-item'));
    expect(items.length).toBeGreaterThanOrEqual(SMART_COLOR_INDEX);
    const smartColor = items[SMART_COLOR_INDEX];
    expect(smartColor.query(By.directive(MatIcon)).nativeElement.textContent.trim()).toEqual('lightbulb');
    expect(smartColor.query(By.directive(MatSlideToggle))).toBeTruthy();
  }));

  it('should display all the smart color settings when smart color toggled', fakeAsync(() => {
    component.showSmartColorSettings = true;
    showSpotifyCodeProducer.next(true);
    fixture.detectChanges();
    openMenuHelper(loader);

    const items = fixture.debugElement.queryAll(By.css('.menu-item'));
    const smartSettings = items[SMART_SETTINGS_INDEX];
    const icons = smartSettings.queryAll(By.directive(MatIcon));
    const toggles = smartSettings.queryAll(By.directive(MatSlideToggle));
    expect(icons.length).toEqual(2);
    expect(icons[SMART_ACCENT_INDEX].nativeElement.textContent.trim()).toEqual('play_circle_outline');
    expect(icons[SMART_CODE_INDEX].nativeElement.textContent.trim()).toEqual('qr_code_2');
    expect(toggles.length).toEqual(2);
  }));

  it('should display the smart accent setting when smart color toggled and not showSpotifyCode', fakeAsync(() => {
    component.showSmartColorSettings = true;
    showSpotifyCodeProducer.next(false);
    fixture.detectChanges();
    openMenuHelper(loader);

    const items = fixture.debugElement.queryAll(By.css('.menu-item'));
    const smartSettings = items[SMART_SETTINGS_INDEX];
    const icons = smartSettings.queryAll(By.directive(MatIcon));
    const toggles = smartSettings.queryAll(By.directive(MatSlideToggle));
    expect(icons.length).toEqual(1);
    expect(icons[SMART_ACCENT_INDEX].nativeElement.textContent.trim()).toEqual('play_circle_outline');
    expect(toggles.length).toEqual(1);
  }));

  it('should set smart settings toggle to check when showSmartColorSettings and smartCodeColorUrlSet', fakeAsync(() => {
    component.showSmartColorSettings = true;
    component.smartCodeColorUrlSet = true;
    fixture.detectChanges();
    openMenuHelper(loader);

    const toggle = fixture.debugElement.queryAll(By.css('.menu-item'))[SMART_COLOR_INDEX]
      .query(By.directive(MatSlideToggle)).componentInstance as MatSlideToggle;
    expect(toggle.checked).toBeTrue();
    expect(toggle.disabled).toBeFalse();
  }));

  it('should set smart settings toggle to uncheck when not showSmartColorSettings and smartCodeColorUrlSet', fakeAsync(() => {
    component.showSmartColorSettings = false;
    component.smartCodeColorUrlSet = true;
    fixture.detectChanges();
    openMenuHelper(loader);

    const toggle = fixture.debugElement.queryAll(By.css('.menu-item'))[SMART_COLOR_INDEX]
      .query(By.directive(MatSlideToggle)).componentInstance as MatSlideToggle;
    expect(toggle.checked).toBeFalse();
    expect(toggle.disabled).toBeFalse();
  }));

  it('should set smart settings toggle to uncheck and disabled when showSmartColorSettings and not smartCodeColorUrlSet', fakeAsync(() => {
    component.showSmartColorSettings = true;
    component.smartCodeColorUrlSet = false;
    fixture.detectChanges();
    openMenuHelper(loader);

    const toggle = fixture.debugElement.queryAll(By.css('.menu-item'))[SMART_COLOR_INDEX]
      .query(By.directive(MatSlideToggle)).componentInstance as MatSlideToggle;
    expect(toggle.checked).toBeFalse();
    expect(toggle.disabled).toBeTrue();
  }));

  it('should set smart settings toggle to uncheck and disabled when not showSmartColorSettings and not smartCodeColorUrlSet',
    fakeAsync(() => {
      component.showSmartColorSettings = false;
      component.smartCodeColorUrlSet = false;
      fixture.detectChanges();
      openMenuHelper(loader);

      const toggle = fixture.debugElement.queryAll(By.css('.menu-item'))[SMART_COLOR_INDEX]
        .query(By.directive(MatSlideToggle)).componentInstance as MatSlideToggle;
      expect(toggle.checked).toBeFalse();
      expect(toggle.disabled).toBeTrue();
  }));

  it('should set smart accent toggle to check and not disabled when useDynamicThemeAccent and smartColorUrlSet', fakeAsync(() => {
    useDynamicThemeAccentProducer.next(true);
    component.smartCodeColorUrlSet = true;
    component.showSmartColorSettings = true;
    fixture.detectChanges();
    openMenuHelper(loader);

    const smartSettings = fixture.debugElement.queryAll(By.css('.menu-item'))[SMART_SETTINGS_INDEX];
    const toggle = smartSettings.queryAll(By.directive(MatSlideToggle))[SMART_ACCENT_INDEX].componentInstance as MatSlideToggle;
    expect(toggle.checked).toBeTrue();
    expect(toggle.disabled).toBeFalse();
  }));

  it('should set smart accent toggle to uncheck and not disabled when not useDynamicThemeAccent and smartColorUrlSet', fakeAsync(() => {
    useDynamicThemeAccentProducer.next(false);
    component.smartCodeColorUrlSet = true;
    component.showSmartColorSettings = true;
    fixture.detectChanges();
    openMenuHelper(loader);

    const smartSettings = fixture.debugElement.queryAll(By.css('.menu-item'))[SMART_SETTINGS_INDEX];
    const toggle = smartSettings.queryAll(By.directive(MatSlideToggle))[SMART_ACCENT_INDEX].componentInstance as MatSlideToggle;
    expect(toggle.checked).toBeFalse();
    expect(toggle.disabled).toBeFalse();
  }));

  it('should set smart accent toggle to uncheck and disabled when useDynamicThemeAccent and not smartColorUrlSet', fakeAsync(() => {
    useDynamicThemeAccentProducer.next(true);
    component.smartCodeColorUrlSet = false;
    component.showSmartColorSettings = true;
    fixture.detectChanges();
    openMenuHelper(loader);

    const smartSettings = fixture.debugElement.queryAll(By.css('.menu-item'))[SMART_SETTINGS_INDEX];
    const toggle = smartSettings.queryAll(By.directive(MatSlideToggle))[SMART_ACCENT_INDEX].componentInstance as MatSlideToggle;
    expect(toggle.checked).toBeFalse();
    expect(toggle.disabled).toBeTrue();
  }));

  it('should set smart accent toggle to uncheck and disabled when not useDynamicThemeAccent and not smartColorUrlSet', fakeAsync(() => {
    useDynamicThemeAccentProducer.next(false);
    component.smartCodeColorUrlSet = false;
    component.showSmartColorSettings = true;
    fixture.detectChanges();
    openMenuHelper(loader);

    const smartSettings = fixture.debugElement.queryAll(By.css('.menu-item'))[SMART_SETTINGS_INDEX];
    const toggle = smartSettings.queryAll(By.directive(MatSlideToggle))[SMART_ACCENT_INDEX].componentInstance as MatSlideToggle;
    expect(toggle.checked).toBeFalse();
    expect(toggle.disabled).toBeTrue();
  }));

  it('should set smart code toggle to check and not disabled when use smart code color and smart code color url set', fakeAsync(() => {
    showSpotifyCodeProducer.next(true);
    useSmartCodeColorProducer.next(true);
    component.smartCodeColorUrlSet = true;
    component.showSmartColorSettings = true;
    fixture.detectChanges();
    openMenuHelper(loader);

    const smartSettings = fixture.debugElement.queryAll(By.css('.menu-item'))[SMART_SETTINGS_INDEX];
    const toggle = smartSettings.queryAll(By.directive(MatSlideToggle))[SMART_CODE_INDEX].componentInstance as MatSlideToggle;
    expect(toggle.checked).toBeTrue();
    expect(toggle.disabled).toBeFalse();
  }));

  it('should set smart code toggle to uncheck and not disabled when not use smart code color and smart code color url set',
    fakeAsync(() => {
      showSpotifyCodeProducer.next(true);
      useSmartCodeColorProducer.next(false);
      component.smartCodeColorUrlSet = true;
      component.showSmartColorSettings = true;
      fixture.detectChanges();
      openMenuHelper(loader);

      const smartSettings = fixture.debugElement.queryAll(By.css('.menu-item'))[SMART_SETTINGS_INDEX];
      const toggle = smartSettings.queryAll(By.directive(MatSlideToggle))[SMART_CODE_INDEX].componentInstance as MatSlideToggle;
      expect(toggle.checked).toBeFalse();
      expect(toggle.disabled).toBeFalse();
  }));

  it('should set smart code toggle to uncheck and disabled when use smart code color and smart code color url not set', fakeAsync(() => {
    showSpotifyCodeProducer.next(true);
    useSmartCodeColorProducer.next(true);
    component.smartCodeColorUrlSet = false;
    component.showSmartColorSettings = true;
    fixture.detectChanges();
    openMenuHelper(loader);

    const smartSettings = fixture.debugElement.queryAll(By.css('.menu-item'))[SMART_SETTINGS_INDEX];
    const toggle = smartSettings.queryAll(By.directive(MatSlideToggle))[SMART_CODE_INDEX].componentInstance as MatSlideToggle;
    expect(toggle.checked).toBeFalse();
    expect(toggle.disabled).toBeTrue();
  }));

  it('should set smart code toggle to uncheck and disabled when not use smart code color and smart code color url not set',
    fakeAsync(() => {
      showSpotifyCodeProducer.next(true);
      useSmartCodeColorProducer.next(false);
      component.smartCodeColorUrlSet = false;
      component.showSmartColorSettings = true;
      fixture.detectChanges();
      openMenuHelper(loader);

      const smartSettings = fixture.debugElement.queryAll(By.css('.menu-item'))[SMART_SETTINGS_INDEX];
      const toggle = smartSettings.queryAll(By.directive(MatSlideToggle))[SMART_CODE_INDEX].componentInstance as MatSlideToggle;
      expect(toggle.checked).toBeFalse();
      expect(toggle.disabled).toBeTrue();
  }));

  it('should set the smart setting toggles to primary color', fakeAsync(() => {
    showSpotifyCodeProducer.next(true);
    component.showSmartColorSettings = true;
    fixture.detectChanges();
    openMenuHelper(loader);

    const smartColorToggle = fixture.debugElement.queryAll(By.css('.menu-item'))[SMART_COLOR_INDEX]
      .query(By.directive(MatSlideToggle)).componentInstance as MatSlideToggle;
    const smartSettings = fixture.debugElement.queryAll(By.css('.menu-item'))[SMART_SETTINGS_INDEX];
    const smartAccentToggle = smartSettings.queryAll(By.directive(MatSlideToggle))[SMART_ACCENT_INDEX].componentInstance as MatSlideToggle;
    const smartCodeToggle = smartSettings.queryAll(By.directive(MatSlideToggle))[SMART_CODE_INDEX].componentInstance as MatSlideToggle;
    expect(smartColorToggle.color).toEqual('primary');
    expect(smartAccentToggle.color).toEqual('primary');
    expect(smartCodeToggle.color).toEqual('primary');
  }));

  it('should call onShowSmartColorSettings when smart color toggle clicked', fakeAsync(() => {
    spyOn(component, 'onShowSmartColorSettings');
    showSpotifyCodeProducer.next(true);
    component.showSmartColorSettings = true;
    fixture.detectChanges();
    openMenuHelper(loader);

    const toggle = fixture.debugElement.queryAll(By.css('.menu-item'))[SMART_COLOR_INDEX]
      .query(By.directive(MatSlideToggle));
    toggle.triggerEventHandler('toggleChange', null);
    fixture.detectChanges();
    expect(component.onShowSmartColorSettings).toHaveBeenCalled();
  }));

  it('should call onUseDynamicThemeAccent when smart accent toggle clicked', fakeAsync(() => {
    spyOn(component, 'onUseDynamicThemeAccent');
    showSpotifyCodeProducer.next(true);
    component.showSmartColorSettings = true;
    fixture.detectChanges();
    openMenuHelper(loader);

    const smartSettings = fixture.debugElement.queryAll(By.css('.menu-item'))[SMART_SETTINGS_INDEX];
    const toggle = smartSettings.queryAll(By.directive(MatSlideToggle))[SMART_ACCENT_INDEX];
    toggle.triggerEventHandler('toggleChange', null);
    fixture.detectChanges();
    expect(component.onUseDynamicThemeAccent).toHaveBeenCalled();
  }));

  it('should call onUseSmartCodeColor when smart code toggle clicked', fakeAsync(() => {
    spyOn(component, 'onUseSmartCodeColor');
    showSpotifyCodeProducer.next(true);
    component.showSmartColorSettings = true;
    fixture.detectChanges();
    openMenuHelper(loader);

    const smartSettings = fixture.debugElement.queryAll(By.css('.menu-item'))[SMART_SETTINGS_INDEX];
    const toggle = smartSettings.queryAll(By.directive(MatSlideToggle))[SMART_CODE_INDEX];
    toggle.triggerEventHandler('toggleChange', null);
    fixture.detectChanges();
    expect(component.onUseSmartCodeColor).toHaveBeenCalled();
  }));

  it('should stopPropagation when smart color toggle clicked', fakeAsync(() => {
    const event = new Event('click');
    spyOn(event, 'stopPropagation');
    showSpotifyCodeProducer.next(true);
    component.showSmartColorSettings = true;
    fixture.detectChanges();
    openMenuHelper(loader);

    const toggle = fixture.debugElement.queryAll(By.css('.menu-item'))[SMART_COLOR_INDEX]
      .query(By.directive(MatSlideToggle));
    toggle.triggerEventHandler('click', event);
    fixture.detectChanges();
    expect(event.stopPropagation).toHaveBeenCalled();
  }));

  it('should stopPropagation when smart accent toggle clicked', fakeAsync(() => {
    const event = new Event('click');
    spyOn(event, 'stopPropagation');
    showSpotifyCodeProducer.next(true);
    component.showSmartColorSettings = true;
    fixture.detectChanges();
    openMenuHelper(loader);

    const smartSettings = fixture.debugElement.queryAll(By.css('.menu-item'))[SMART_SETTINGS_INDEX];
    const toggle = smartSettings.queryAll(By.directive(MatSlideToggle))[SMART_ACCENT_INDEX];
    toggle.triggerEventHandler('click', event);
    fixture.detectChanges();
    expect(event.stopPropagation).toHaveBeenCalled();
  }));

  it('should stopPropagation when smart code toggle clicked', fakeAsync(() => {
    const event = new Event('click');
    spyOn(event, 'stopPropagation');
    showSpotifyCodeProducer.next(true);
    component.showSmartColorSettings = true;
    fixture.detectChanges();
    openMenuHelper(loader);

    const smartSettings = fixture.debugElement.queryAll(By.css('.menu-item'))[SMART_SETTINGS_INDEX];
    const toggle = smartSettings.queryAll(By.directive(MatSlideToggle))[SMART_CODE_INDEX];
    toggle.triggerEventHandler('click', event);
    fixture.detectChanges();
    expect(event.stopPropagation).toHaveBeenCalled();
  }));

  it('should display the bar color toggle setting when not useSmartCodeColor and show spotify code', fakeAsync(() => {
    useSmartCodeColorProducer.next(false);
    showSpotifyCodeProducer.next(true);
    component.showSmartColorSettings = true;
    fixture.detectChanges();
    openMenuHelper(loader);

    const items = fixture.debugElement.queryAll(By.css('.menu-item'));
    expect(items.length).toBeGreaterThanOrEqual(BAR_COLOR_INDEX + 1);
    const barColor = items[BAR_COLOR_INDEX];
    expect(barColor.query(By.directive(MatIcon)).nativeElement.textContent.trim()).toEqual('invert_colors');
    expect(barColor.query(By.directive(MatSlideToggle))).toBeTruthy();
  }));

  it('should not display the bar color toggle setting when useSmartCodeColor and show spotify code', fakeAsync(() => {
    useSmartCodeColorProducer.next(true);
    showSpotifyCodeProducer.next(true);
    fixture.detectChanges();
    openMenuHelper(loader);

    const items = fixture.debugElement.queryAll(By.css('.menu-item'));
    const icon = items[items.length - 2].query(By.directive(MatIcon));
    expect(icon.nativeElement.textContent.trim()).not.toEqual('invert_colors');
  }));

  it('should not display the bar color toggle setting when useSmartCodeColor and not show spotify code', fakeAsync(() => {
    useSmartCodeColorProducer.next(true);
    showSpotifyCodeProducer.next(false);
    fixture.detectChanges();
    openMenuHelper(loader);

    const items = fixture.debugElement.queryAll(By.css('.menu-item'));
    const icon = items[items.length - 2].query(By.directive(MatIcon));
    expect(icon.nativeElement.textContent.trim()).not.toEqual('invert_colors');
  }));

  it('should not display the bar color toggle setting when not useSmartCodeColor and not show spotify code', fakeAsync(() => {
    useSmartCodeColorProducer.next(false);
    showSpotifyCodeProducer.next(false);
    fixture.detectChanges();
    openMenuHelper(loader);

    const items = fixture.debugElement.queryAll(By.css('.menu-item'));
    const icon = items[items.length - 2].query(By.directive(MatIcon));
    expect(icon.nativeElement.textContent.trim()).not.toEqual('invert_colors');
  }));

  it('should set bar color toggle to check when bar color is black', fakeAsync(() => {
    showSpotifyCodeProducer.next(true);
    useSmartCodeColorProducer.next(false);
    component.showSmartColorSettings = true;
    barColorProducer.next(BAR_COLOR_BLACK);
    fixture.detectChanges();
    openMenuHelper(loader);

    const barColor = fixture.debugElement.queryAll(By.css('.menu-item'))[BAR_COLOR_INDEX];
    const toggle = barColor.query(By.directive(MatSlideToggle)).componentInstance as MatSlideToggle;
    expect(toggle.checked).toBeTrue();
  }));

  it('should set bar color toggle to uncheck when bar color is not black', fakeAsync(() => {
    showSpotifyCodeProducer.next(true);
    useSmartCodeColorProducer.next(false);
    component.showSmartColorSettings = true;
    barColorProducer.next(BAR_COLOR_WHITE);
    fixture.detectChanges();
    openMenuHelper(loader);

    const barColor = fixture.debugElement.queryAll(By.css('.menu-item'))[BAR_COLOR_INDEX];
    const toggle = barColor.query(By.directive(MatSlideToggle)).componentInstance as MatSlideToggle;
    expect(toggle.checked).toBeFalse();
  }));

  it('should set the bar color toggle to primary color', fakeAsync(() => {
    showSpotifyCodeProducer.next(true);
    useSmartCodeColorProducer.next(false);
    component.showSmartColorSettings = true;
    fixture.detectChanges();
    openMenuHelper(loader);

    const barColor = fixture.debugElement.queryAll(By.css('.menu-item'))[BAR_COLOR_INDEX];
    const toggle = barColor.query(By.directive(MatSlideToggle)).componentInstance as MatSlideToggle;
    expect(toggle.color).toEqual('primary');
  }));

  it('should call onBarColorChange when bar color toggle clicked', fakeAsync(() => {
    spyOn(component, 'onBarColorChange');
    showSpotifyCodeProducer.next(true);
    useSmartCodeColorProducer.next(false);
    component.showSmartColorSettings = true;
    fixture.detectChanges();
    openMenuHelper(loader);

    const barColor = fixture.debugElement.queryAll(By.css('.menu-item'))[BAR_COLOR_INDEX];
    const toggle = barColor.query(By.directive(MatSlideToggle));
    toggle.triggerEventHandler('toggleChange', null);
    fixture.detectChanges();
    expect(component.onBarColorChange).toHaveBeenCalled();
  }));

  it('should stopPropagation when bar color toggle clicked', fakeAsync(() => {
    const event = new Event('click');
    spyOn(event, 'stopPropagation');
    showSpotifyCodeProducer.next(true);
    useSmartCodeColorProducer.next(false);
    component.showSmartColorSettings = true;
    fixture.detectChanges();
    openMenuHelper(loader);

    const barColor = fixture.debugElement.queryAll(By.css('.menu-item'))[BAR_COLOR_INDEX];
    const toggle = barColor.query(By.directive(MatSlideToggle));
    toggle.triggerEventHandler('click', event);
    fixture.detectChanges();
    expect(event.stopPropagation).toHaveBeenCalled();
  }));

  it('should display the color picker when not useSmartCodeColor and showSpotifyCode', fakeAsync(() => {
    useSmartCodeColorProducer.next(false);
    showSpotifyCodeProducer.next(true);
    fixture.detectChanges();
    openMenuHelper(loader);

    const colorPicker = fixture.debugElement.query(By.directive(ColorPickerComponent));
    expect(colorPicker).toBeTruthy();
  }));

  it('should not display the color picker when useSmartCodeColor and showSpotifyCode', fakeAsync(() => {
    useSmartCodeColorProducer.next(true);
    showSpotifyCodeProducer.next(true);
    fixture.detectChanges();
    openMenuHelper(loader);

    const colorPicker = fixture.debugElement.query(By.directive(ColorPickerComponent));
    expect(colorPicker).toBeFalsy();
  }));

  it('should not display the color picker when useSmartCodeColor and not showSpotifyCode', fakeAsync(() => {
    useSmartCodeColorProducer.next(true);
    showSpotifyCodeProducer.next(false);
    fixture.detectChanges();
    openMenuHelper(loader);

    const colorPicker = fixture.debugElement.query(By.directive(ColorPickerComponent));
    expect(colorPicker).toBeFalsy();
  }));

  it('should not display the color picker when not useSmartCodeColor and not showSpotifyCode', fakeAsync(() => {
    useSmartCodeColorProducer.next(false);
    showSpotifyCodeProducer.next(false);
    fixture.detectChanges();
    openMenuHelper(loader);

    const colorPicker = fixture.debugElement.query(By.directive(ColorPickerComponent));
    expect(colorPicker).toBeFalsy();
  }));

  it('should set the color picker\'s color as backgroundColor', fakeAsync(() => {
    useSmartCodeColorProducer.next(false);
    showSpotifyCodeProducer.next(true);
    backgroundColorProducer.next('ABC123');
    fixture.detectChanges();
    openMenuHelper(loader);

    const colorPicker = fixture.debugElement.query(By.directive(ColorPickerComponent)).componentInstance as ColorPickerComponent;
    expect(colorPicker.color).toEqual('ABC123');
  }));

  it('should set the color picker\'s placeholderColor as component\'s placeholderColor', fakeAsync(() => {
    useSmartCodeColorProducer.next(false);
    showSpotifyCodeProducer.next(true);
    fixture.detectChanges();
    openMenuHelper(loader);

    const colorPicker = fixture.debugElement.query(By.directive(ColorPickerComponent)).componentInstance as ColorPickerComponent;
    expect(colorPicker.placeholderColor).toEqual(component.placeholderColor);
  }));

  it('should set the color picker\'s presetColors as component\'s presetColors', fakeAsync(() => {
    useSmartCodeColorProducer.next(false);
    showSpotifyCodeProducer.next(true);
    fixture.detectChanges();
    openMenuHelper(loader);

    const colorPicker = fixture.debugElement.query(By.directive(ColorPickerComponent)).componentInstance as ColorPickerComponent;
    expect(colorPicker.presetColors).toEqual(component.presetColors);
  }));

  it('should set the color picker\'s colorReset$ as colorPickerResetEvent', fakeAsync(() => {
    useSmartCodeColorProducer.next(false);
    showSpotifyCodeProducer.next(true);
    fixture.detectChanges();
    openMenuHelper(loader);

    const colorPicker = fixture.debugElement.query(By.directive(ColorPickerComponent)).componentInstance as ColorPickerComponent;
    expect(colorPicker.colorReset$).toEqual(component.colorPickerResetEvent.asObservable());
  }));

  it('should trigger onColorChange when color picker color change', fakeAsync(() => {
    spyOn(component, 'onColorChange');
    useSmartCodeColorProducer.next(false);
    showSpotifyCodeProducer.next(true);
    fixture.detectChanges();
    openMenuHelper(loader);

    const colorPicker = fixture.debugElement.query(By.directive(ColorPickerComponent));
    colorPicker.triggerEventHandler('colorChange', null);
    expect(component.onColorChange).toHaveBeenCalled();
  }));

  it('should trigger stopPropagation when color picker is clicked', fakeAsync(() => {
    const event = new Event('click');
    spyOn(event, 'stopPropagation');
    useSmartCodeColorProducer.next(false);
    showSpotifyCodeProducer.next(true);
    fixture.detectChanges();
    openMenuHelper(loader);

    const colorPicker = fixture.debugElement.query(By.directive(ColorPickerComponent));
    colorPicker.triggerEventHandler('click', event);
    expect(event.stopPropagation).toHaveBeenCalled();
  }));

  it('should display the accent color selector when not useDynamicThemeAccent', fakeAsync(() => {
    useDynamicThemeAccentProducer.next(false);
    fixture.detectChanges();
    openMenuHelper(loader);

    const accentColorSelector = fixture.debugElement.query(By.directive(MatSelect));
    expect(accentColorSelector).toBeTruthy();
  }));

  it('should not display the accent color selector when useDynamicThemeAccent', fakeAsync(() => {
    useDynamicThemeAccentProducer.next(true);
    fixture.detectChanges();
    openMenuHelper(loader);

    const accentColorSelector = fixture.debugElement.query(By.directive(MatSelect));
    expect(accentColorSelector).toBeFalsy();
  }));

  it('should display the default accent color selector label text', fakeAsync(() => {
    openMenuHelper(loader);

    const accentColorField = fixture.debugElement.query(By.directive(MatFormField));
    const label = accentColorField.query(By.directive(MatLabel));
    expect(label.nativeElement.textContent.trim()).toEqual('Accent Color');
  }));

  it('should display all preset accent color options', fakeAsync(() => {
    openMenuHelper(loader);

    const accentColorSelector = fixture.debugElement.query(By.directive(MatSelect));
    accentColorSelector.nativeElement.click();
    fixture.detectChanges();

    const options = fixture.debugElement.queryAll(By.directive(MatOption));
    expect(options.length).toEqual(DYNAMIC_THEME_COLORS.getColors().length + 1);
  }));

  it('should display the unselect option', fakeAsync(() => {
    openMenuHelper(loader);

    const accentColorSelector = fixture.debugElement.query(By.directive(MatSelect));
    accentColorSelector.nativeElement.click();
    fixture.detectChanges();

    const options = fixture.debugElement.queryAll(By.directive(MatOption));
    expect(options.length).toBeGreaterThanOrEqual(1);
    expect(options[0].nativeElement.textContent.trim()).toEqual('Unselect');
  }));

  it('should display the unselect option', fakeAsync(() => {
    const presetColors = DYNAMIC_THEME_COLORS.getColors();
    openMenuHelper(loader);

    const accentColorSelector = fixture.debugElement.query(By.directive(MatSelect));
    accentColorSelector.nativeElement.click();
    fixture.detectChanges();

    const options = fixture.debugElement.queryAll(By.directive(MatOption));
    expect(options.length).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < presetColors.length; i++) {
      const option = options[i + 1];
      const textSpan = option.query(By.css('span span'));
      expect(option.nativeElement.textContent.trim()).toEqual(presetColors[i].displayName);
      expect(cssRgbToHex(textSpan.nativeElement.style.color)).toEqual(presetColors[i].hex.toUpperCase());
    }
  }));

  it('should call onAccentColorChange on accent option selection', fakeAsync(() => {
    spyOn(component, 'onAccentColorChange');
    openMenuHelper(loader);

    const accentColorSelector = fixture.debugElement.query(By.directive(MatSelect));
    accentColorSelector.nativeElement.click();
    fixture.detectChanges();

    const options = fixture.debugElement.queryAll(By.directive(MatOption));
    options[1].nativeElement.click();
    fixture.detectChanges();

    expect(component.onAccentColorChange).toHaveBeenCalled();
    flush();
  }));

  it('should update the customAccentColor object when accent color selected', fakeAsync(() => {
    component.customAccentColor = null;
    openMenuHelper(loader);

    const accentColorSelector = fixture.debugElement.query(By.directive(MatSelect));
    accentColorSelector.nativeElement.click();
    fixture.detectChanges();

    const options = fixture.debugElement.queryAll(By.directive(MatOption));
    options[1].nativeElement.click();
    fixture.detectChanges();

    expect(component.customAccentColor).toBeTruthy();
    flush();
  }));

  it('should update the customAccentColor object to null when accent color unselected', fakeAsync(() => {
    component.customAccentColor = DYNAMIC_THEME_COLORS.getColors()[0];
    openMenuHelper(loader);

    const accentColorSelector = fixture.debugElement.query(By.directive(MatSelect));
    accentColorSelector.nativeElement.click();
    fixture.detectChanges();

    const options = fixture.debugElement.queryAll(By.directive(MatOption));
    options[0].nativeElement.click();
    fixture.detectChanges();

    expect(component.customAccentColor).toBeNull();
    flush();
  }));

  it('should display the logout button', fakeAsync(() => {
    openMenuHelper(loader);

    const buttons = fixture.debugElement.queryAll(By.css('.menu-help button'));
    expect(buttons.length).toBeGreaterThanOrEqual(LOGOUT_INDEX + 1);
    expect(buttons[LOGOUT_INDEX].query(By.directive(MatIcon)).nativeElement.textContent.trim()).toEqual('logout');
  }));

  it('should call logout when the logout button is clicked', fakeAsync(() => {
    spyOn(component, 'logout');
    const event = new Event('click');
    openMenuHelper(loader);

    const button = fixture.debugElement.queryAll(By.css('.menu-help button'))[LOGOUT_INDEX];
    button.triggerEventHandler('click', event);
    expect(component.logout).toHaveBeenCalled();
  }));

  it('should display the help button', fakeAsync(() => {
    openMenuHelper(loader);

    const buttons = fixture.debugElement.queryAll(By.css('.menu-help button'));
    expect(buttons.length).toBeGreaterThanOrEqual(HELP_INDEX + 1);
    expect(buttons[HELP_INDEX].query(By.directive(MatIcon)).nativeElement.textContent.trim()).toEqual('help_outline');
  }));

  it('should call openHelpDialog when the help button is clicked', fakeAsync(() => {
    spyOn(component, 'openHelpDialog');
    const event = new Event('click');
    openMenuHelper(loader);

    const button = fixture.debugElement.queryAll(By.css('.menu-help button'))[HELP_INDEX];
    button.triggerEventHandler('click', event);
    expect(component.openHelpDialog).toHaveBeenCalled();
  }));

  it('should set smartCodeColorUrlSet to false if no albumColorUrl in config', () => {
    AppConfig.settings.env.albumColorUrl = null;
    component.ngOnInit();
    expect(component.smartCodeColorUrlSet).toBeFalse();
  });

  it('should set smartCodeColorUrlSet to true if albumColorUrl set in config', () => {
    AppConfig.settings.env.albumColorUrl = 'test';
    component.ngOnInit();
    expect(component.smartCodeColorUrlSet).toBeTrue();
  });

  it('should logout of Spotify service and navigate to /login on logout', () => {
    component.logout();
    expect(spotify.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('should dispatch a colorPicker reset event when menu closed', () => {
    spyOn(component.colorPickerResetEvent, 'next');
    component.onMenuClose(null);
    expect(component.colorPickerResetEvent.next).toHaveBeenCalled();
  });

  it('should set theme to dark when current light onDarkModeChange', () => {
    themeProducer.next('light-theme');
    component.onDarkModeChange();
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeTheme('dark-theme'));
  });

  it('should set theme to light when current dark onDarkModeChange', () => {
    themeProducer.next('dark-theme');
    component.onDarkModeChange();
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeTheme('light-theme'));
  });

  it('should set theme to dark by default onDarkModeChange', () => {
    themeProducer.next(null);
    component.onDarkModeChange();
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeTheme('dark-theme'));
  });

  it('should dispatch ChangePlayerControls with off when onShowPlayerControlsChange called with off', () => {
    const change = new MatButtonToggleChange(null, PlayerControlsOptions.Off);
    component.onShowPlayerControlsChange(change);
    expect(store.dispatch).toHaveBeenCalledWith(new ChangePlayerControls(PlayerControlsOptions.Off));
  });

  it('should dispatch ChangePlayerControls with fade when onShowPlayerControlsChange called with fade', () => {
    const change = new MatButtonToggleChange(null, PlayerControlsOptions.Fade);
    component.onShowPlayerControlsChange(change);
    expect(store.dispatch).toHaveBeenCalledWith(new ChangePlayerControls(PlayerControlsOptions.Fade));
  });

  it('should dispatch ChangePlayerControls with on when onShowPlayerControlsChange called with on', () => {
    const change = new MatButtonToggleChange(null, PlayerControlsOptions.On);
    component.onShowPlayerControlsChange(change);
    expect(store.dispatch).toHaveBeenCalledWith(new ChangePlayerControls(PlayerControlsOptions.On));
  });

  it('should dispatch TogglePlayListName when onShowPlaylistNameChange called', () => {
    component.onShowPlaylistNameChange();
    expect(store.dispatch).toHaveBeenCalledWith(jasmine.any(TogglePlaylistName));
  });

  it('should dispatch ToggleSpotifyCode when onShowBarCodeChange called', () => {
    component.onShowBarCodeChange();
    expect(store.dispatch).toHaveBeenCalledWith(jasmine.any(ToggleSpotifyCode));
  });

  it('should dispatch ToggleSmartCodeColor when onUseSmartCodeColor called', () => {
    component.onUseSmartCodeColor();
    expect(store.dispatch).toHaveBeenCalledWith(jasmine.any(ToggleSmartCodeColor));
  });

  it('should set bar color to black when current bar color white onBarColorChange', () => {
    barColorProducer.next(BAR_COLOR_WHITE);
    component.onBarColorChange();
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeSpotifyCodeBarColor(BAR_COLOR_BLACK));
  });

  it('should set bar color to white when current bar color black onBarColorChange', () => {
    barColorProducer.next(BAR_COLOR_BLACK);
    component.onBarColorChange();
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeSpotifyCodeBarColor(BAR_COLOR_WHITE));
  });

  it('should set bar color to black by default onBarColorChange', () => {
    barColorProducer.next(null);
    component.onBarColorChange();
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeSpotifyCodeBarColor(BAR_COLOR_BLACK));
  });

  it('should set background color when onColorChange called if valid hex', () => {
    component.onColorChange('ABC123');
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeSpotifyCodeBackgroundColor('ABC123'));
  });

  it('should not set background color when onColorChange called if invalid hex', () => {
    component.onColorChange('badhex');
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should open help dialog when openHelpDialog', () => {
    spyOn(component.helpDialog, 'open');
    component.openHelpDialog();
    expect(component.helpDialog.open).toHaveBeenCalled();
  });

  it('should open help dialog with correct data in light theme', () => {
    spyOn(component.helpDialog, 'open');
    themeProducer.next('light-theme');
    component.openHelpDialog();
    expect(component.helpDialog.open).toHaveBeenCalledWith(jasmine.any(Function),
      {
        width: '90%',
        data: {
          version: jasmine.any(String),
          githubIcon: component.githubIcon,
          year: jasmine.any(Number),
          isLightTheme: true
        }
      });
  });

  it('should open help dialog with correct data in dark theme', () => {
    spyOn(component.helpDialog, 'open');
    themeProducer.next('dark-theme');
    component.openHelpDialog();
    expect(component.helpDialog.open).toHaveBeenCalledWith(jasmine.any(Function),
      {
        width: '90%',
        data: {
          version: jasmine.any(String),
          githubIcon: component.githubIcon,
          year: jasmine.any(Number),
          isLightTheme: false
        }
      });
  });
});

function openMenuHelper(loader: HarnessLoader): void {
  let button: MatButtonHarness;
  loader.getHarness(MatButtonHarness).then((harness) => button = harness);
  flushMicrotasks();
  expect(button).toBeTruthy();

  button.click();
  flushMicrotasks();
}

function toggleHarnessAtIndexHelper(harnessLoader: HarnessLoader, index: number): void {
  let harnesses: MatButtonToggleHarness[];
  harnessLoader.getAllHarnesses(MatButtonToggleHarness).then((toggleHarnesses) => harnesses = toggleHarnesses);
  flushMicrotasks();

  const buttonHarness = harnesses[index];
  expect(buttonHarness).toBeTruthy();

  let actualIsChecked = null;
  buttonHarness.isChecked().then((isChecked) => actualIsChecked = isChecked);
  flushMicrotasks();
  expect(actualIsChecked).toBeFalse();

  buttonHarness.check();
  flushMicrotasks();

  buttonHarness.isChecked().then((isChecked) => actualIsChecked = isChecked);
  flushMicrotasks();
  expect(actualIsChecked).toBeTrue();
}
