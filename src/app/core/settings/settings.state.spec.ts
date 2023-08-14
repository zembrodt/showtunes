import { OverlayContainer } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { MockProvider } from 'ng-mocks';
import { DominantColor } from '../dominant-color/dominant-color-finder';
import { FontColor } from '../util';
import {
  ChangeCustomAccentColor,
  ChangeDynamicAccentColor,
  ChangeDynamicColor,
  ChangePlayerControls,
  ChangeSpotifyCodeBackgroundColor,
  ChangeSpotifyCodeBarColor,
  ChangeTheme,
  ToggleDynamicCodeColor,
  ToggleDynamicThemeAccent,
  TogglePlaylistName,
  ToggleSpotifyCode
} from './settings.actions';
import { PlayerControlsOptions, SETTINGS_STATE_NAME, Theme } from './settings.model';
import { SettingsState } from './settings.state';

const TEST_DOMINANT_COLOR: DominantColor = {
  hex: 'DEF789',
  rgb: {
    r: 222,
    g: 247,
    b: 137,
    a: 255
  },
  foregroundFontColor: FontColor.White
};

describe('SettingsState', () => {
  let store: Store;
  let overlay: OverlayContainer;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([SettingsState], {developmentMode: true})
      ],
      providers: [
        MockProvider(OverlayContainer)
      ]
    });
    store = TestBed.inject(Store);
    store.reset({
      ...store.snapshot(),
      SHOWTUNES_SETTINGS: {
        theme: Theme.Dark,
        customAccentColor: null,
        showPlayerControls: PlayerControlsOptions.On,
        showPlaylistName: true,
        showSpotifyCode: true,
        useDynamicCodeColor: true,
        dynamicColor: 'ABC123',
        spotifyCode: {
          backgroundColor: 'FFFFFF',
          barColor: FontColor.Black
        },
        useDynamicThemeAccent: false,
        dynamicAccentColor: null
      }
    });
    overlay = TestBed.inject(OverlayContainer);
    element = document.createElement('test');
    overlay.getContainerElement = jasmine.createSpy().and.returnValue(element);
  });

  it('should select theme', () => {
    const theme = selectTheme(store);
    expect(theme).toEqual(Theme.Dark);
  });

  it('should select customAccentColor', () => {
    setState(store, {
      customAccentColor: 'blue'
    });
    const customAccentColor = selectCustomAccentColor(store);
    expect(customAccentColor).toEqual('blue');
  });

  it('should select showPlayControls', () => {
    const showPlayerControls = selectShowPlayerControls(store);
    expect(showPlayerControls).toEqual(PlayerControlsOptions.On);
  });

  it('should select showPlaylistName', () => {
    const showPlaylistName = selectShowPlaylistName(store);
    expect(showPlaylistName).toBeTrue();
  });

  it('should select showSpotifyCode', () => {
    const showSpotifyCode = selectShowSpotifyCode(store);
    expect(showSpotifyCode).toBeTrue();
  });

  it('should select useDynamicCodeColor', () => {
    const useDynamicCodeColor = selectUseDynamicCodeColor(store);
    expect(useDynamicCodeColor).toBeTrue();
  });

  it('should select dynamicColor', () => {
    const dynamicColor = selectDynamicColor(store);
    expect(dynamicColor).toEqual('ABC123');
  });

  it('should select spotifyCode.backgroundColor', () => {
    const backgroundColor = selectSpotifyCodeBackgroundColor(store);
    expect(backgroundColor).toEqual('FFFFFF');
  });

  it('should select spotifyCode.barColor', () => {
    const barColor = selectSpotifyCodeBarColor(store);
    expect(barColor).toEqual(FontColor.Black);
  });

  it('should select useDynamicThemeAccent', () => {
    setState(store, {
      useDynamicThemeAccent: true
    });
    const useDynamicThemeAccent = selectUseDynamicThemeAccent(store);
    expect(useDynamicThemeAccent).toBeTrue();
  });

  it('should select dynamicAccentColor', () => {
    setState(store, {
      dynamicAccentColor: 'cyan'
    });
    const dynamicAccentColor = selectDynamicAccentColor(store);
    expect(dynamicAccentColor).toEqual('cyan');
  });

  it('should change theme', () => {
    store.dispatch(new ChangeTheme(Theme.Light));
    const theme = selectTheme(store);
    expect(theme).toEqual(Theme.Light);
  });

  it('should remove existing theme and add new theme to overlayContainer on change theme', () => {
    element.classList.add(Theme.Dark);
    store.dispatch(new ChangeTheme(Theme.Light));
    expect(element.classList.length).toEqual(1);
    expect(element.classList.contains(Theme.Light)).toBeTrue();
  });

  it('should change customAccentColor', () => {
    store.dispatch(new ChangeCustomAccentColor('cyan'));
    const customAccentColor = selectCustomAccentColor(store);
    expect(customAccentColor).toEqual('cyan');
  });

  it('should remove existing theme and add new custom accent theme to overlayContainer on change customAccentColor', () => {
    element.classList.add(Theme.Dark);
    setState(store, {
      theme: Theme.Light
    });
    store.dispatch(new ChangeCustomAccentColor('cyan'));
    expect(element.classList.length).toEqual(1);
    expect(element.classList.contains('cyan-light-theme')).toBeTrue();
  });

  it('should use the dynamic accent theme when customAccentColor is changed', () => {
    setState(store, {
      theme: Theme.Light,
      dynamicAccentColor: 'blue'
    });
    store.dispatch(new ChangeCustomAccentColor('cyan'));
    expect(element.classList.length).toEqual(1);
    expect(element.classList.contains('blue-light-theme')).toBeTrue();
  });

  it('should change showPlayerControls', () => {
    store.dispatch(new ChangePlayerControls(PlayerControlsOptions.Off));
    const showPlayerControls = selectShowPlayerControls(store);
    expect(showPlayerControls).toEqual(PlayerControlsOptions.Off);
  });

  it('should toggle showPlaylistName off', () => {
    store.dispatch(new TogglePlaylistName());
    const showPlaylistName = selectShowPlaylistName(store);
    expect(showPlaylistName).toBeFalse();
  });

  it('should toggle showPlaylistName on', () => {
    setState(store, {
      showPlaylistName: false
    });
    store.dispatch(new TogglePlaylistName());
    const showPlaylistName = selectShowPlaylistName(store);
    expect(showPlaylistName).toBeTrue();
  });

  it('should toggle showSpotifyCode off', () => {
    store.dispatch(new ToggleSpotifyCode());
    const showSpotifyCode = selectShowSpotifyCode(store);
    expect(showSpotifyCode).toBeFalse();
  });

  it('should toggle showSpotifyCode on', () => {
    setState(store, {
      showSpotifyCode: false
    });
    store.dispatch(new ToggleSpotifyCode());
    const showSpotifyCode = selectShowSpotifyCode(store);
    expect(showSpotifyCode).toBeTrue();
  });

  it('should toggle useDynamicCodeColor off', () => {
    store.dispatch(new ToggleDynamicCodeColor());
    const useDynamicCodeColor = selectUseDynamicCodeColor(store);
    expect(useDynamicCodeColor).toBeFalse();
  });

  it('should toggle useDynamicCodeColor on', () => {
    setState(store, {
      useDynamicCodeColor: false
    });
    store.dispatch(new ToggleDynamicCodeColor());
    const useDynamicCodeColor = selectUseDynamicCodeColor(store);
    expect(useDynamicCodeColor).toBeTrue();
  });

  it('should update the dynamicColor', () => {
    store.dispatch(new ChangeDynamicColor(TEST_DOMINANT_COLOR));
    const dynamicColor = selectDynamicColor(store);
    expect(dynamicColor).toEqual(TEST_DOMINANT_COLOR);
  });

  it('should update dynamicAccentColor if when dynamicColor updated', () => {
    store.dispatch(new ChangeDynamicColor(TEST_DOMINANT_COLOR));
    const accentColor = selectDynamicAccentColor(store);
    expect(accentColor).toEqual('gray');
  });

  it('should set dynamicColor and dynamicAccentColor to null if dynamicColor is updated with non-color hex value', () => {
    setState(store, {
      dynamicColor: {},
      dynamicAccentColor: 'test-color'
    });
    const dominantColor: DominantColor = {
      ...TEST_DOMINANT_COLOR,
      hex: 'badhex'
    };
    store.dispatch(new ChangeDynamicColor(dominantColor));
    const dynamicColor = selectDynamicColor(store);
    const dynamicAccentColor = selectDynamicAccentColor(store);
    expect(dynamicColor).toBeNull();
    expect(dynamicAccentColor).toBeNull();
  });

  it('should set dynamicColor and dynamicAccentColor to null if dynamicColor is updated with null', () => {
    setState(store, {
      dynamicColor: {},
      dynamicAccentColor: 'test-color'
    });
    store.dispatch(new ChangeDynamicColor(null));
    const dynamicColor = selectDynamicColor(store);
    const dynamicAccentColor = selectDynamicAccentColor(store);
    expect(dynamicColor).toBeNull();
    expect(dynamicAccentColor).toBeNull();
  });

  it('should update the overlayContainer with a valid dynamicAccentColor when dynamicColor is updated', () => {
    setState(store, {
      theme: Theme.Dark,
      customAccentColor: 'cyan',
      useDynamicThemeAccent: true
    });
    store.dispatch(new ChangeDynamicColor(TEST_DOMINANT_COLOR));
    expect(element.classList.length).toEqual(1);
    console.log(element.classList);
    expect(element.classList.contains('gray-dark-theme')).toBeTrue();
  });

  it('should change spotifyCode.backgroundColor', () => {
    store.dispatch(new ChangeSpotifyCodeBackgroundColor('123456'));
    const backgroundColor = selectSpotifyCodeBackgroundColor(store);
    const barColor = selectSpotifyCodeBarColor(store);
    expect(backgroundColor).toEqual('123456');
    expect(barColor).toEqual(FontColor.Black);
  });

  it('should change spotifyCode.barColor', () => {
    store.dispatch(new ChangeSpotifyCodeBarColor(FontColor.White));
    const backgroundColor = selectSpotifyCodeBackgroundColor(store);
    const barColor = selectSpotifyCodeBarColor(store);
    expect(backgroundColor).toEqual('FFFFFF');
    expect(barColor).toEqual(FontColor.White);
  });

  it('should toggle useDynamicThemeAccent off and set dynamicAccentColor to null', () => {
    setState(store, {
      useDynamicThemeAccent: true
    });
    store.dispatch(new ToggleDynamicThemeAccent());
    const useDynamicThemeAccent = selectUseDynamicThemeAccent(store);
    const dynamicAccentColor = selectDynamicAccentColor(store);
    expect(useDynamicThemeAccent).toBeFalse();
    expect(dynamicAccentColor).toBeNull();
  });

  it('should toggle useDynamicThemeAccent on and set dynamicAccentColor', () => {
    setState(store, {
      dynamicColor: TEST_DOMINANT_COLOR,
      useDynamicThemeAccent: false,
      dynamicAccentColor: null
    });
    store.dispatch(new ToggleDynamicThemeAccent());
    const useDynamicThemeAccent = selectUseDynamicThemeAccent(store);
    const dynamicAccentColor = selectDynamicAccentColor(store);
    expect(useDynamicThemeAccent).toBeTrue();
    expect(dynamicAccentColor).toEqual('gray');
  });

  it('should update the overlayContainer with new dynamicAccentColor when useDynamicThemeAccent', () => {
    setState(store, {
      theme: Theme.Light,
      customAccentColor: 'cyan',
      dynamicColor: TEST_DOMINANT_COLOR,
      useDynamicThemeAccent: false
    });
    store.dispatch(new ToggleDynamicThemeAccent());
    expect(element.classList.length).toEqual(1);
    expect(element.classList.contains('gray-light-theme')).toBeTrue();
  });

  it('should change dynamicAccentColor', () => {
    store.dispatch(new ChangeDynamicAccentColor('cyan'));
    const dynamicAccentColor = selectDynamicAccentColor(store);
    expect(dynamicAccentColor).toEqual('cyan');
  });

  it('should update overlayContainer on dynamicAccentColor change', () => {
    setState(store, {
      theme: Theme.Light,
      customAccentColor: 'blue'
    });
    store.dispatch(new ChangeDynamicAccentColor('cyan'));
    expect(element.classList.length).toEqual(1);
    expect(element.classList.contains('cyan-light-theme')).toBeTrue();
  });

  it('should update overlayContainer on dynamicAccentColor change to null', () => {
    setState(store, {
      theme: Theme.Light,
      customAccentColor: 'blue'
    });
    store.dispatch(new ChangeDynamicAccentColor(null));
    expect(element.classList.length).toEqual(1);
    expect(element.classList.contains('blue-light-theme')).toBeTrue();
  });
});

