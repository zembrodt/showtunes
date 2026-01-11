import { TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { Router } from '@angular/router';
import { NgxsModule, Store } from '@ngxs/store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { NgxsSelectorMock } from '../testing/ngxs-selector-mock';
import { getTestAuthToken } from '../testing/test-models';
import { SetAuthToken } from './spotify-auth.actions';
import { SpotifyAuthGuard } from './spotify-auth.guard';
import { SPOTIFY_AUTH_STATE_NAME, SpotifyAuthToken } from './spotify-auth.model';
import { SpotifyAuthState } from './spotify-auth.state';

describe('Authentication', () => {
  describe('AuthGuard', () => {
    const mockSelectors = new NgxsSelectorMock<SpotifyAuthGuard>();
    let guard: SpotifyAuthGuard;
    let router: Router;
    let tokenProducer: BehaviorSubject<SpotifyAuthToken>;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          NgxsModule.forRoot([], {developmentMode: true})
        ],
        providers: [
          SpotifyAuthGuard,
          MockProvider(Router)
        ]
      });
      guard = TestBed.inject(SpotifyAuthGuard);
      router = TestBed.inject(Router);
      tokenProducer = mockSelectors.defineNgxsSelector<SpotifyAuthToken>(guard, 'token$');
      guard.initSubscriptions();
    });

    it('should create', () => {
      expect(guard).toBeTruthy();
    });

    it('should activate if access token exists', () => {
      tokenProducer.next(getTestAuthToken());
      expect(guard.canActivate(null, null)).toBeTrue();
    });

    it('should redirect to /login if access token does not exist', () => {
      spyOn(console, 'log');
      tokenProducer.next(null);
      expect(guard.canActivate(null, null)).toBeFalse();
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/login');
    });
  });

  describe('AuthState', () => {
    let store: Store;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [NgxsModule.forRoot([SpotifyAuthState], {developmentMode: true})]
      });
      store = TestBed.inject(Store);
      store.reset({
        ...store.snapshot(),
        SHOWTUNES_SPOTIFY_AUTH: {
          token: getTestAuthToken(),
          isAuthenticated: true
        }
      });
    });

    it('should select token', () => {
      const token = selectToken(store);
      expect(token).toEqual(getTestAuthToken());
    });

    it('should select isAuthenticated', () => {
      const isAuthenticated = selectIsAuthenticated(store);
      expect(isAuthenticated).toBeTrue();
    });

    it('should set AuthToken', () => {
      const newToken: SpotifyAuthToken = {
        ...getTestAuthToken(),
        accessToken: 'new-token'
      };
      store.dispatch(new SetAuthToken(newToken));

      const token = selectToken(store);
      const isAuthenticated = selectIsAuthenticated(store);
      expect(token).toEqual(newToken);
      expect(isAuthenticated).toBeTrue();
    });

    it('should set isAuthenticated to false if AuthToken set to null', () => {
      store.dispatch(new SetAuthToken(null));

      const token = selectToken(store);
      const isAuthenticated = selectIsAuthenticated(store);
      expect(token).toBeNull();
      expect(isAuthenticated).toBeFalse();
    });
  });
});

function selectToken(store: Store): SpotifyAuthToken {
  return store.selectSnapshot(state => state[SPOTIFY_AUTH_STATE_NAME].token);
}

function selectIsAuthenticated(store: Store): boolean {
  return store.selectSnapshot(state => state[SPOTIFY_AUTH_STATE_NAME].isAuthenticated);
}
