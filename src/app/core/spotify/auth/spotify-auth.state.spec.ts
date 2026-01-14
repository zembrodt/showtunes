import { TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { getTestAuthToken } from '../../testing/test-models';
import { SetAuthToken } from './spotify-auth.actions';
import { SPOTIFY_AUTH_STATE_NAME, SpotifyAuthToken } from './spotify-auth.model';
import { SpotifyAuthState } from './spotify-auth.state';

describe('SpotifyAuthState', () => {
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

function selectToken(store: Store): SpotifyAuthToken {
  return store.selectSnapshot(state => state[SPOTIFY_AUTH_STATE_NAME].token);
}

function selectIsAuthenticated(store: Store): boolean {
  return store.selectSnapshot(state => state[SPOTIFY_AUTH_STATE_NAME].isAuthenticated);
}
