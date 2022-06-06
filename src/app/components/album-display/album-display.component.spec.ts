import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FlexLayoutModule } from '@angular/flex-layout';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { MatProgressBar, MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule, MatSpinner } from '@angular/material/progress-spinner';
import { By } from '@angular/platform-browser';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxsModule } from '@ngxs/store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { AppConfig } from '../../app.config';
import { AlbumModel, TrackModel } from '../../core/playback/playback.model';
import { DEFAULT_BAR_CODE_COLOR, DEFAULT_CODE_COLOR } from '../../core/settings/settings.model';
import { NgxsSelectorMock } from '../../core/testing/ngxs-selector-mock';
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

describe('AlbumDisplayComponent', () => {
  const mockSelectors = new NgxsSelectorMock<AlbumDisplayComponent>();
  let component: AlbumDisplayComponent;
  let fixture: ComponentFixture<AlbumDisplayComponent>;
  let loader: HarnessLoader;
  let spotify: SpotifyService;

  let coverArtProducer: BehaviorSubject<ImageResponse>;
  let trackProducer: BehaviorSubject<TrackModel>;
  let albumProducer: BehaviorSubject<AlbumModel>;
  let isIdleProducer: BehaviorSubject<boolean>;
  let useSmartCodeColorProducer: BehaviorSubject<boolean>;
  let showSpotifyCodeProducer: BehaviorSubject<boolean>;
  let backgroundColorProducer: BehaviorSubject<string>;
  let barColorProducer: BehaviorSubject<string>;

  beforeAll(() => {
    AppConfig.settings = {
      env: {
        albumColorUrl: 'test-album-color-url',
        spotifyApiUrl: null,
        name: null,
        domain: null
      },
      auth: null,
      logging: null
    };
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
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
        MockProvider(SpotifyService)
      ]
    }).compileComponents();
    spotify = TestBed.inject(SpotifyService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AlbumDisplayComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);

    coverArtProducer = mockSelectors.defineNgxsSelector<ImageResponse>(component, 'coverArt$');
    trackProducer = mockSelectors.defineNgxsSelector<TrackModel>(component, 'track$');
    albumProducer = mockSelectors.defineNgxsSelector<AlbumModel>(component, 'album$');
    isIdleProducer = mockSelectors.defineNgxsSelector<boolean>(component, 'isIdle$');
    useSmartCodeColorProducer = mockSelectors.defineNgxsSelector<boolean>(component, 'useSmartCodeColor$');
    showSpotifyCodeProducer = mockSelectors.defineNgxsSelector<boolean>(component, 'showSpotifyCode$');
    backgroundColorProducer = mockSelectors.defineNgxsSelector<string>(component, 'backgroundColor$');
    barColorProducer = mockSelectors.defineNgxsSelector<string>(component, 'barColor$');

    fixture.detectChanges();
  });

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

  it('should update Spotify code URL when the track is updated', () => {
    component.spotifyCodeUrl = 'test';
    trackProducer.next(TEST_TRACK_MODEL);
    fixture.detectChanges();
    expect(component.spotifyCodeUrl).not.toEqual('test');
  });

  it('should update Spotify code URL when the background color is updated', () => {
    component.spotifyCodeUrl = 'test';
    backgroundColorProducer.next('bg-color');
    fixture.detectChanges();
    expect(component.spotifyCodeUrl).not.toEqual('test');
  });

  it('should update Spotify code URL when the bar color is updated', () => {
    component.spotifyCodeUrl = 'test';
    barColorProducer.next('bar-color');
    fixture.detectChanges();
    expect(component.spotifyCodeUrl).not.toEqual('test');
  });

  it('should update Spotify code URL when use smart code color is updated', () => {
    component.spotifyCodeUrl = 'test';
    useSmartCodeColorProducer.next(true);
    fixture.detectChanges();
    expect(component.spotifyCodeUrl).not.toEqual('test');
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

  it('should create Spotify code URL with smart colors when using smart color code', () => {
    component.smartBackgroundColor = 'smart-bg-color';
    component.smartBarColor = 'smart-bar-color';
    backgroundColorProducer.next('bg-color');
    barColorProducer.next('bar-color');
    trackProducer.next(TEST_TRACK_MODEL);
    useSmartCodeColorProducer.next(true);
    fixture.detectChanges();
    expect(component.spotifyCodeUrl).toEqual(
      `https://www.spotifycodes.com/downloadCode.php?uri=jpeg%2Fsmart-bg-color%2Fsmart-bar-color%2F512%2F${TEST_TRACK_MODEL.uri}`);
  });

  it('should create Spotify code URL without smart colors when not using smart color code', () => {
    component.smartBackgroundColor = 'smart-bg-color';
    component.smartBarColor = 'smart-bar-color';
    backgroundColorProducer.next('bg-color');
    barColorProducer.next('bar-color');
    trackProducer.next(TEST_TRACK_MODEL);
    useSmartCodeColorProducer.next(false);
    fixture.detectChanges();
    expect(component.spotifyCodeUrl).toEqual(
      `https://www.spotifycodes.com/downloadCode.php?uri=jpeg%2Fbg-color%2Fbar-color%2F512%2F${TEST_TRACK_MODEL.uri}`);
  });

  it('should set Spotify code smart colors on useSmartCodeColor update', () => {
    spotify.getAlbumColor = jasmine.createSpy().and.returnValue(of('#ABC123'));
    coverArtProducer.next(TEST_IMAGE_RESPONSE);
    albumProducer.next(TEST_ALBUM_MODEL);
    expect(component.smartBackgroundColor).toBeFalsy();
    expect(component.smartBarColor).toBeFalsy();
    useSmartCodeColorProducer.next(true);
    fixture.detectChanges();
    expect(spotify.getAlbumColor).toHaveBeenCalled();
    expect(component.smartBackgroundColor).toEqual('ABC123');
    expect(component.smartBarColor).not.toBeFalsy();
  });

  it('should set Spotify code smart colors to default values on invalid smart album color', () => {
    spyOn(console, 'error');
    spotify.getAlbumColor = jasmine.createSpy().and.returnValue(of('bad-hex'));
    coverArtProducer.next(TEST_IMAGE_RESPONSE);
    albumProducer.next(TEST_ALBUM_MODEL);
    expect(component.smartBackgroundColor).toBeFalsy();
    expect(component.smartBarColor).toBeFalsy();
    useSmartCodeColorProducer.next(true);
    fixture.detectChanges();
    expect(spotify.getAlbumColor).toHaveBeenCalled();
    expect(component.smartBackgroundColor).toEqual(DEFAULT_CODE_COLOR);
    expect(component.smartBarColor).toEqual(DEFAULT_BAR_CODE_COLOR);
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});
