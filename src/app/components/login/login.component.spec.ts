import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MockComponent, MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { AuthToken } from '../../core/auth/auth.model';
import { NgxsSelectorMock } from '../../core/testing/ngxs-selector-mock';
import { SpotifyService } from '../../services/spotify/spotify.service';
import { LoadingComponent } from '../loading/loading.component';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  const mockSelectors = new NgxsSelectorMock<LoginComponent>();
  const authorizeUrl = 'https://example.com/authorize';
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let spotify: SpotifyService;
  let router: Router;
  let tokenProducer: BehaviorSubject<AuthToken>;
  let navigateToUrlSpy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        LoginComponent,
        MockComponent(LoadingComponent)
      ],
      providers: [
        MockProvider(SpotifyService),
        MockProvider(Router)
      ]
    }).compileComponents();
    spotify = TestBed.inject(SpotifyService);
    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;

    tokenProducer = mockSelectors.defineNgxsSelector<AuthToken>(component, 'token$');
    navigateToUrlSpy = spyOn<any>(component, 'navigateToUrl');

    spotify.getAuthorizeRequestUrl = jasmine.createSpy().and.returnValue(Promise.resolve(authorizeUrl));

    fixture.detectChanges();
  }));

  beforeAll(() => {
    window.onbeforeunload = () => 'Prevent page reload';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain the LoadingComponent', () => {
    const loading = fixture.debugElement.query(By.directive(LoadingComponent));
    expect(loading).toBeTruthy();
  });

  it('should navigate to the dashboard when auth token present', () => {
    tokenProducer.next({
      accessToken: 'access_token',
      tokenType: 'type',
      expiry: new Date(),
      scope: 'scope',
      refreshToken: 'refresh'
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('should navigate to the Spotify authorize request URL when no auth token present', async () => {
    tokenProducer.next(null);
    expect(spotify.getAuthorizeRequestUrl).toHaveBeenCalled();
    expect(await navigateToUrlSpy).toHaveBeenCalledWith(authorizeUrl);
  });
});
