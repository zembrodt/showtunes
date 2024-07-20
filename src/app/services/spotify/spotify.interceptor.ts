import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, Observable, pipe, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { SpotifyAPIResponse, SpotifyService } from './spotify.service';

@Injectable()
export class SpotifyInterceptor implements HttpInterceptor {
  private static readonly authRequestUrls = new Set();
  private static readonly requestUrls = new Set();

  constructor(private spotify: SpotifyService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authReq = this.generateAuthHeaders(req);
    if (authReq === null) {
      return throwError('No auth token present');
    }

    return from(this.checkTokenExpiryThreshold(authReq)).pipe(
      switchMap((expiryReq) => {
        return this.handleRequest(expiryReq, next);
      }),
      catchError(err => throwError(err))
    );
  }

  private handleRequest(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError(err => {
        if (err instanceof HttpErrorResponse) {
          return from(this.spotify.checkErrorResponse(err))
            .pipe(switchMap((apiResponse) => {
              if (apiResponse === SpotifyAPIResponse.ReAuthenticated) {
                req = this.generateAuthHeaders(req);
                return next.handle(req);
              }
            }));
        }
        return throwError(err);
      })
    );
  }

  private checkTokenExpiryThreshold(req: HttpRequest<any>): Promise<HttpRequest<any>> {
    return new Promise((resolve, reject) => {
      if (this.requestContainsAuthHeaders(req)) {
        this.spotify.checkAuthTokenWithinExpiryThreshold()
          .then((apiResponse) => {
            switch (apiResponse) {
              case SpotifyAPIResponse.ReAuthenticated:
                resolve(this.generateAuthHeaders(req));
                break;
              case SpotifyAPIResponse.Success:
                resolve(req);
                break;
              default:
                reject('Unexpected response when attempting to check auth token expiry threshold: ' + apiResponse);
            }
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        resolve(req);
      }
    });
  }

  private generateAuthHeaders(req: HttpRequest<any>): HttpRequest<any> {
    let authReq = req;
    if (this.urlRequiresAuth(req.url)) {
      const authHeader = this.spotify.getAuthorizationHeader();
      if (!authHeader) {
        return null;
      }
      authReq = req.clone({
        headers: req.headers.set('Authorization', authHeader)
      });
    }
    return authReq;
  }

  private urlRequiresAuth(url: string): boolean {
    if (SpotifyInterceptor.authRequestUrls.has(url)) {
      return true;
    }
    else if (SpotifyInterceptor.requestUrls.has(url)) {
      return false;
    }

    const requiresAuth = url.startsWith(SpotifyService.spotifyApiUrl) && !url.endsWith(SpotifyService.spotifyEndpoints.getTokenEndpoint());
    if (requiresAuth) {
      SpotifyInterceptor.authRequestUrls.add(url);
    } else {
      SpotifyInterceptor.requestUrls.add(url);
    }

    return requiresAuth;
  }

  private requestContainsAuthHeaders(req: HttpRequest<any>): boolean {
    return req.headers.has('Authorization');
  }
}
