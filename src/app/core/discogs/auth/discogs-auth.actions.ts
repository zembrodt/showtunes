import { DiscogsAccessToken } from './discogs-auth.model';

const DISCOGS_AUTH_ACTION_NAME = '[Discogs Authentication]';

export class SetRequestToken {
  static readonly type = `${DISCOGS_AUTH_ACTION_NAME} Set Request Token`;
  constructor(public requestToken: string) {}
}

export class SetAccessToken {
  static readonly type = `${DISCOGS_AUTH_ACTION_NAME} Set Access Token`;
  constructor(public accessToken: DiscogsAccessToken) {}
}

export class SetIsAuthenticated {
  static readonly type = `${DISCOGS_AUTH_ACTION_NAME} Set Is Authenticated`;
  constructor(public isAuthenticated: boolean) {}
}

export class LogoutAuth {
  static readonly type = `${DISCOGS_AUTH_ACTION_NAME} Logout Auth`;
  constructor() {}
}
