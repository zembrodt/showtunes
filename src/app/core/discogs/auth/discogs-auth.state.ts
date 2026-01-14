import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { SetAccessToken, SetIsAuthenticated, SetRequestToken } from './discogs-auth.actions';
import { DEFAULT_DISCOGS_AUTH, DISCOGS_AUTH_STATE_NAME, DiscogsAccessToken, DiscogsAuthModel } from './discogs-auth.model';

@State<DiscogsAuthModel>({
  name: DISCOGS_AUTH_STATE_NAME,
  defaults: DEFAULT_DISCOGS_AUTH
})
@Injectable()
export class DiscogsAuthState {
  constructor() {}

  @Selector()
  static requestToken(state: DiscogsAuthModel): string {
    return state.requestToken;
  }

  @Selector()
  static accessToken(state: DiscogsAuthModel): DiscogsAccessToken {
    return state.accessToken;
  }

  @Selector()
  static isAuthenticated(state: DiscogsAuthModel): boolean {
    return state.isAuthenticated;
  }

  @Action(SetRequestToken)
  setRequestToken(ctx: StateContext<DiscogsAuthModel>, action: SetRequestToken): void {
    ctx.patchState({ requestToken: action.requestToken });
  }

  @Action(SetAccessToken)
  setAccessToken(ctx: StateContext<DiscogsAuthModel>, action: SetAccessToken): void {
    ctx.patchState({
      accessToken: action.accessToken,
      isAuthenticated: action.accessToken != null
    });
  }

  @Action(SetIsAuthenticated)
  setIsAuthenticated(ctx: StateContext<DiscogsAuthModel>, action: SetIsAuthenticated): void {
    ctx.patchState({ isAuthenticated: action.isAuthenticated });
  }
}
