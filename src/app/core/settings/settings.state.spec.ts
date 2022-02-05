import { OverlayContainer } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { MockProvider } from 'ng-mocks';
import {
  ChangePlayerControls,
  ChangeSpotifyCodeBackgroundColor,
  ChangeSpotifyCodeBarColor,
  ChangeTheme,
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
        showPlayerControls: PlayerControlsOptions.On,
        showPlaylistName: true,
        showSpotifyCode: true,
        useSmartCodeColor: true,
        spotifyCode: {
          backgroundColor: 'FFFFFF',
          barColor: 'black'
        }
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

  it('should select spotifyCode.backgroundColor', () => {
    const backgroundColor = selectSpotifyCodeBackgroundColor(store);
    expect(backgroundColor).toEqual('FFFFFF');
  });

  it('should select spotifyCode.barColor', () => {
    const barColor = selectSpotifyCodeBarColor(store);
    expect(barColor).toEqual('black');
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
    store.reset({
      ...store.snapshot(),
      SHOWTUNES_SETTINGS: {
        showPlaylistName: false
      }
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
    store.reset({
      ...store.snapshot(),
      SHOWTUNES_SETTINGS: {
        showSpotifyCode: false
      }
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
    store.reset({
      ...store.snapshot(),
      SHOWTUNES_SETTINGS: {
        useSmartCodeColor: false
      }
    });
    store.dispatch(new ToggleSmartCodeColor());
    const useSmartCodeColor = selectUseSmartCodeColor(store);
    expect(useSmartCodeColor).toBeTrue();
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
});

function selectTheme(store: Store): string {
  return store.selectSnapshot(state => state[SETTINGS_STATE_NAME].theme);
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

function selectSpotifyCodeBackgroundColor(store: Store): string {
  return store.selectSnapshot(state => state[SETTINGS_STATE_NAME].spotifyCode.backgroundColor);
}

function selectSpotifyCodeBarColor(store: Store): string {
  return store.selectSnapshot(state => state[SETTINGS_STATE_NAME].spotifyCode.barColor);
}
