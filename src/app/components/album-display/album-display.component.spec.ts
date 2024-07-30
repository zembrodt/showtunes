/* tslint:disable:no-string-literal */

import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpClient } from '@angular/common/http';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, waitForAsync } from '@angular/core/testing';
import { FlexLayoutModule } from '@angular/flex-layout';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { MatProgressBar, MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule, MatSpinner } from '@angular/material/progress-spinner';
import { By } from '@angular/platform-browser';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxsModule, Store } from '@ngxs/store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { AppConfig } from '../../app.config';
import { DominantColor, DominantColorFinder } from '../../core/dominant-color/dominant-color-finder';
import { AlbumModel, PlayerState, TrackModel } from '../../core/playback/playback.model';
import { ChangeDynamicColor } from '../../core/settings/settings.actions';
import { NgxsSelectorMock } from '../../core/testing/ngxs-selector-mock';
import { getTestAlbumModel, getTestDominantColor, getTestTrackModel } from '../../core/testing/test-models';
import { getTestImageResponse } from '../../core/testing/test-responses';
import { ImageResponse } from '../../models/image.model';
import { AlbumDisplayComponent } from './album-display.component';

describe('AlbumDisplayComponent', () => {
  const mockSelectors = new NgxsSelectorMock<AlbumDisplayComponent>();
  let component: AlbumDisplayComponent;
  let fixture: ComponentFixture<AlbumDisplayComponent>;
  let loader: HarnessLoader;
  let store: Store;

  let coverArtProducer: BehaviorSubject<ImageResponse>;
  let trackProducer: BehaviorSubject<TrackModel>;
  let albumProducer: BehaviorSubject<AlbumModel>;
  let playerStateProducer: BehaviorSubject<PlayerState>;
  let useDynamicCodeColorProducer: BehaviorSubject<boolean>;
  let dynamicColorProducer: BehaviorSubject<DominantColor>;
  let showSpotifyCodeProducer: BehaviorSubject<boolean>;
  let backgroundColorProducer: BehaviorSubject<string>;
  let barColorProducer: BehaviorSubject<string>;
  let useDynamicThemeAccentProducer: BehaviorSubject<boolean>;

  let mockDominantColorFinder: MockDominantColorFinder;

  beforeAll(() => {
    AppConfig.settings = {
      env: {
        spotifyApiUrl: null,
        spotifyAccountsUrl: null,
        name: null,
        domain: null
      },
      auth: null
    };
  });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AlbumDisplayComponent ],
      imports: [
        FlexLayoutModule,
        FontAwesomeModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        NgxsModule.forRoot([], { developmentMode: true })
      ],
      providers: [
        {
          provide: AppConfig,
          deps: [ MockProvider(HttpClient) ]
        },
        MockProvider(Store)
      ]
    }).compileComponents();
    store = TestBed.inject(Store);

    fixture = TestBed.createComponent(AlbumDisplayComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);

    coverArtProducer = mockSelectors.defineNgxsSelector<ImageResponse>(component, 'coverArt$');
    trackProducer = mockSelectors.defineNgxsSelector<TrackModel>(component, 'track$');
    albumProducer = mockSelectors.defineNgxsSelector<AlbumModel>(component, 'album$');
    playerStateProducer = mockSelectors.defineNgxsSelector<PlayerState>(component, 'playerState$');
    useDynamicCodeColorProducer = mockSelectors.defineNgxsSelector<boolean>(component, 'useDynamicCodeColor$');
    dynamicColorProducer = mockSelectors.defineNgxsSelector<DominantColor>(component, 'dynamicColor$');
    showSpotifyCodeProducer = mockSelectors.defineNgxsSelector<boolean>(component, 'showSpotifyCode$');
    backgroundColorProducer = mockSelectors.defineNgxsSelector<string>(component, 'backgroundColor$');
    barColorProducer = mockSelectors.defineNgxsSelector<string>(component, 'barColor$');
    useDynamicThemeAccentProducer = mockSelectors.defineNgxsSelector<boolean>(component, 'useDynamicThemeAccent$');

    mockDominantColorFinder = new MockDominantColorFinder();
    component['dominantColorFinder'] = mockDominantColorFinder;

    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the cover art', () => {
    coverArtProducer.next(getTestImageResponse());
    albumProducer.next(getTestAlbumModel());
    fixture.detectChanges();
    const link = fixture.debugElement.query(By.css('a'));
    const img = fixture.debugElement.query(By.css('img'));
    expect(link).toBeTruthy();
    expect(link.properties.href).toBeTruthy();
    expect(link.properties.href).toEqual(getTestAlbumModel().href);
    expect(img).toBeTruthy();
    expect(img.properties.src).toBeTruthy();
    expect(img.properties.src).toEqual(getTestImageResponse().url);
  });

  it('should display a loading spinner when no coverArt and is not idle', () => {
    playerStateProducer.next(PlayerState.Playing);
    fixture.detectChanges();
    const spinner = fixture.debugElement.query(By.directive(MatSpinner));
    expect(spinner).toBeTruthy();
  });

  it('should display a loading spinner when coverArt.url is null and is not idle', () => {
    const nullCoverArt = getTestImageResponse();
    nullCoverArt.url = null;
    coverArtProducer.next(nullCoverArt);
    playerStateProducer.next(PlayerState.Playing);
    fixture.detectChanges();
    const spinner = fixture.debugElement.query(By.directive(MatSpinner));
    expect(spinner).toBeTruthy();
  });

  it('should display start Spotify message when no coverArt and is idle', () => {
    playerStateProducer.next(PlayerState.Idling);
    fixture.detectChanges();
    const msg = fixture.debugElement.query(By.css('span'));
    expect(msg.nativeElement.textContent).toBeTruthy();
    expect(msg.nativeElement.textContent.trim()).toEqual('Start Spotify to display music!');
  });

  it('should display start Spotify message when coverArt.url is null and is idle', () => {
    const nullCoverArt = getTestImageResponse();
    nullCoverArt.url = null;
    coverArtProducer.next(nullCoverArt);
    playerStateProducer.next(PlayerState.Idling);
    fixture.detectChanges();
    const msg = fixture.debugElement.query(By.css('span'));
    expect(msg.nativeElement.textContent).toBeTruthy();
    expect(msg.nativeElement.textContent.trim()).toEqual('Start Spotify to display music!');
  });

  it('should display the Spotify code', () => {
    component.spotifyCodeUrl = 'test-spotify-code-url';
    showSpotifyCodeProducer.next(true);
    fixture.detectChanges();
    const img = fixture.debugElement.query(By.css('img'));
    expect(img).toBeTruthy();
    expect(img.properties.src).toBeTruthy();
    expect(img.properties.src).toEqual('test-spotify-code-url');
  });

  it('should display Spotify code loading when showing code and no URL and not idle', () => {
    showSpotifyCodeProducer.next(true);
    playerStateProducer.next(PlayerState.Playing);
    fixture.detectChanges();
    const icon = fixture.debugElement.query(By.css('fa-icon'));
    const loading = fixture.debugElement.query(By.directive(MatProgressBar));
    expect(icon).toBeTruthy();
    expect(loading).toBeTruthy();
  });

  it('should only display Spotify code icon when showing code and no URL and is idle', () => {
    showSpotifyCodeProducer.next(true);
    playerStateProducer.next(PlayerState.Idling);
    fixture.detectChanges();
    const icon = fixture.debugElement.query(By.css('fa-icon'));
    const loading = fixture.debugElement.query(By.directive(MatProgressBar));
    expect(icon).toBeTruthy();
    expect(loading).toBeFalsy();
  });

  it('should not display Spotify code when set to not show', () => {
    component.spotifyCodeUrl = 'test-url';
    showSpotifyCodeProducer.next(false);
    fixture.detectChanges();
    const img = fixture.debugElement.query(By.css('img'));
    const icon = fixture.debugElement.query(By.css('fa-icon'));
    const loading = fixture.debugElement.query(By.directive(MatProgressBar));
    expect(img).toBeFalsy();
    expect(icon).toBeFalsy();
    expect(loading).toBeFalsy();
  });

  it('should set Spotify code URL when the track$ is updated', () => {
    component['setSpotifyCodeUrl'] = jasmine.createSpy();
    trackProducer.next(getTestTrackModel());
    fixture.detectChanges();
    expect(component['setSpotifyCodeUrl']).toHaveBeenCalled();
  });

  it('should update dynamic color when coverArt$ is updated and dominantColorFinder returns a result', fakeAsync(() => {
    mockDominantColorFinder.expects(Promise.resolve(getTestDominantColor()));
    coverArtProducer.next(getTestImageResponse());
    flushMicrotasks();
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDynamicColor(getTestDominantColor()));
  }));

  it('should set dynamic color to null when coverArt$ is updated and dominantColorFinder returns null', fakeAsync(() => {
    mockDominantColorFinder.expects(Promise.resolve(null));
    coverArtProducer.next(getTestImageResponse());
    flushMicrotasks();
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDynamicColor(null));
  }));

  it('should set dynamic color to null when coverArt$ is updated and dominantColorFinder returns an invalid hex', fakeAsync(() => {
    mockDominantColorFinder.expects(Promise.resolve({
      ...getTestDominantColor(),
      hex: 'bad-hex'
    }));
    coverArtProducer.next(getTestImageResponse());
    flushMicrotasks();
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDynamicColor(null));
  }));

  it('should set dynamic color to null when coverArt$ is updated and dominantColorFinder rejects its promise', fakeAsync(() => {
    mockDominantColorFinder.expects(Promise.reject('test-error'));
    spyOn(console, 'error');
    coverArtProducer.next(getTestImageResponse());
    flushMicrotasks();
    expect(console.error).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDynamicColor(null));
  }));

  it('should set Spotify code URL when the backgroundColor$ is updated', () => {
    component['setSpotifyCodeUrl'] = jasmine.createSpy();
    backgroundColorProducer.next('bg-color');
    fixture.detectChanges();
    expect(component['setSpotifyCodeUrl']).toHaveBeenCalled();
  });

  it('should set Spotify code URL when the barColor$ is updated', () => {
    component['setSpotifyCodeUrl'] = jasmine.createSpy();
    barColorProducer.next('bar-color');
    fixture.detectChanges();
    expect(component['setSpotifyCodeUrl']).toHaveBeenCalled();
  });

  it('should set Spotify code URL when useDynamicCodeColor$ is updated', () => {
    component['setSpotifyCodeUrl'] = jasmine.createSpy();
    useDynamicCodeColorProducer.next(true);
    fixture.detectChanges();
    expect(component['setSpotifyCodeUrl']).toHaveBeenCalled();
  });

  it('should set Spotify code URL when dynamicColor$ is updated', () => {
    component['setSpotifyCodeUrl'] = jasmine.createSpy();
    dynamicColorProducer.next(getTestDominantColor());
    expect(component['setSpotifyCodeUrl']).toHaveBeenCalled();
  });

  it('should create a Spotify code URL', () => {
    backgroundColorProducer.next('bg-color');
    barColorProducer.next('bar-color');
    trackProducer.next(getTestTrackModel());
    fixture.detectChanges();
    expect(component.spotifyCodeUrl).toEqual('https://www.spotifycodes.com/downloadCode.php?uri=jpeg%2F' +
      `bg-color%2Fbar-color%2F512%2F${encodeURIComponent(getTestTrackModel().uri)}`);
  });

  it('should create a Spotify code URL with expanded background color of length 3', () => {
    backgroundColorProducer.next('ABC');
    barColorProducer.next('bar-color');
    trackProducer.next(getTestTrackModel());
    fixture.detectChanges();
    expect(component.spotifyCodeUrl).toEqual('https://www.spotifycodes.com/downloadCode.php?uri=jpeg%2' +
      `FAABBCC%2Fbar-color%2F512%2F${encodeURIComponent(getTestTrackModel().uri)}`);
  });

  it('should not create Spotify code URL with no background color', () => {
    barColorProducer.next('bar-color');
    trackProducer.next(getTestTrackModel());
    fixture.detectChanges();
    expect(component.spotifyCodeUrl).toBeNull();
  });

  it('should not create Spotify code URL with no bar color', () => {
    backgroundColorProducer.next('bg-color');
    trackProducer.next(getTestTrackModel());
    fixture.detectChanges();
    expect(component.spotifyCodeUrl).toBeNull();
  });

  it('should not create Spotify code URL with no track', () => {
    backgroundColorProducer.next('bg-color');
    barColorProducer.next('bar-color');
    fixture.detectChanges();
    expect(component.spotifyCodeUrl).toBeNull();
  });

  it('should not create Spotify code URL with no track uri', () => {
    backgroundColorProducer.next('bg-color');
    barColorProducer.next('bar-color');
    const nullTrackUri = getTestTrackModel();
    nullTrackUri.uri = null;
    trackProducer.next(nullTrackUri);
    fixture.detectChanges();
    expect(component.spotifyCodeUrl).toBeNull();
  });

  it('should create Spotify code URL with dynamic colors when using dynamic color code', () => {
    backgroundColorProducer.next('bg-color');
    barColorProducer.next('bar-color');
    dynamicColorProducer.next(getTestDominantColor());
    trackProducer.next(getTestTrackModel());
    useDynamicCodeColorProducer.next(true);
    fixture.detectChanges();
    expect(component.spotifyCodeUrl).toEqual('https://www.spotifycodes.com/downloadCode.php?uri=jpeg%2F' +
      `${getTestDominantColor().hex}%2F${getTestDominantColor().foregroundFontColor}%2F512%2F` +
      encodeURIComponent(getTestTrackModel().uri));
  });

  it('should create Spotify code URL without dynamic colors when not using dynamic color code', () => {
    backgroundColorProducer.next('bg-color');
    barColorProducer.next('bar-color');
    dynamicColorProducer.next(getTestDominantColor());
    trackProducer.next(getTestTrackModel());
    useDynamicCodeColorProducer.next(false);
    fixture.detectChanges();
    expect(component.spotifyCodeUrl).toEqual('https://www.spotifycodes.com/downloadCode.php?uri=jpeg%2F' +
      `bg-color%2Fbar-color%2F512%2F${encodeURIComponent(getTestTrackModel().uri)}`);
  });
});

class MockDominantColorFinder extends DominantColorFinder {
  private expectedDominantColor: Promise<DominantColor> = Promise.resolve(null);

  expects(expectedDominantColor: Promise<DominantColor>): void {
    this.expectedDominantColor = expectedDominantColor;
  }

  getColor(src: string): Promise<DominantColor> {
    return this.expectedDominantColor;
  }
}
