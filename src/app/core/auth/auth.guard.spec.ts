import { TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { ActivatedRoute, ActivatedRouteSnapshot, convertToParamMap, Router } from '@angular/router';
import { NgxsModule } from '@ngxs/store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { SpotifyAuthToken } from '../spotify/auth/spotify-auth.model';
import { NgxsSelectorMock } from '../testing/ngxs-selector-mock';
import { getTestAuthToken } from '../testing/test-models';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  const mockSelectors = new NgxsSelectorMock<AuthGuard>();
  let guard: AuthGuard;
  let router: Router;
  let route: ActivatedRouteSnapshot;
  let tokenProducer: BehaviorSubject<SpotifyAuthToken>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([], {developmentMode: true})
      ],
      providers: [
        AuthGuard,
        MockProvider(Router),
        MockProvider(ActivatedRouteSnapshot)
      ]
    });
    guard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
    route = TestBed.inject(ActivatedRouteSnapshot);
    tokenProducer = mockSelectors.defineNgxsSelector<SpotifyAuthToken>(guard, 'spotifyToken$');

    (route as any).paramMap = convertToParamMap({type: 'spotify'});

    guard.initSubscriptions();
  });

  it('should create', () => {
    expect(guard).toBeTruthy();
  });

  it('should activate if access token exists', () => {
    tokenProducer.next(getTestAuthToken());
    expect(guard.canActivate(route, null)).toBeTrue();
  });

  it('should redirect to /login/spotify if access token does not exist', () => {
    spyOn(console, 'log');
    tokenProducer.next(null);
    expect(guard.canActivate(route, null)).toBeFalse();
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/login/spotify');
  });
});
