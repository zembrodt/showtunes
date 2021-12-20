import {AuthToken} from './auth.model';

const AUTH_ACTION_NAME = '[Authentication]';

export class SetAuthToken {
  static readonly type = `${AUTH_ACTION_NAME} Set Auth Token`;
  constructor(public token: AuthToken) { }
}

export class SetIsAuthenticated {
  static readonly type = `${AUTH_ACTION_NAME} Set Is Authenticated`;
  constructor(public isAuthenticated: boolean) { }
}

export class LogoutAuth {
  static readonly type = `${AUTH_ACTION_NAME} Logout Auth`;
  constructor() { }
}
