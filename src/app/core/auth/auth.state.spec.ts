import { TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { Router } from '@angular/router';
import { NgxsModule, Store } from '@ngxs/store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { NgxsSelectorMock } from '../testing/ngxs-selector-mock';
import { SetAuthToken } from './auth.actions';
import { AuthGuard } from './auth.guard';
import { AUTH_STATE_NAME, AuthToken } from './auth.model';
import { AuthState } from './auth.state';

const TEST_AUTH_TOKEN: AuthToken = {
  accessToken: 'test-token',
  tokenType: 'test-type',
  expiry: (new Date(Date.UTC(9999, 1, 1))).toString(),
  scope: 'test-scope',
  refreshToken: 'test-refresh'
};

describe('Authentication', () => {
  describe('AuthGuard', () => {
    const mockSelectors = new NgxsSelectorMock<AuthGuard>();
    let guard: AuthGuard;
    let router: Router;
    let tokenProducer: BehaviorSubject<AuthToken>;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          NgxsModule.forRoot([], {developmentMode: true})
        ],
        providers: [
          AuthGuard,
          MockProvider(Router)
        ]
      });
      guard = TestBed.inject(AuthGuard);
      router = TestBed.inject(Router);
      tokenProducer = mockSelectors.defineNgxsSelector<AuthToken>(guard, 'token$');
      guard.initSubscriptions();
    });

    it('should create', () => {
      expect(guard).toBeTruthy();
    });

    it('should activate if access token exists', () => {
      tokenProducer.next(TEST_AUTH_TOKEN);
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
        imports: [NgxsModule.forRoot([AuthState], {developmentMode: true})]
      });
      store = TestBed.inject(Store);
      store.reset({
        ...store.snapshot(),
        SHOWTUNES_AUTH: {
          token: TEST_AUTH_TOKEN,
          isAuthenticated: true
        }
      });
    });

    it('should select token', () => {
      const token = selectToken(store);
      expect(token).toEqual(TEST_AUTH_TOKEN);
    });

    it('should select isAuthenticated', () => {
      const isAuthenticated = selectIsAuthenticated(store);
      expect(isAuthenticated).toBeTrue();
    });

    it('should set AuthToken', () => {
      const newToken: AuthToken = {
        ...TEST_AUTH_TOKEN,
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

function selectToken(store: Store): AuthToken {
  return store.selectSnapshot(state => state[AUTH_STATE_NAME].token);
}

function selectIsAuthenticated(store: Store): boolean {
  return store.selectSnapshot(state => state[AUTH_STATE_NAME].isAuthenticated);
}
