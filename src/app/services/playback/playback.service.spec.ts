import { TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { NgxsModule } from '@ngxs/store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { AppConfig } from '../../app.config';
import { PlayerState } from '../../core/playback/playback.model';
import { NgxsSelectorMock } from '../../core/testing/ngxs-selector-mock';
import { SpotifyPollingService } from '../spotify/polling/spotify-polling.service';
import { PlaybackService } from './playback.service';

describe('PlaybackService', () => {
  const mockSelectors = new NgxsSelectorMock<PlaybackService>();
  let service: PlaybackService;
  let polling: SpotifyPollingService;
  let intervalProducer: BehaviorSubject<number>;
  let playerStateProducer: BehaviorSubject<PlayerState>;
  let isAuthenticatedProducer: BehaviorSubject<boolean>;

  beforeEach(() => {
    AppConfig.settings = {
      env: {
        name: 'test-name',
        domain: 'test-domain',
        spotifyApiUrl: 'spotify-url',
        spotifyAccountsUrl: 'spotify-accounts',
        idlePolling: 3000,
        playbackPolling: 1000
      },
      auth: null
    };
    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([], { developmentMode: true })
      ],
      providers: [ MockProvider(SpotifyPollingService) ]
    });
    service = TestBed.inject(PlaybackService);
    polling = TestBed.inject(SpotifyPollingService);

    intervalProducer = mockSelectors.defineNgxsSelector<number>(service, 'interval$');
    playerStateProducer = mockSelectors.defineNgxsSelector<PlayerState>(service, 'playerState$');
    isAuthenticatedProducer = mockSelectors.defineNgxsSelector<boolean>(service, 'isAuthenticated$');

    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should poll Spotify playback with idle polling interval when isAuthenticated and is idling state', () => {
    service.initialize();
    isAuthenticatedProducer.next(true);
    playerStateProducer.next(PlayerState.Idling);
    jasmine.clock().tick(AppConfig.settings.env.idlePolling);
    expect(polling.pollCurrentPlayback).toHaveBeenCalled();
  });

  it('should poll Spotify playback with playback polling interval when isAuthenticated and is playing state', () => {
    service.initialize();
    isAuthenticatedProducer.next(true);
    playerStateProducer.next(PlayerState.Playing);
    jasmine.clock().tick(AppConfig.settings.env.playbackPolling);
    expect(polling.pollCurrentPlayback).toHaveBeenCalled();
  });

  it('should not poll Spotify playback after playback polling when not isAuthenticated and is idling state', () => {
    service.initialize();
    isAuthenticatedProducer.next(false);
    playerStateProducer.next(PlayerState.Idling);
    jasmine.clock().tick(AppConfig.settings.env.playbackPolling);
    expect(polling.pollCurrentPlayback).not.toHaveBeenCalled();
  });

  it('should not poll Spotify playback after idle polling when not isAuthenticated and is idling state', () => {
    service.initialize();
    isAuthenticatedProducer.next(false);
    playerStateProducer.next(PlayerState.Idling);
    jasmine.clock().tick(AppConfig.settings.env.idlePolling);
    expect(polling.pollCurrentPlayback).not.toHaveBeenCalled();
  });

  it('should not poll Spotify playback after playback polling when not isAuthenticated and is playing state', () => {
    service.initialize();
    isAuthenticatedProducer.next(false);
    playerStateProducer.next(PlayerState.Playing);
    jasmine.clock().tick(AppConfig.settings.env.playbackPolling);
    expect(polling.pollCurrentPlayback).not.toHaveBeenCalled();
  });

  it('should not poll Spotify playback after idle polling when not isAuthenticated and is playing state', () => {
    service.initialize();
    isAuthenticatedProducer.next(false);
    playerStateProducer.next(PlayerState.Playing);
    jasmine.clock().tick(AppConfig.settings.env.idlePolling);
    expect(polling.pollCurrentPlayback).not.toHaveBeenCalled();
  });

  it('should not poll Spotify playback when isAuthenticated and is refreshing state', () => {
    service.initialize();
    isAuthenticatedProducer.next(true);
    playerStateProducer.next(PlayerState.Refreshing);
    jasmine.clock().tick(AppConfig.settings.env.idlePolling);
    expect(polling.pollCurrentPlayback).not.toHaveBeenCalled();
  });

  it('should not poll Spotify playback when not isAuthenticated and is refreshing state', () => {
    service.initialize();
    isAuthenticatedProducer.next(false);
    playerStateProducer.next(PlayerState.Refreshing);
    jasmine.clock().tick(AppConfig.settings.env.idlePolling);
    expect(polling.pollCurrentPlayback).not.toHaveBeenCalled();
  });
});
