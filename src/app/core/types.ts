import { MockImageElement } from './testing/mock-image-element';

export type ImageElement = HTMLImageElement | MockImageElement;

export enum AuthType {
  PKCE,
  Secret,
  ThirdParty
}

export enum SpotifyAPIResponse {
  Success,
  NoPlayback,
  ReAuthenticated,
  Error
}
