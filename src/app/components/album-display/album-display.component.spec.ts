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
import { AlbumModel, TrackModel } from '../../core/playback/playback.model';
import { ChangeDynamicColor } from '../../core/settings/settings.actions';
import { NgxsSelectorMock } from '../../core/testing/ngxs-selector-mock';
import { FontColor } from '../../core/util';
import { ImageResponse } from '../../models/image.model';
import { SpotifyService } from '../../services/spotify/spotify.service';
import { AlbumDisplayComponent } from './album-display.component';

const TEST_IMAGE_RESPONSE: ImageResponse = {
  url: 'test-url',
  width: 100,
  height: 100
};

const TEST_ALBUM_MODEL: AlbumModel = {
  id: 'id',
  name: 'test',
  href: 'album-href',
  artists: ['test-artist-1', 'test-artist-2'],
  coverArt: null,
  type: 'type',
  uri: 'album-uri',
  releaseDate: 'release-date',
  totalTracks: 10
};

const TEST_TRACK_MODEL: TrackModel = {
  id: 'id',
  title: 'title',
  duration: 100,
  href: 'track-href',
  artists: null,
  uri: 'track-uri'
};

const TEST_DOMINANT_COLOR: DominantColor = {
  hex: 'ABC123',
  rgb: {
    r: 100,
    g: 100,
    b: 100,
    a: 255
  },
  foregroundFontColor: FontColor.White
};

