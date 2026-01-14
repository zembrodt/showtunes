import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, ActivatedRouteSnapshot, convertToParamMap, Router } from '@angular/router';
import { MockComponent, MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { SpotifyAuthToken } from '../../core/spotify/auth/spotify-auth.model';
import { NgxsSelectorMock } from '../../core/testing/ngxs-selector-mock';
import { DiscogsAuthService } from '../../services/discogs/auth/discogs-auth.service';
import { SpotifyAuthService } from '../../services/spotify/auth/spotify-auth.service';
import { LoadingComponent } from '../loading/loading.component';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  const mockSelectors = new NgxsSelectorMock<LoginComponent>();
  const authorizeUrl = 'https://example.com/authorize';
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let spotifyAuth: SpotifyAuthService;
  let discogsAuth: DiscogsAuthService;
  let router: Router;
  let route: ActivatedRoute;
  let spotifyTokenProducer: BehaviorSubject<SpotifyAuthToken>;
  let navigateToUrlSpy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        LoginComponent,
        MockComponent(LoadingComponent)
      ],
      providers: [
        MockProvider(SpotifyAuthService),
        MockProvider(DiscogsAuthService),
        MockProvider(Router),
        MockProvider(ActivatedRoute)
      ]
    }).compileComponents();
    spotifyAuth = TestBed.inject(SpotifyAuthService);
    discogsAuth = TestBed.inject(DiscogsAuthService);
    router = TestBed.inject(Router);
    route = TestBed.inject(ActivatedRoute);

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;

    spotifyTokenProducer = mockSelectors.defineNgxsSelector<SpotifyAuthToken>(component, 'spotifyToken$');
    navigateToUrlSpy = spyOn<any>(component, 'navigateToUrl');

    spotifyAuth.getAuthorizeRequestUrl = jasmine.createSpy().and.returnValue(Promise.resolve(authorizeUrl));
    (route as any).snapshot = {
      paramMap: convertToParamMap({type: 'spotify'})
    };

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
    spotifyTokenProducer.next({
      accessToken: 'access_token',
      tokenType: 'type',
      expiry: new Date(),
      scope: 'scope',
      refreshToken: 'refresh'
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard/spotify');
  });

  it('should navigate to the Spotify authorize request URL when no auth token present', async () => {
    spotifyTokenProducer.next(null);
    expect(spotifyAuth.getAuthorizeRequestUrl).toHaveBeenCalled();
    expect(await navigateToUrlSpy).toHaveBeenCalledWith(authorizeUrl);
  });
});
