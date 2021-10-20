import {Action, Selector, State, StateContext} from '@ngxs/store';
import {AuthModel, AuthToken, DEFAULT_AUTH} from './auth.model';
import {Injectable} from '@angular/core';
import {SetAuthToken, SetIsAuthenticated} from './auth.actions';

@State<AuthModel>({
  name: 'MUSIC_DISPLAY_AUTH',
  defaults: DEFAULT_AUTH
})
@Injectable()
export class AuthState {
  constructor() { }

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
}