function selectTheme(store: Store): string {
  return store.selectSnapshot(state => state[SETTINGS_STATE_NAME].theme);
}

function selectCustomAccentColor(store: Store): string {
  return store.selectSnapshot(state => state[SETTINGS_STATE_NAME].customAccentColor);
}

function selectShowPlayerControls(store: Store): PlayerControlsOptions {
  return store.selectSnapshot(state => state[SETTINGS_STATE_NAME].showPlayerControls);
}

function selectShowPlaylistName(store: Store): boolean {
  return store.selectSnapshot(state => state[SETTINGS_STATE_NAME].showPlaylistName);
}

function selectShowSpotifyCode(store: Store): boolean {
  return store.selectSnapshot(state => state[SETTINGS_STATE_NAME].showSpotifyCode);
}

function selectUseDynamicCodeColor(store: Store): boolean {
  return store.selectSnapshot(state => state[SETTINGS_STATE_NAME].useDynamicCodeColor);
}

function selectDynamicColor(store: Store): string {
  return store.selectSnapshot(state => state[SETTINGS_STATE_NAME].dynamicColor);
}

function selectSpotifyCodeBackgroundColor(store: Store): string {
  return store.selectSnapshot(state => state[SETTINGS_STATE_NAME].spotifyCode.backgroundColor);
}

function selectSpotifyCodeBarColor(store: Store): string {
  return store.selectSnapshot(state => state[SETTINGS_STATE_NAME].spotifyCode.barColor);
}

function selectUseDynamicThemeAccent(store: Store): boolean {
  return store.selectSnapshot(state => state[SETTINGS_STATE_NAME].useDynamicThemeAccent);
}

function selectDynamicAccentColor(store: Store): string {
  return store.selectSnapshot(state => state[SETTINGS_STATE_NAME].dynamicAccentColor);
}

function setState(store: Store, state: any): void {
  store.reset({
    ...store.snapshot(),
    SHOWTUNES_SETTINGS: state
  });
}
