import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { By } from '@angular/platform-browser';
import { MockComponent } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { AlbumModel, DisallowsModel, PlaylistModel, TrackModel } from '../../core/playback/playback.model';
import { PlayerControlsOptions } from '../../core/settings/settings.model';
import { NgxsSelectorMock } from '../../core/testing/ngxs-selector-mock';
import { getTestDisallowsModel } from '../../core/testing/test-models';
import { TrackPlayerControlsComponent } from './track-player-controls/track-player-controls.component';
import { TrackPlayerProgressComponent } from './track-player-progress/track-player-progress.component';

import { TrackPlayerComponent } from './track-player.component';

const TEST_TRACK: TrackModel = {
  id: 'track-id',
  title: 'test track',
  duration: 100,
  uri: 'track-uri',
  href: 'track-href',
  artists: [
    {
      name: 'test artist 1',
      href: 'artist1-href'
    },
    {
      name: 'test artist 2',
      href: 'artist2-href'
    }
  ]
};

const TEST_ALBUM: AlbumModel = {
  id: 'abum-id',
  name: 'test-album',
  href: 'album-href',
  artists: null,
  totalTracks: 1,
  uri: null,
  releaseDate: null,
  type: null,
  coverArt: null
};

const TEST_PLAYLIST: PlaylistModel = {
  id: 'playlist-id',
  name: 'test-playlist',
  href: 'playlist-href'
};

