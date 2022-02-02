import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { SetAuthToken, SetIsAuthenticated } from './auth.actions';
import { AUTH_STATE_NAME, AuthModel, AuthToken, DEFAULT_AUTH } from './auth.model';

@State<AuthModel>({
  name: AUTH_STATE_NAME,
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
