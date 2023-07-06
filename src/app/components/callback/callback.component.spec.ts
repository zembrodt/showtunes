import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';
import { NgxsModule, Store } from '@ngxs/store';
import { MockComponent, MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { AuthToken } from '../../core/auth/auth.model';
import { NgxsSelectorMock } from '../../core/testing/ngxs-selector-mock';
import { SpotifyService } from '../../services/spotify/spotify.service';
import { LoadingComponent } from '../loading/loading.component';

import { CallbackComponent } from './callback.component';

describe('CallbackComponent', () => {
  const mockSelectors = new NgxsSelectorMock<CallbackComponent>();
  let component: CallbackComponent;
  let fixture: ComponentFixture<CallbackComponent>;
  let store: Store;
  let router: Router;
  let spotify: SpotifyService;
  let tokenProducer: BehaviorSubject<AuthToken>;
  let paramMapProducer: BehaviorSubject<ParamMap>;

  beforeEach(waitForAsync(() => {
    paramMapProducer = new BehaviorSubject<ParamMap>(convertToParamMap({code: 'initial_code'}));
    TestBed.configureTestingModule({
      declarations: [
        CallbackComponent,
        MockComponent(LoadingComponent)
      ],
      imports: [ NgxsModule.forRoot([], { developmentMode: true }) ],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: paramMapProducer } },
        MockProvider(Router),
        MockProvider(SpotifyService),
        MockProvider(Store)
      ]
    }).compileComponents();
    store = TestBed.inject(Store);
    router = TestBed.inject(Router);
    spotify = TestBed.inject(SpotifyService);

    fixture = TestBed.createComponent(CallbackComponent);
    component = fixture.componentInstance;

    tokenProducer = mockSelectors.defineNgxsSelector<AuthToken>(component, 'token$');

    spotify.compareState = jasmine.createSpy().and.returnValue(true);
    spotify.requestAuthToken = jasmine.createSpy().and.returnValue(Promise.resolve(null));

    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain the LoadingComponent', () => {
    const loading = fixture.debugElement.query(By.directive(LoadingComponent));
    expect(loading).toBeTruthy();
  });

  it('should redirect to /dashboard when auth token exists', () => {
    tokenProducer.next({
      accessToken: null,
      expiry: null,
      refreshToken: null,
      scope: null,
      tokenType: null
    });
    expect(router.navigateByUrl).toHaveBeenCalled();
  });

  it('should not redirect when auth token doesn\'t exist', () => {
    tokenProducer.next(null);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should compare callback state value with current value', () => {
    paramMapProducer.next(convertToParamMap({ code: 'test_code', state: 'test_state' }));
    expect(spotify.compareState).toHaveBeenCalled();
  });

  it('should fail auth token request when callback contains an error', () => {
    spyOn(console, 'error');
    paramMapProducer.next(convertToParamMap({ code: 'test_code', state: 'test_state', error: 'param_error' }));
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('should fail auth token request when callback doesn\'t contain a code', () => {
    spyOn(console, 'error');
    paramMapProducer.next(convertToParamMap({ state: 'test_state' }));
    expect(console.error).toHaveBeenCalledTimes(2);
  });

  it('should fail auth token request when callback doesn\'t contain a state value', () => {
    spotify.compareState = jasmine.createSpy().and.returnValue(false);
    spyOn(console, 'error');
    paramMapProducer.next(convertToParamMap({ code: 'test_code' }));
    expect(console.error).toHaveBeenCalledTimes(2);
  });

  it('should fail auth token request when callback contains an invalid state value', () => {
    spotify.compareState = jasmine.createSpy().and.returnValue(false);
    spyOn(console, 'error');
    paramMapProducer.next(convertToParamMap({ code: 'test_code', state: 'bad_state' }));
    expect(console.error).toHaveBeenCalledTimes(2);
  });

  it('should give an error for a failed auth token request', fakeAsync(() => {
    spotify.requestAuthToken = jasmine.createSpy().and.returnValue(Promise.reject('test_error'));
    spyOn(console, 'error');
    paramMapProducer.next(convertToParamMap({ code: 'bad_code', state: 'test_state' }));
    expect(spotify.requestAuthToken).toHaveBeenCalled();
    tick();
    expect(console.error).toHaveBeenCalledTimes(1);
  }));
});
