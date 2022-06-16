import { OverlayContainer } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { MockProvider } from 'ng-mocks';
import {
  ChangeCustomAccentColor,
  ChangeDynamicAccentColor,
  ChangePlayerControls,
  ChangeSmartColor,
  ChangeSpotifyCodeBackgroundColor,
  ChangeSpotifyCodeBarColor,
  ChangeTheme,
  ToggleDynamicThemeAccent,
  TogglePlaylistName,
  ToggleSmartCodeColor,
  ToggleSpotifyCode
} from './settings.actions';
import { PlayerControlsOptions, SETTINGS_STATE_NAME } from './settings.model';
import { SettingsState } from './settings.state';

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
        theme: 'dark-theme',
        customAccentColor: null,
        showPlayerControls: PlayerControlsOptions.On,
        showPlaylistName: true,
        showSpotifyCode: true,
        useSmartCodeColor: true,
        smartColor: 'ABC123',
        spotifyCode: {
          backgroundColor: 'FFFFFF',
          barColor: 'black'
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
    expect(theme).toEqual('dark-theme');
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

  it('should select useSmartCodeColor', () => {
    const useSmartCodeColor = selectUseSmartCodeColor(store);
    expect(useSmartCodeColor).toBeTrue();
  });

  it('should select smartColor', () => {
    const smartColor = selectSmartColor(store);
    expect(smartColor).toEqual('ABC123');
  });

  it('should select spotifyCode.backgroundColor', () => {
    const backgroundColor = selectSpotifyCodeBackgroundColor(store);
    expect(backgroundColor).toEqual('FFFFFF');
  });

  it('should select spotifyCode.barColor', () => {
    const barColor = selectSpotifyCodeBarColor(store);
    expect(barColor).toEqual('black');
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
    store.dispatch(new ChangeTheme('light-theme'));
    const theme = selectTheme(store);
    expect(theme).toEqual('light-theme');
  });

  it('should remove existing theme and add new theme to overlayContainer on change theme', () => {
    element.classList.add('dark-theme');
    store.dispatch(new ChangeTheme('light-theme'));
    expect(element.classList.length).toEqual(1);
    expect(element.classList.contains('light-theme')).toBeTrue();
  });

  it('should change customAccentColor', () => {
    store.dispatch(new ChangeCustomAccentColor('cyan'));
    const customAccentColor = selectCustomAccentColor(store);
    expect(customAccentColor).toEqual('cyan');
  });

  it('should remove existing theme and add new custom accent theme to overlayContainer on change customAccentColor', () => {
    element.classList.add('dark-theme');
    setState(store, {
      theme: 'light-theme'
    });
    store.dispatch(new ChangeCustomAccentColor('cyan'));
    expect(element.classList.length).toEqual(1);
    expect(element.classList.contains('cyan-light-theme')).toBeTrue();
  });

  it('should use the dynamic accent theme when customAccentColor is changed', () => {
    setState(store, {
      theme: 'light-theme',
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

  it('should toggle useSmartCodeColor off', () => {
    store.dispatch(new ToggleSmartCodeColor());
    const useSmartCodeColor = selectUseSmartCodeColor(store);
    expect(useSmartCodeColor).toBeFalse();
  });

  it('should toggle useSmartCodeColor on', () => {
    setState(store, {
      useSmartCodeColor: false
    });
    store.dispatch(new ToggleSmartCodeColor());
    const useSmartCodeColor = selectUseSmartCodeColor(store);
    expect(useSmartCodeColor).toBeTrue();
  });

  it('should change the smartColor if useDynamicThemeAccent', () => {
    setState(store, {
      useDynamicThemeAccent: true,
      useSmartCodeColor: false
    });
    store.dispatch(new ChangeSmartColor('DEF789'));
    const smartColor = selectSmartColor(store);
    expect(smartColor).toEqual('DEF789');
  });

  it('should change the smartColor if useSmartCodeColor', () => {
    setState(store, {
      useDynamicThemeAccent: false,
      useSmartCodeColor: true
    });
    store.dispatch(new ChangeSmartColor('DEF789'));
    const smartColor = selectSmartColor(store);
    expect(smartColor).toEqual('DEF789');
  });

  it('should set smartColor and dynamicAccentColor to null if not useDynamicThemeAccent and not useSmartCodeColor', () => {
    setState(store, {
      useDynamicThemeAccent: false,
      useSmartCodeColor: false
    });
    store.dispatch(new ChangeSmartColor('!@#'));
    const smartColor = selectSmartColor(store);
    const dynamicAccentColor = selectDynamicAccentColor(store);
    expect(smartColor).toBeNull();
    expect(dynamicAccentColor).toBeNull();
  });

  it('should set smartColor and dynamicAccentColor to null if not valid hex', () => {
    setState(store, {
      useDynamicThemeAccent: true
    });
    store.dispatch(new ChangeSmartColor('!@#'));
    const smartColor = selectSmartColor(store);
    const dynamicAccentColor = selectDynamicAccentColor(store);
    expect(smartColor).toBeNull();
    expect(dynamicAccentColor).toBeNull();
  });

  it('should change the smartColor add a dynamicAccentColor if useDynamicThemeAccent', () => {
    setState(store, {
      useDynamicThemeAccent: true,
      dynamicAccentColor: null
    });
    store.dispatch(new ChangeSmartColor('456ABC'));
    const smartColor = selectSmartColor(store);
    const dynamicAccentColor = selectDynamicAccentColor(store);
    expect(smartColor).toEqual('456ABC');
    expect(dynamicAccentColor).toEqual('indigo');
  });

  it('should update the overlayContainer with a valid dynamicAccentColor', () => {
    setState(store, {
      theme: 'dark-theme',
      customAccentColor: 'cyan',
      useDynamicThemeAccent: true
    });
    store.dispatch(new ChangeSmartColor('456ABC'));
    expect(element.classList.length).toEqual(1);
    expect(element.classList.contains('indigo-dark-theme')).toBeTrue();
  });

  it('should change spotifyCode.backgroundColor', () => {
    store.dispatch(new ChangeSpotifyCodeBackgroundColor('123456'));
    const backgroundColor = selectSpotifyCodeBackgroundColor(store);
    const barColor = selectSpotifyCodeBarColor(store);
    expect(backgroundColor).toEqual('123456');
    expect(barColor).toEqual('black');
  });

  it('should change spotifyCode.barColor', () => {
    store.dispatch(new ChangeSpotifyCodeBarColor('white'));
    const backgroundColor = selectSpotifyCodeBackgroundColor(store);
    const barColor = selectSpotifyCodeBarColor(store);
    expect(backgroundColor).toEqual('FFFFFF');
    expect(barColor).toEqual('white');
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
      smartColor: '456ABC',
      useDynamicThemeAccent: false,
      dynamicAccentColor: null
    });
    store.dispatch(new ToggleDynamicThemeAccent());
    const useDynamicThemeAccent = selectUseDynamicThemeAccent(store);
    const dynamicAccentColor = selectDynamicAccentColor(store);
    expect(useDynamicThemeAccent).toBeTrue();
    expect(dynamicAccentColor).toEqual('indigo');
  });

  it('should update the overlay container with new dynamicAccentColor when useDynamicThemeAccent', () => {
    setState(store, {
      theme: 'light-theme',
      customAccentColor: 'cyan',
      smartColor: '456ABC',
      useDynamicThemeAccent: false
    });
    store.dispatch(new ToggleDynamicThemeAccent());
    expect(element.classList.length).toEqual(1);
    expect(element.classList.contains('indigo-light-theme')).toBeTrue();
  });

  it('should change dynamicAccentColor', () => {
    store.dispatch(new ChangeDynamicAccentColor('cyan'));
    const dynamicAccentColor = selectDynamicAccentColor(store);
    expect(dynamicAccentColor).toEqual('cyan');
  });

  it('should update overlayContainer on dynamicAccentColor change', () => {
    setState(store, {
      theme: 'light-theme',
      customAccentColor: 'blue'
    });
    store.dispatch(new ChangeDynamicAccentColor('cyan'));
    expect(element.classList.length).toEqual(1);
    expect(element.classList.contains('cyan-light-theme')).toBeTrue();
  });

  it('should update overlayContainer on dynamicAccentColor change to null', () => {
    setState(store, {
      theme: 'light-theme',
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

function selectUseSmartCodeColor(store: Store): boolean {
  return store.selectSnapshot(state => state[SETTINGS_STATE_NAME].useSmartCodeColor);
}

function selectSmartColor(store: Store): string {
  return store.selectSnapshot(state => state[SETTINGS_STATE_NAME].smartColor);
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
