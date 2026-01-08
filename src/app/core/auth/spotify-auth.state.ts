import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { SetAuthToken, SetIsAuthenticated } from './spotify-auth.actions';
import { SPOTIFY_AUTH_STATE_NAME, SpotifyAuthModel, SpotifyAuthToken, DEFAULT_SPOTIFY_AUTH } from './spotify-auth.model';

@State<SpotifyAuthModel>({
  name: SPOTIFY_AUTH_STATE_NAME,
  defaults: DEFAULT_SPOTIFY_AUTH
})
@Injectable()
export class SpotifyAuthState {
  constructor() { }

  @Selector()
  static token(state: SpotifyAuthModel): SpotifyAuthToken {
    return state.token;
  }

  @Selector()
  static isAuthenticated(state: SpotifyAuthModel): boolean {
    return state.isAuthenticated;
  }

  @Action(SetAuthToken)
  setAuthToken(ctx: StateContext<SpotifyAuthModel>, action: SetAuthToken): void {
    ctx.patchState({
      token: action.token,
      isAuthenticated: action.token != null
    });
  }

  @Action(SetIsAuthenticated)
  setIsAuthenticated(ctx: StateContext<SpotifyAuthModel>, action: SetIsAuthenticated): void {
    ctx.patchState({isAuthenticated: action.isAuthenticated});
  }
}
