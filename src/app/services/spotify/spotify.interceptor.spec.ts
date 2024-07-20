import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpRequest,
  HttpStatusCode
} from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { MockProvider } from 'ng-mocks';
import { Observable, throwError } from 'rxjs';
import { AppConfig } from '../../app.config';
import { SpotifyInterceptor } from './spotify.interceptor';
import { SpotifyAPIResponse, SpotifyService } from './spotify.service';

function createNextHandler(): HttpHandler {
  return {
    handle: (_: HttpRequest<any>) => {
      return new Observable((subscriber) => {
        subscriber.complete();
      });
    }
  };
}

function createNextHandlerCheckAuthHeaders(): HttpHandler {
  return {
    handle: (req: HttpRequest<any>) => {
      expect(req.headers.has('Authorization')).toBeTrue();
      return new Observable<HttpEvent<any>>(subscriber => subscriber.complete());
    }
  };
}

function createNextHandlerReturnsError(err: any): HttpHandler {
  return {
    handle: (_: HttpRequest<any>) => {
      throw err;
    }
  };
}

const TEST_API_URL = 'spotify-url';
const AUTH_REQ = new HttpRequest('GET', TEST_API_URL + '/test');

describe('SpotifyInterceptor', () => {
  let interceptor: SpotifyInterceptor;
  let spotify: SpotifyService;
  let httpMock: HttpTestingController;
  let http: HttpClient;

  beforeEach(() => {
    AppConfig.settings = {
      env: {
        name: 'test-name',
        domain: 'test-domain',
        spotifyApiUrl: TEST_API_URL,
        spotifyAccountsUrl: 'spotify-accounts'
      },
      auth: {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        scopes: 'test-scope',
        tokenUrl: 'token-url',
        forcePkce: true,
        showDialog: true
      },
      logging: null
    };
    SpotifyService.initialize();

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        SpotifyInterceptor,
        MockProvider(SpotifyService)
      ]
    });
    spotify = TestBed.inject(SpotifyService);
    interceptor = TestBed.inject(SpotifyInterceptor);
    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);

    spotify.getAuthorizationHeader = jasmine.createSpy().and.returnValue('test-token');
    spotify.checkAuthTokenWithinExpiryThreshold = jasmine.createSpy().and.returnValue(Promise.resolve(SpotifyAPIResponse.Success));
  });

  it('should throw an error if no auth token is present and auth is required', () => {
    spotify.getAuthorizationHeader = jasmine.createSpy().and.returnValue(null);

    interceptor.intercept(AUTH_REQ, createNextHandler()).subscribe({
      error: err => expect(err).not.toBeNull()
    });
  });

  it('should add auth headers to request if auth is required', () => {
    interceptor.intercept(AUTH_REQ, createNextHandlerCheckAuthHeaders()).subscribe({
      error: err => expect(err).toBeNull()
    });
  });

  it('should throw an error if handled request returns unknown error', () => {
    interceptor.intercept(AUTH_REQ, createNextHandlerReturnsError(new Error('test-error'))).subscribe({
      error: err => expect(err).not.toBeNull()
    });
  });

  it('should throw an error if handled request returns HttpErrorResponse but is not reaunthenticated', () => {
    spotify.checkErrorResponse = jasmine.createSpy().and.returnValue(Promise.resolve(SpotifyAPIResponse.Error));
    const next = createNextHandlerReturnsError(new HttpErrorResponse({status: HttpStatusCode.Forbidden}));

    interceptor.intercept(AUTH_REQ, next).subscribe({
      error: err => {
        expect(err).not.toBeNull();
      }
    });
  });

  it('should handle request after reauthentication and update headers if first handled request returns HttpErrorResponse and is reaunthenticated', () => {
    const next = createNextHandler();
    const handleSpy = jasmine.createSpy().and.returnValues(
      throwError(new HttpErrorResponse({status: HttpStatusCode.Unauthorized})),
      new Observable<HttpEvent<any>>(subscriber => subscriber.complete())
    );
    next.handle = handleSpy;
    spotify.checkErrorResponse = jasmine.createSpy().and.returnValue(Promise.resolve(SpotifyAPIResponse.ReAuthenticated));
    spotify.getAuthorizationHeader = jasmine.createSpy().and.returnValues('test-token', 'refresh-token');

    interceptor.intercept(AUTH_REQ, next).subscribe({
      complete: () => {
        expect(next.handle).toHaveBeenCalledTimes(2);
        expect(spotify.getAuthorizationHeader).toHaveBeenCalledTimes(2);
        const firstRequest: HttpRequest<any> = handleSpy.calls.all()[0].args[0];
        const secondRequest: HttpRequest<any> = handleSpy.calls.all()[1].args[0];
        expect(firstRequest.headers.get('Authorization')).toEqual('test-token');
        expect(secondRequest.headers.get('Authorization')).toEqual('refresh-token');
      }});
  });

  it('should handle request and update headers after new token is refreshed when within expiry threshold', () => {
    const next = createNextHandler();
    const handleSpy = jasmine.createSpy().and.returnValues(
      new Observable<HttpEvent<any>>(subscriber => subscriber.complete())
    );
    next.handle = handleSpy;
    spotify.checkAuthTokenWithinExpiryThreshold = jasmine.createSpy().and.returnValues(Promise.resolve(SpotifyAPIResponse.ReAuthenticated));
    spotify.getAuthorizationHeader = jasmine.createSpy().and.returnValues('test-token', 'refresh-token');

    interceptor.intercept(AUTH_REQ, next).subscribe({
      complete: () => {
        expect(next.handle).toHaveBeenCalledTimes(1);
        expect(spotify.getAuthorizationHeader).toHaveBeenCalledTimes(2);
        const request: HttpRequest<any> = handleSpy.calls.all()[0].args[0];
        expect(request.headers.get('Authorization')).toEqual('refresh-token');
      }});
  });

  it('should not add auth headers to the request if a token endpoint', () => {
    const next = createNextHandler();
    const handleSpy = jasmine.createSpy().and.returnValues(
      new Observable<HttpEvent<any>>(subscriber => subscriber.complete())
    );
    next.handle = handleSpy;
    const tokenReq = new HttpRequest('GET', TEST_API_URL + '/test' + SpotifyService.spotifyEndpoints.getTokenEndpoint());

    interceptor.intercept(tokenReq, next).subscribe({
      complete: () => {
        expect(next.handle).toHaveBeenCalledTimes(1);
        expect(spotify.getAuthorizationHeader).not.toHaveBeenCalled();
        const request: HttpRequest<any> = handleSpy.calls.all()[0].args[0];
        expect(request.headers.has('Authorization')).toBeFalse();
      }
    });
  });

  it('should not add auth headers to the request if not an auth endpoint', () => {
    const next = createNextHandler();
    const handleSpy = jasmine.createSpy().and.returnValues(
      new Observable<HttpEvent<any>>(subscriber => subscriber.complete())
    );
    next.handle = handleSpy;
    const nonAuthReq = new HttpRequest('GET', '/test');

    interceptor.intercept(nonAuthReq, next).subscribe({
      complete: () => {
        expect(next.handle).toHaveBeenCalledTimes(1);
        expect(spotify.getAuthorizationHeader).not.toHaveBeenCalled();
        const request: HttpRequest<any> = handleSpy.calls.all()[0].args[0];
        expect(request.headers.has('Authorization')).toBeFalse();
      }
    });
  });

  it('should throw an error if spotify checkAuthTokenWithinExpiryThreshold returns unexpected response', () => {
    const next = createNextHandler();
    next.handle = jasmine.createSpy();
    spotify.checkAuthTokenWithinExpiryThreshold = jasmine.createSpy().and.returnValue(Promise.resolve(SpotifyAPIResponse.Error));

    interceptor.intercept(AUTH_REQ, next).subscribe({
      error: (err) => {
        expect(err).not.toBeNull();
        expect(next.handle).not.toHaveBeenCalled();
      }
    });
  });

  it('should throw an error if spotify checkAuthTokenWithinExpiryThreshold throws an error', () => {
    const next = createNextHandler();
    next.handle = jasmine.createSpy();
    spotify.checkAuthTokenWithinExpiryThreshold = jasmine.createSpy().and.returnValue(Promise.reject('test-error'));

    interceptor.intercept(AUTH_REQ, next).subscribe({
      error: (err) => {
        expect(err).not.toBeNull();
        expect(next.handle).not.toHaveBeenCalled();
      }
    });
  });
});
