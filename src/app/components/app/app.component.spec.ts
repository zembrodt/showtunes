import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { By } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { NgxsModule } from '@ngxs/store';
import { MockComponent, MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { PlayerControlsOptions, Theme } from '../../core/settings/settings.model';
import { NgxsSelectorMock } from '../../core/testing/ngxs-selector-mock';
import { InactivityService } from '../../services/inactivity/inactivity.service';
import { PlaybackService } from '../../services/playback/playback.service';
import { SpotifyService } from '../../services/spotify/spotify.service';
import { ErrorComponent } from '../error/error.component';
import { AppComponent } from './app.component';
import Spy = jasmine.Spy;

describe('AppComponent', () => {
  const mockSelectors = new NgxsSelectorMock<AppComponent>();
  let app: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let spotify: SpotifyService;
  let playback: PlaybackService;

  let themeProducer: BehaviorSubject<string>;
  let customAccentColorProducer: BehaviorSubject<string>;
  let showPlayerControlsProducer: BehaviorSubject<PlayerControlsOptions>;
  let useDynamicThemeAccentProducer: BehaviorSubject<boolean>;
  let dynamicAccentColorProducer: BehaviorSubject<string>;
  let inactiveProducer: BehaviorSubject<boolean>;
  let spotifyInitSpy: Spy<() => boolean>;

  beforeEach(waitForAsync(() => {
    inactiveProducer = new BehaviorSubject<boolean>(null);
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        MockComponent(RouterOutlet),
        MockComponent(ErrorComponent)
      ],
      imports: [
        MatIconModule,
        MatSidenavModule,
        NgxsModule.forRoot([], { developmentMode: true })
      ],
      providers: [
        MockProvider(InactivityService, {
          inactive$: inactiveProducer
        }),
        MockProvider(PlaybackService),
        MockProvider(SpotifyService)
      ]
    }).compileComponents();
    spotify = TestBed.inject(SpotifyService);
    playback = TestBed.inject(PlaybackService);

    fixture = TestBed.createComponent(AppComponent);
    app = fixture.componentInstance;

    themeProducer = mockSelectors.defineNgxsSelector<string>(app, 'theme$');
    customAccentColorProducer = mockSelectors.defineNgxsSelector<string>(app, 'customAccentColor$');
    showPlayerControlsProducer = mockSelectors.defineNgxsSelector<PlayerControlsOptions>(app, 'showPlayerControls$');
    useDynamicThemeAccentProducer = mockSelectors.defineNgxsSelector<boolean>(app, 'useDynamicThemeAccent$');
    dynamicAccentColorProducer = mockSelectors.defineNgxsSelector<string>(app, 'dynamicAccentColor$');

    SpotifyService.initialized = false;
    spotifyInitSpy = spyOn(SpotifyService, 'initialize').and.returnValue(true);

    fixture.detectChanges();
  }));

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it('should initialize the Spotify service if not initialized', () => {
    expect(SpotifyService.initialize).toHaveBeenCalled();
  });

  it('should not initialize the Spotify service if already initialized', () => {
    SpotifyService.initialized = true;
    spyOn(console, 'error');
    spotifyInitSpy.calls.reset();
    app.ngOnInit();
    expect(SpotifyService.initialize).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should print error if Spotify service not initialized', () => {
    spotifyInitSpy.and.returnValue(false);
    spyOn(console, 'error');
    app.ngOnInit();
    expect(SpotifyService.initialize).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it('should not display the failed to initialize error message if Spotify service initialized', () => {
    const failedInit = fixture.debugElement.query(By.css('.not-initialized'));
    expect(failedInit).toBeFalsy();
  });

  it('should display a failed to initialize error message if Spotify service not initialized', () => {
    spotifyInitSpy.and.returnValue(false);
    app.appInitialized = false;
    spyOn(console, 'error');
    app.ngOnInit();
    fixture.detectChanges();
    const failedInit = fixture.debugElement.query(By.directive(ErrorComponent));
    expect(console.error).toHaveBeenCalled();
    expect(failedInit).toBeTruthy();
    expect(failedInit.componentInstance.message).toEqual('ShowTunes failed to initialize!');
  });

  it('should initialize the Spotify service subscriptions', () => {
    expect(spotify.initSubscriptions).toHaveBeenCalled();
  });

  it('should initialize the playbackService', () => {
    expect(playback.initialize).toHaveBeenCalled();
  });

  it('should use the light-theme class when light theme', () => {
    themeProducer.next(Theme.Light);
    fixture.detectChanges();
    const main = fixture.debugElement.query(By.css('.showtunes-app'));
    expect(main.classes[Theme.Light]).toBeTruthy();
    expect(main.classes[Theme.Dark]).toBeFalsy();
  });

  it('should use the dark-theme class when dark theme', () => {
    themeProducer.next(Theme.Dark);
    fixture.detectChanges();
    const main = fixture.debugElement.query(By.css('.showtunes-app'));
    expect(main.classes[Theme.Light]).toBeFalsy();
    expect(main.classes[Theme.Dark]).toBeTruthy();
  });

  it('should use no theme class when theme is null', () => {
    themeProducer.next(null);
    fixture.detectChanges();
    const main = fixture.debugElement.query(By.css('.showtunes-app'));
    expect(main.classes[Theme.Light]).toBeFalsy();
    expect(main.classes[Theme.Dark]).toBeFalsy();
  });

  it('should use dynamic theme when useDynamicThemeAccent and dynamicAccentColor exists', () => {
    themeProducer.next(Theme.Light);
    useDynamicThemeAccentProducer.next(true);
    dynamicAccentColorProducer.next('cyan');
    fixture.detectChanges();
    const main = fixture.debugElement.query(By.css('.showtunes-app'));
    expect(main.classes[Theme.Light]).toBeFalsy();
    expect(main.classes[`cyan-${Theme.Light}`]).toBeTruthy();
  });

  it('should use dynamic theme over custom theme when useDynamicThemeAccent and dynamicAccentColor exists', () => {
    themeProducer.next(Theme.Light);
    useDynamicThemeAccentProducer.next(true);
    dynamicAccentColorProducer.next('cyan');
    customAccentColorProducer.next('green');
    fixture.detectChanges();
    const main = fixture.debugElement.query(By.css('.showtunes-app'));
    expect(main.classes[Theme.Light]).toBeFalsy();
    expect(main.classes[`cyan-${Theme.Light}`]).toBeTruthy();
    expect(main.classes[`green-${Theme.Light}`]).toBeFalsy();
  });

  it('should not use dynamic theme when not useDynamicThemeAccent and dynamicAccentColor exists', () => {
    themeProducer.next(Theme.Light);
    useDynamicThemeAccentProducer.next(false);
    dynamicAccentColorProducer.next('cyan');
    fixture.detectChanges();
    const main = fixture.debugElement.query(By.css('.showtunes-app'));
    expect(main.classes[Theme.Light]).toBeTruthy();
    expect(main.classes[`cyan-${Theme.Light}`]).toBeFalsy();
  });

  it('should not use dynamic theme when useDynamicThemeAccent and dynamicAccentColor is null', () => {
    themeProducer.next(Theme.Light);
    useDynamicThemeAccentProducer.next(true);
    dynamicAccentColorProducer.next(null);
    fixture.detectChanges();
    const main = fixture.debugElement.query(By.css('.showtunes-app'));
    expect(main.classes[Theme.Light]).toBeTruthy();
    expect(main.classes[`cyan-${Theme.Light}`]).toBeFalsy();
  });

  it('should use custom theme when customAccentColor exists and not dynamic', () => {
    themeProducer.next(Theme.Light);
    customAccentColorProducer.next('green');
    fixture.detectChanges();
    const main = fixture.debugElement.query(By.css('.showtunes-app'));
    expect(main.classes[Theme.Light]).toBeFalsy();
    expect(main.classes[`green-${Theme.Light}`]).toBeTruthy();
  });

  it('should use custom theme when customAccentColor exists and not useDynamicAccentTheme and dynamicAccentColor exists', () => {
    themeProducer.next(Theme.Light);
    useDynamicThemeAccentProducer.next(false);
    dynamicAccentColorProducer.next('cyan');
    customAccentColorProducer.next('green');
    fixture.detectChanges();
    const main = fixture.debugElement.query(By.css('.showtunes-app'));
    expect(main.classes[Theme.Light]).toBeFalsy();
    expect(main.classes[`cyan-${Theme.Light}`]).toBeFalsy();
    expect(main.classes[`green-${Theme.Light}`]).toBeTruthy();
  });

  it('should use custom theme when customAccentColor exists and useDynamicAccentTheme and dynamicAccentColor is null', () => {
    themeProducer.next(Theme.Light);
    useDynamicThemeAccentProducer.next(true);
    dynamicAccentColorProducer.next(null);
    customAccentColorProducer.next('green');
    fixture.detectChanges();
    const main = fixture.debugElement.query(By.css('.showtunes-app'));
    expect(main.classes[Theme.Light]).toBeFalsy();
    expect(main.classes[`green-${Theme.Light}`]).toBeTruthy();
  });

  it('should use no theme when useDynamicAccentTheme and dynamicAccentColor exists and theme is null', () => {
    themeProducer.next(null);
    useDynamicThemeAccentProducer.next(true);
    dynamicAccentColorProducer.next('cyan');
    fixture.detectChanges();
    const main = fixture.debugElement.query(By.css('.showtunes-app'));
    expect(main.classes[Theme.Light]).toBeFalsy();
    expect(main.classes[Theme.Dark]).toBeFalsy();
    expect(main.classes[`cyan-${Theme.Light}`]).toBeFalsy();
    expect(main.classes[`cyan-${Theme.Dark}`]).toBeFalsy();
    expect(main.classes['cyan-null']).toBeFalsy();
  });

  it('should use no theme when customAccentColor exists and theme is null', () => {
    themeProducer.next(null);
    customAccentColorProducer.next('green');
    fixture.detectChanges();
    const main = fixture.debugElement.query(By.css('.showtunes-app'));
    expect(main.classes[Theme.Light]).toBeFalsy();
    expect(main.classes[Theme.Dark]).toBeFalsy();
    expect(main.classes[`green-${Theme.Light}`]).toBeFalsy();
    expect(main.classes[`green-${Theme.Dark}`]).toBeFalsy();
    expect(main.classes['green-null']).toBeFalsy();
  });

  it('should show cursor when not fading and not inactive', () => {
    const main = fixture.debugElement.query(By.css('.showtunes-app'));
    app.fadePlayerControls = false;
    inactiveProducer.next(false);
    fixture.detectChanges();
    expect(main.styles.cursor).toEqual('inherit');
  });

  it('should show cursor when not fading and inactive', () => {
    const main = fixture.debugElement.query(By.css('.showtunes-app'));
    app.fadePlayerControls = false;
    inactiveProducer.next(true);
    fixture.detectChanges();
    expect(main.styles.cursor).toEqual('inherit');
  });

  it('should show cursor when fading and not inactive', () => {
    const main = fixture.debugElement.query(By.css('.showtunes-app'));
    app.fadePlayerControls = true;
    inactiveProducer.next(false);
    fixture.detectChanges();
    expect(main.styles.cursor).toEqual('inherit');
  });

  it('should not show cursor when fading and inactive', () => {
    const main = fixture.debugElement.query(By.css('.showtunes-app'));
    app.fadePlayerControls = true;
    inactiveProducer.next(true);
    fixture.detectChanges();
    expect(main.styles.cursor).toEqual('none');
  });

  it('should default to not fading cursor', () => {
    expect(app.fadePlayerControls).toEqual(false);
    expect(app.fadeCursor).toEqual(false);
  });

  it('should set to show cursor when PlayerControlsOption.On is set', () => {
    showPlayerControlsProducer.next(PlayerControlsOptions.On);
    expect(app.fadePlayerControls).toBeFalse();
    expect(app.fadeCursor).toBeFalse();
  });

  it('should set to fade cursor when PlayerControlsOption.Fade is set', () => {
    showPlayerControlsProducer.next(PlayerControlsOptions.Fade);
    expect(app.fadePlayerControls).toBeTrue();
    expect(app.fadeCursor).toBeFalse();
  });

  it('should set to fade cursor when PlayerControlsOption.Off is set', () => {
    showPlayerControlsProducer.next(PlayerControlsOptions.Off);
    expect(app.fadePlayerControls).toBeTrue();
    expect(app.fadeCursor).toBeFalse();
  });

  it('should set cursor to visible when it is no longer fading but currently hidden', () => {
    app.fadePlayerControls = true;
    app.fadeCursor = true;
    showPlayerControlsProducer.next(PlayerControlsOptions.On);
    themeProducer.next('test');
    expect(app.fadePlayerControls).toBeFalse();
    expect(app.fadeCursor).toBeFalse();
  });
});