describe('TrackPlayerComponent', () => {
  const mockSelectors = new NgxsSelectorMock<TrackPlayerComponent>();
  let component: TrackPlayerComponent;
  let fixture: ComponentFixture<TrackPlayerComponent>;
  let trackProducer: BehaviorSubject<TrackModel>;
  let albumProducer: BehaviorSubject<AlbumModel>;
  let playlistProducer: BehaviorSubject<PlaylistModel>;
  let deviceVolumeProducer: BehaviorSubject<number>;
  let progressProducer: BehaviorSubject<number>;
  let durationProducer: BehaviorSubject<number>;
  let isPlayingProducer: BehaviorSubject<boolean>;
  let isShuffleProducer: BehaviorSubject<boolean>;
  let isSmartShuffleProducer: BehaviorSubject<boolean>;
  let repeatProducer: BehaviorSubject<string>;
  let isLikedProducer: BehaviorSubject<boolean>;
  let showPlayerControlsProducer: BehaviorSubject<PlayerControlsOptions>;
  let showPlaylistNameProducer: BehaviorSubject<boolean>;
  let disallowsProducer: BehaviorSubject<DisallowsModel>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        TrackPlayerComponent,
        MockComponent(TrackPlayerProgressComponent),
        MockComponent(TrackPlayerControlsComponent)
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrackPlayerComponent);
    component = fixture.componentInstance;

    trackProducer = mockSelectors.defineNgxsSelector<TrackModel>(component, 'track$');
    albumProducer = mockSelectors.defineNgxsSelector<AlbumModel>(component, 'album$');
    playlistProducer = mockSelectors.defineNgxsSelector<PlaylistModel>(component, 'playlist$');
    deviceVolumeProducer = mockSelectors.defineNgxsSelector<number>(component, 'volume$');
    progressProducer = mockSelectors.defineNgxsSelector<number>(component, 'progress$');
    durationProducer = mockSelectors.defineNgxsSelector<number>(component, 'duration$');
    isPlayingProducer = mockSelectors.defineNgxsSelector<boolean>(component, 'isPlaying$');
    isShuffleProducer = mockSelectors.defineNgxsSelector<boolean>(component, 'isShuffle$');
    isSmartShuffleProducer = mockSelectors.defineNgxsSelector<boolean>(component, 'isSmartShuffle$');
    repeatProducer = mockSelectors.defineNgxsSelector<string>(component, 'repeat$');
    isLikedProducer = mockSelectors.defineNgxsSelector<boolean>(component, 'isLiked$');
    showPlayerControlsProducer = mockSelectors.defineNgxsSelector<PlayerControlsOptions>(component, 'showPlayerControls$');
    showPlaylistNameProducer = mockSelectors.defineNgxsSelector<boolean>(component, 'showPlaylistName$');
    disallowsProducer = mockSelectors.defineNgxsSelector<DisallowsModel>(component, 'disallows$');

    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show play controls when option is on', () => {
    showPlayerControlsProducer.next(PlayerControlsOptions.On);
    expect(component.showPlayerControls).toBeTrue();
  });

  it('should show play controls when option is fade', () => {
    showPlayerControlsProducer.next(PlayerControlsOptions.Fade);
    expect(component.showPlayerControls).toBeTrue();
  });

  it('should not show play controls when option is off', () => {
    showPlayerControlsProducer.next(PlayerControlsOptions.Off);
    expect(component.showPlayerControls).toBeFalse();
  });

  it('should show track div when track is not null', () => {
    trackProducer.next(TEST_TRACK);
    fixture.detectChanges();
    const trackInfo = fixture.debugElement.query(By.css('.track-info'));
    expect(trackInfo).toBeTruthy();
  });

  it('should not show track div and display message when track is null', () => {
    trackProducer.next(null);
    fixture.detectChanges();
    const trackInfo = fixture.debugElement.query(By.css('.track-info'));
    const placeholder = fixture.debugElement.query(By.css('.track-placeholder div'));
    expect(trackInfo).toBeFalsy();
    expect(placeholder.nativeElement.textContent.trim()).toEqual('No track currently playing');
  });

  it('should display track title and link', () => {
    trackProducer.next(TEST_TRACK);
    fixture.detectChanges();
    const trackTitle = fixture.debugElement.query(By.css('.track-title a'));
    expect(trackTitle.properties.href).toEqual(TEST_TRACK.href);
    expect(trackTitle.nativeElement.textContent.trim()).toEqual(TEST_TRACK.title);
  });

  it('should display single artist name and link', () => {
    const trackSingleArtist = {...TEST_TRACK};
    trackSingleArtist.artists = [{
      name: 'test-artist',
      href: 'artist-href'
    }];
    trackProducer.next(trackSingleArtist);
    fixture.detectChanges();
    const trackArtists = fixture.debugElement.queryAll(By.css('.track-artist a'));
    expect(trackArtists.length).toEqual(1);
    expect(trackArtists[0].properties.href).toEqual('artist-href');
    expect(trackArtists[0].nativeElement.textContent.trim()).toEqual('test-artist');
    const commaDelims = fixture.debugElement.queryAll(By.css('.track-artist span'));
    expect(commaDelims.length).toEqual(0);
  });

  it('should display multiple artist names and links', () => {
    trackProducer.next(TEST_TRACK);
    fixture.detectChanges();
    const trackArtists = fixture.debugElement.queryAll(By.css('.track-artist a'));
    expect(trackArtists.length).toEqual(TEST_TRACK.artists.length);
    trackArtists.forEach((artist, i) => {
      expect(artist.properties.href).toEqual(TEST_TRACK.artists[i].href);
      expect(artist.nativeElement.textContent.trim()).toEqual((TEST_TRACK.artists[i].name));
    });
  });

  it('should comma-separate multiple artists', () => {
    trackProducer.next(TEST_TRACK);
    fixture.detectChanges();
    const commaDelims = fixture.debugElement.queryAll(By.css('.track-artist span'));
    expect(commaDelims.length).toEqual(TEST_TRACK.artists.length - 1);
    commaDelims.forEach((commaDelim) => {
      expect(commaDelim.nativeElement.textContent.trim()).toEqual(',');
    });
  });

  it('should not display artists if none exist', () => {
    const noArtists = {...TEST_TRACK};
    noArtists.artists = [];
    trackProducer.next(noArtists);
    fixture.detectChanges();
    const trackArtists = fixture.debugElement.queryAll(By.css('.track-artist a'));
    expect(trackArtists.length).toEqual(0);
  });

  it('should display album name and link if album exists', () => {
    trackProducer.next(TEST_TRACK);
    albumProducer.next(TEST_ALBUM);
    fixture.detectChanges();
    const album = fixture.debugElement.query(By.css('.track-album a'));
    expect(album.properties.href).toEqual(TEST_ALBUM.href);
    expect(album.nativeElement.textContent.trim()).toEqual(TEST_ALBUM.name);
  });

  it('should not display album when null', () => {
    trackProducer.next(TEST_TRACK);
    albumProducer.next(null);
    fixture.detectChanges();
    const album = fixture.debugElement.query(By.css('.track-album'));
    expect(album).toBeFalsy();
  });

  it('should display the progress bar', () => {
    const progress = fixture.debugElement.query(By.directive(TrackPlayerProgressComponent));
    expect(progress).toBeTruthy();
  });

  it('should correctly set the duration and progress values for progress bar', () => {
    progressProducer.next(5);
    durationProducer.next(10);
    fixture.detectChanges();
    const progress = fixture.debugElement.query(By.directive(TrackPlayerProgressComponent))
      .componentInstance as TrackPlayerProgressComponent;
    expect(progress.progress).toEqual(5);
    expect(progress.duration).toEqual(10);
  });

  it('should display the track player controls when showing controls', () => {
    component.showPlayerControls = true;
    fixture.detectChanges();
    const playerControls = fixture.debugElement.query(By.directive(TrackPlayerControlsComponent));
    expect(playerControls).toBeTruthy();
  });

  it('should not display the track player controls when not showing controls', () => {
    component.showPlayerControls = false;
    fixture.detectChanges();
    const playerControls = fixture.debugElement.query(By.directive(TrackPlayerControlsComponent));
    expect(playerControls).toBeFalsy();
  });

  it('should correctly set the track player controls values', () => {
    const updatedDisallows = {
      ...getTestDisallowsModel(),
      resume: true,
      shuffle: true
    };

    component.showPlayerControls = true;
    isShuffleProducer.next(true);
    isSmartShuffleProducer.next(true);
    isPlayingProducer.next(true);
    repeatProducer.next('context');
    deviceVolumeProducer.next(50);
    isLikedProducer.next(true);
    disallowsProducer.next(updatedDisallows);
    fixture.detectChanges();
    const playerControls = fixture.debugElement.query(By.directive(TrackPlayerControlsComponent))
      .componentInstance as TrackPlayerControlsComponent;
    expect(playerControls.isShuffle).toBeTrue();
    expect(playerControls.isSmartShuffle).toBeTrue();
    expect(playerControls.isPlaying).toBeTrue();
    expect(playerControls.repeatState).toEqual('context');
    expect(playerControls.volume).toEqual(50);
    expect(playerControls.isLiked).toBeTrue();
    expect(playerControls.disallows).toEqual(updatedDisallows);
  });

  it('should show playlist name when showing playlist and playlist exists', () => {
    showPlaylistNameProducer.next(true);
    playlistProducer.next(TEST_PLAYLIST);
    fixture.detectChanges();
    const playlist = fixture.debugElement.query(By.css('.playlist-name a'));
    expect(playlist.properties.href).toEqual(TEST_PLAYLIST.href);
    expect(playlist.nativeElement.textContent.trim()).toEqual(TEST_PLAYLIST.name);
  });

  it('should not show the playlist name when not showing playlist', () => {
    showPlaylistNameProducer.next(false);
    playlistProducer.next(TEST_PLAYLIST);
    fixture.detectChanges();
    const playlist = fixture.debugElement.query(By.css('.playlist-name'));
    expect(playlist).toBeFalsy();
  });

  it('should not show the playlist name when playlist is null', () => {
    showPlaylistNameProducer.next(true);
    playlistProducer.next(null);
    fixture.detectChanges();
    const playlist = fixture.debugElement.query(By.css('.playlist-name'));
    expect(playlist).toBeFalsy();
  });
});
