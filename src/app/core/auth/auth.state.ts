import {Action, Selector, State, StateContext} from '@ngxs/store';
import {AUTH_STATE_NAME, AuthModel, AuthToken, DEFAULT_AUTH} from './auth.model';
import {Injectable} from '@angular/core';
import {LogoutAuth, SetAuthToken, SetIsAuthenticated} from './auth.actions';
import {StorageService} from '../../services/storage/storage.service';
import {SpotifyService} from '../../services/spotify/spotify.service';

@State<AuthModel>({
  name: AUTH_STATE_NAME,
  defaults: DEFAULT_AUTH
})
@Injectable()
export class AuthState {
  constructor(private storage: StorageService) { }

  @Selector()
  static token(state: AuthModel): AuthToken {
    return state.token;
  }

  @Selector()
  static isAuthenticated(state: AuthModel): boolean {
    return state.isAuthenticated;
  }

  @Action(SetAuthToken)
  setAuthToken(ctx: StateContext<AuthModel>, action: SetAuthToken): void {
    ctx.patchState({
      token: action.token,
      isAuthenticated: action.token != null
    });
  }

  @Action(SetIsAuthenticated)
  setIsAuthenticated(ctx: StateContext<AuthModel>, action: SetIsAuthenticated): void {
    ctx.patchState({isAuthenticated: action.isAuthenticated});
  }

  @Action(LogoutAuth)
  logoutAuth(ctx: StateContext<AuthModel>, action: LogoutAuth): void {
    ctx.patchState({
      token: null,
      isAuthenticated: false
    });
    // Delete local storage variables
    this.storage.removeAuthToken();
    this.storage.remove(SpotifyService.stateKey);
  }
}
