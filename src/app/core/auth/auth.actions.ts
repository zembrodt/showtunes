import {AuthToken} from './auth.model';

export class SetAuthToken {
  static readonly type = '[Authentication] Set Auth Token';
  constructor(public token: AuthToken) { }
}

export class SetIsAuthenticated {
  static readonly type = '[Authentication] Set Is Authenticated';
  constructor(public isAuthenticated: boolean) { }
}
