import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { MockProvider } from 'ng-mocks';
import { AppConfig } from '../../app.config';
import { SpotifyInterceptor } from './spotify.interceptor';
import { SpotifyAPIResponse, SpotifyService } from './spotify.service';


describe('SpotifyInterceptor', () => {
  let spotify: SpotifyService;
  let httpMock: HttpTestingController;
  let http: HttpClient;

  beforeEach(() => {
    AppConfig.settings = {
      env: {
        name: 'test-name',
        domain: 'test-domain',
        spotifyApiUrl: 'spotify-url',
        albumColorUrl: 'album-url'
      },
      auth: {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        tokenUrl: 'token-url'
      },
      logging: null
    };
    SpotifyService.initialize();

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: SpotifyInterceptor,
          multi: true
        },
        MockProvider(SpotifyService),
      ]
    });
    spotify = TestBed.inject(SpotifyService);
    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
  });

  it('should catch HTTP response error and retry request on reauthentication', () => {
    spotify.checkErrorResponse = jasmine.createSpy().and.returnValue(SpotifyAPIResponse.ReAuthenticated);
    http.get('/test').subscribe(
      (data) => expect(data).toBeTruthy(),
      (err) => {
        console.log(err);
        fail('Should not have thrown error');
    });

    let request = httpMock.expectOne('/test');
    request.error(new ProgressEvent('401 Invalid token'), {
      status: 401,
      statusText: 'Invalid token'
    });
    request = httpMock.expectOne('/test');
    request.flush({
      status: 200,
      statusText: 'Ok'
    });
    httpMock.verify();
  });

  it('should catch HTTP response error and fail when cannot reauthenticate', () => {
    spotify.checkErrorResponse = jasmine.createSpy().and.returnValue(SpotifyAPIResponse.Error);
    http.get('/test').subscribe(
      (data) => {
        console.log(data);
        fail('Should not of had a successful request');
      },
      (err) => expect(err).toBeTruthy());

    const request = httpMock.expectOne('/test');
    request.error(new ProgressEvent('429 Exceeded rate limit'), {
      status: 429,
      statusText: 'Exceeded rate limit'
    });
    httpMock.verify();
  });

  it('should add the Authorization header when making a request for the Spotify API URL', () => {
    spotify.getAuthorizationHeader = jasmine.createSpy().and.returnValue('test-token');
    http.get('spotify-url').subscribe(
      (data) => expect(data).toBeTruthy(),
      (err) => {
        console.log(err);
        fail('Should not have thrown error');
    });

    const request = httpMock.expectOne('spotify-url');
    request.flush({
      status: 200,
      statusText: 'Ok'
    });
    httpMock.verify();

    expect(request.request.headers.get('Authorization')).toEqual('test-token');
  });

  it('should throw an error when making a request to the Spotify API URL but no authToken', () => {
    spotify.getAuthorizationHeader = jasmine.createSpy().and.returnValue(null);
    http.get('spotify-url').subscribe(
      (data) => {
        console.log(data);
        fail('Should not have returned successfully');
      },
      (err) => {
        expect(err).toBeTruthy();
      });

    httpMock.expectNone('spotify-url');
    httpMock.verify();
  });

  it('should not add the Authorization header when request is not to the Spotify API URL', () => {
    spotify.getAuthorizationHeader = jasmine.createSpy().and.returnValue('test-token');
    http.get('album-url').subscribe(
      (data) => expect(data).toBeTruthy(),
      (err) => {
        console.log(err);
        fail('Should not have thrown error');
      });

    const request = httpMock.expectOne('album-url');
    request.flush({
      status: 200,
      statusText: 'Ok'
    });
    httpMock.verify();

    expect(request.request.headers.get('Authorization')).toBeFalsy();
  });
});