describe('AlbumDisplayComponent', () => {
  const mockSelectors = new NgxsSelectorMock<AlbumDisplayComponent>();
  let component: AlbumDisplayComponent;
  let fixture: ComponentFixture<AlbumDisplayComponent>;
  let loader: HarnessLoader;
  let spotify: SpotifyService;
  let store: Store;

  let coverArtProducer: BehaviorSubject<ImageResponse>;
  let trackProducer: BehaviorSubject<TrackModel>;
  let albumProducer: BehaviorSubject<AlbumModel>;
  let isIdleProducer: BehaviorSubject<boolean>;
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
        name: null,
        domain: null
      },
      auth: null,
      logging: null
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
        MockProvider(SpotifyService),
        MockProvider(Store)
      ]
    }).compileComponents();
    spotify = TestBed.inject(SpotifyService);
    store = TestBed.inject(Store);

    fixture = TestBed.createComponent(AlbumDisplayComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);

    coverArtProducer = mockSelectors.defineNgxsSelector<ImageResponse>(component, 'coverArt$');
    trackProducer = mockSelectors.defineNgxsSelector<TrackModel>(component, 'track$');
    albumProducer = mockSelectors.defineNgxsSelector<AlbumModel>(component, 'album$');
    isIdleProducer = mockSelectors.defineNgxsSelector<boolean>(component, 'isIdle$');
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
    coverArtProducer.next(TEST_IMAGE_RESPONSE);
    albumProducer.next(TEST_ALBUM_MODEL);
    fixture.detectChanges();
    const link = fixture.debugElement.query(By.css('a'));
    const img = fixture.debugElement.query(By.css('img'));
    expect(link).toBeTruthy();
    expect(link.properties.href).toBeTruthy();
    expect(link.properties.href).toEqual(TEST_ALBUM_MODEL.href);
    expect(img).toBeTruthy();
    expect(img.properties.src).toBeTruthy();
    expect(img.properties.src).toEqual(TEST_IMAGE_RESPONSE.url);
  });

  it('should display a loading spinner when no coverArt and is not idle', () => {
    isIdleProducer.next(false);
    fixture.detectChanges();
    const spinner = fixture.debugElement.query(By.directive(MatSpinner));
    expect(spinner).toBeTruthy();
  });

  it('should display a loading spinner when coverArt.url is null and is not idle', () => {
    const nullCoverArt = {...TEST_IMAGE_RESPONSE};
    nullCoverArt.url = null;
    coverArtProducer.next(nullCoverArt);
    isIdleProducer.next(false);
    fixture.detectChanges();
    const spinner = fixture.debugElement.query(By.directive(MatSpinner));
    expect(spinner).toBeTruthy();
  });

  it('should display start Spotify message when no coverArt and is idle', () => {
    isIdleProducer.next(true);
    fixture.detectChanges();
    const msg = fixture.debugElement.query(By.css('span'));
    expect(msg.nativeElement.textContent).toBeTruthy();
    expect(msg.nativeElement.textContent.trim()).toEqual('Start Spotify to display music!');
  });

  it('should display start Spotify message when coverArt.url is null and is idle', () => {
    const nullCoverArt = {...TEST_IMAGE_RESPONSE};
    nullCoverArt.url = null;
    coverArtProducer.next(nullCoverArt);
    isIdleProducer.next(true);
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
    isIdleProducer.next(false);
    fixture.detectChanges();
    const icon = fixture.debugElement.query(By.css('fa-icon'));
    const loading = fixture.debugElement.query(By.directive(MatProgressBar));
    expect(icon).toBeTruthy();
    expect(loading).toBeTruthy();
  });

  it('should only display Spotify code icon when showing code and no URL and is idle', () => {
    showSpotifyCodeProducer.next(true);
    isIdleProducer.next(true);
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
    trackProducer.next(TEST_TRACK_MODEL);
    fixture.detectChanges();
    expect(component['setSpotifyCodeUrl']).toHaveBeenCalled();
  });

  it('should update dynamic color when coverArt$ is updated and dominantColorFinder returns a result', fakeAsync(() => {
    mockDominantColorFinder.expects(Promise.resolve(TEST_DOMINANT_COLOR));
    coverArtProducer.next(TEST_IMAGE_RESPONSE);
    flushMicrotasks();
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDynamicColor(TEST_DOMINANT_COLOR));
  }));

  it('should set dynamic color to null when coverArt$ is updated and dominantColorFinder returns null', fakeAsync(() => {
    mockDominantColorFinder.expects(Promise.resolve(null));
    coverArtProducer.next(TEST_IMAGE_RESPONSE);
    flushMicrotasks();
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDynamicColor(null));
  }));

  it('should set dynamic color to null when coverArt$ is updated and dominantColorFinder returns an invalid hex', fakeAsync(() => {
    mockDominantColorFinder.expects(Promise.resolve({
      ...TEST_DOMINANT_COLOR,
      hex: 'bad-hex'
    }));
    coverArtProducer.next(TEST_IMAGE_RESPONSE);
    flushMicrotasks();
    expect(store.dispatch).toHaveBeenCalledWith(new ChangeDynamicColor(null));
  }));

  it('should set dynamic color to null when coverArt$ is updated and dominantColorFinder rejects its promise', fakeAsync(() => {
    mockDominantColorFinder.expects(Promise.reject('test-error'));
    spyOn(console, 'error');
    coverArtProducer.next(TEST_IMAGE_RESPONSE);
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
    dynamicColorProducer.next(TEST_DOMINANT_COLOR);
    expect(component['setSpotifyCodeUrl']).toHaveBeenCalled();
  });

  it('should create a Spotify code URL', () => {
    backgroundColorProducer.next('bg-color');
    barColorProducer.next('bar-color');
    trackProducer.next(TEST_TRACK_MODEL);
    fixture.detectChanges();
    expect(component.spotifyCodeUrl).toEqual(
      `https://www.spotifycodes.com/downloadCode.php?uri=jpeg%2Fbg-color%2Fbar-color%2F512%2F${TEST_TRACK_MODEL.uri}`);
  });

  it('should create a Spotify code URL with expanded background color of length 3', () => {
    backgroundColorProducer.next('ABC');
    barColorProducer.next('bar-color');
    trackProducer.next(TEST_TRACK_MODEL);
    fixture.detectChanges();
    expect(component.spotifyCodeUrl).toEqual(
      `https://www.spotifycodes.com/downloadCode.php?uri=jpeg%2FAABBCC%2Fbar-color%2F512%2F${TEST_TRACK_MODEL.uri}`);
  });

  it('should not create Spotify code URL with no background color', () => {
    barColorProducer.next('bar-color');
    trackProducer.next(TEST_TRACK_MODEL);
    fixture.detectChanges();
    expect(component.spotifyCodeUrl).toBeNull();
  });

  it('should not create Spotify code URL with no bar color', () => {
    backgroundColorProducer.next('bg-color');
    trackProducer.next(TEST_TRACK_MODEL);
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
    const nullTrackUri = {...TEST_TRACK_MODEL};
    nullTrackUri.uri = null;
    trackProducer.next(nullTrackUri);
    fixture.detectChanges();
    expect(component.spotifyCodeUrl).toBeNull();
  });

  it('should create Spotify code URL with dynamic colors when using dynamic color code', () => {
    backgroundColorProducer.next('bg-color');
    barColorProducer.next('bar-color');
    dynamicColorProducer.next(TEST_DOMINANT_COLOR);
    trackProducer.next(TEST_TRACK_MODEL);
    useDynamicCodeColorProducer.next(true);
    fixture.detectChanges();
    expect(component.spotifyCodeUrl).toEqual(
      `https://www.spotifycodes.com/downloadCode.php?uri=jpeg%2F${TEST_DOMINANT_COLOR.hex}%2F${TEST_DOMINANT_COLOR.foregroundFontColor}%2F512%2F${TEST_TRACK_MODEL.uri}`);
  });

  it('should create Spotify code URL without dynamic colors when not using dynamic color code', () => {
    backgroundColorProducer.next('bg-color');
    barColorProducer.next('bar-color');
    dynamicColorProducer.next(TEST_DOMINANT_COLOR);
    trackProducer.next(TEST_TRACK_MODEL);
    useDynamicCodeColorProducer.next(false);
    fixture.detectChanges();
    expect(component.spotifyCodeUrl).toEqual(
      `https://www.spotifycodes.com/downloadCode.php?uri=jpeg%2Fbg-color%2Fbar-color%2F512%2F${TEST_TRACK_MODEL.uri}`);
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
