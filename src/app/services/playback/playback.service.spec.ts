import { TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { NgxsModule } from '@ngxs/store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { NgxsSelectorMock } from '../../core/testing/ngxs-selector-mock';
import { SpotifyService } from '../spotify/spotify.service';
import { IDLE_POLLING, PLAYBACK_POLLING, PlaybackService } from './playback.service';

describe('PlaybackService', () => {
  const mockSelectors = new NgxsSelectorMock<PlaybackService>();
  let service: PlaybackService;
  let spotify: SpotifyService;
  let intervalProducer: BehaviorSubject<number>;
  let isIdleProducer: BehaviorSubject<boolean>;
  let isAuthenticatedProducer: BehaviorSubject<boolean>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([], { developmentMode: true })
      ],
      providers: [ MockProvider(SpotifyService) ]
    });
    service = TestBed.inject(PlaybackService);
    spotify = TestBed.inject(SpotifyService);

    intervalProducer = mockSelectors.defineNgxsSelector<number>(service, 'interval$');
    isIdleProducer = mockSelectors.defineNgxsSelector<boolean>(service, 'isIdle$');
    isAuthenticatedProducer = mockSelectors.defineNgxsSelector<boolean>(service, 'isAuthenticated$');

    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should poll Spotify playback with idle polling interval when isAuthenticated and isIdle', () => {
    service.initialize();
    isAuthenticatedProducer.next(true);
    isIdleProducer.next(true);
    jasmine.clock().tick(IDLE_POLLING);
    expect(spotify.pollCurrentPlayback).toHaveBeenCalled();
  });

  it('should poll Spotify playback with playback polling interval when isAuthenticated and not isIdle', () => {
    service.initialize();
    isAuthenticatedProducer.next(true);
    isIdleProducer.next(false);
    jasmine.clock().tick(PLAYBACK_POLLING);
    expect(spotify.pollCurrentPlayback).toHaveBeenCalled();
  });

  it('should not poll Spotify playback after playback polling when not isAuthenticated and isIdle', () => {
    service.initialize();
    isAuthenticatedProducer.next(false);
    isIdleProducer.next(true);
    jasmine.clock().tick(PLAYBACK_POLLING);
    expect(spotify.pollCurrentPlayback).not.toHaveBeenCalled();
  });

  it('should not poll Spotify playback after idle polling when not isAuthenticated and isIdle', () => {
    service.initialize();
    isAuthenticatedProducer.next(false);
    isIdleProducer.next(true);
    jasmine.clock().tick(IDLE_POLLING);
    expect(spotify.pollCurrentPlayback).not.toHaveBeenCalled();
  });

  it('should not poll Spotify playback after playback polling when not isAuthenticated and not isIdle', () => {
    service.initialize();
    isAuthenticatedProducer.next(false);
    isIdleProducer.next(false);
    jasmine.clock().tick(PLAYBACK_POLLING);
    expect(spotify.pollCurrentPlayback).not.toHaveBeenCalled();
  });

  it('should not poll Spotify playback after idle polling when not isAuthenticated and not isIdle', () => {
    service.initialize();
    isAuthenticatedProducer.next(false);
    isIdleProducer.next(false);
    jasmine.clock().tick(IDLE_POLLING);
    expect(spotify.pollCurrentPlayback).not.toHaveBeenCalled();
  });
});
