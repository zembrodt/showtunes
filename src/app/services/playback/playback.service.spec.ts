import { TestBed } from '@angular/core/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { PollCurrentPlayback } from '../../core/playback/playback.actions';
import { NgxsSelectorMock } from '../../core/testing/ngxs-selector-mock';
import { IDLE_POLLING, PLAYBACK_POLLING, PlaybackService } from './playback.service';

describe('PlaybackService', () => {
  const mockSelectors = new NgxsSelectorMock<PlaybackService>();
  let service: PlaybackService;
  let store: Store;
  let intervalProducer: BehaviorSubject<number>;
  let isIdleProducer: BehaviorSubject<boolean>;
  let isAuthenticatedProducer: BehaviorSubject<boolean>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([], { developmentMode: true })
      ],
      providers: [ MockProvider(Store) ]
    });
    service = TestBed.inject(PlaybackService);
    store = TestBed.inject(Store);

    intervalProducer = mockSelectors.defineNgxsSelector<number>(service, 'interval$');
    isIdleProducer = mockSelectors.defineNgxsSelector<boolean>(service, 'isIdle$');
    isAuthenticatedProducer = mockSelectors.defineNgxsSelector<boolean>(service, 'isAuthenticated$');

    store.dispatch = jasmine.createSpy().withArgs(jasmine.any(PollCurrentPlayback)).and.returnValue(of(true));

    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should dispatch PollCurrentPlayback with idle polling interval when isAuthenticated and isIdle', () => {
    service.initialize();
    isAuthenticatedProducer.next(true);
    isIdleProducer.next(true);
    jasmine.clock().tick(IDLE_POLLING);
    expect(store.dispatch).toHaveBeenCalledOnceWith(jasmine.any(PollCurrentPlayback));
  });

  it('should dispatch PollCurrentPlayback with playback polling interval when isAuthenticated and not isIdle', () => {
    service.initialize();
    isAuthenticatedProducer.next(true);
    isIdleProducer.next(false);
    jasmine.clock().tick(PLAYBACK_POLLING);
    expect(store.dispatch).toHaveBeenCalledOnceWith(jasmine.any(PollCurrentPlayback));
  });

  it('should not dispatch PollCurrentPlayback after playback polling when not isAuthenticated and isIdle', () => {
    service.initialize();
    isAuthenticatedProducer.next(false);
    isIdleProducer.next(true);
    jasmine.clock().tick(PLAYBACK_POLLING);
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(PollCurrentPlayback));
  });

  it('should not dispatch PollCurrentPlayback after idle polling when not isAuthenticated and isIdle', () => {
    service.initialize();
    isAuthenticatedProducer.next(false);
    isIdleProducer.next(true);
    jasmine.clock().tick(IDLE_POLLING);
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(PollCurrentPlayback));
  });

  it('should not dispatch PollCurrentPlayback after playback polling when not isAuthenticated and not isIdle', () => {
    service.initialize();
    isAuthenticatedProducer.next(false);
    isIdleProducer.next(false);
    jasmine.clock().tick(PLAYBACK_POLLING);
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(PollCurrentPlayback));
  });

  it('should not dispatch PollCurrentPlayback after idle polling when not isAuthenticated and not isIdle', () => {
    service.initialize();
    isAuthenticatedProducer.next(false);
    isIdleProducer.next(false);
    jasmine.clock().tick(IDLE_POLLING);
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.any(PollCurrentPlayback));
  });
});
