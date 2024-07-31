import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, from, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { SpotifyEndpoints } from '../../../core/spotify/spotify-endpoints';
import { SpotifyAPIResponse } from '../../../core/types';
import { SpotifyAuthService } from '../auth/spotify-auth.service';

@Injectable()
export class SpotifyInterceptor implements HttpInterceptor {
  private static readonly urlRequiresAuth = new Map<string, boolean>();

  constructor(private auth: SpotifyAuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!SpotifyEndpoints.isInitialized()) {
      return next.handle(req);
    }

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
          return from(this.auth.checkErrorResponse(err))
            .pipe(switchMap((apiResponse) => {
              if (apiResponse === SpotifyAPIResponse.ReAuthenticated) {
                req = this.generateAuthHeaders(req);
                return next.handle(req);
              }
              else if (apiResponse === SpotifyAPIResponse.Restricted) {
                // If the response was restricted, cancel the request
                return EMPTY;
              }
              console.error(`Unexpected error response when handling request: ${req.url}`);
              return throwError(err);
            }));
        }
        console.error(`Unexpected error type when handling request: ${req.url}`);
        return throwError(err);
      })
    );
  }

  private checkTokenExpiryThreshold(req: HttpRequest<any>): Promise<HttpRequest<any>> {
    return new Promise((resolve, reject) => {
      if (this.requestContainsAuthHeaders(req)) {
        this.auth.checkAuthTokenWithinExpiryThreshold()
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
      const authHeader = this.auth.getAuthHeaders();
      if (!authHeader) {
        return null;
      }
      authReq = req.clone({
        headers: req.headers.set('Authorization', authHeader.get('Authorization'))
      });
    }
    return authReq;
  }

  private urlRequiresAuth(url: string): boolean {
    if (SpotifyInterceptor.urlRequiresAuth.has(url)) {
      return SpotifyInterceptor.urlRequiresAuth.get(url);
    }

    const requiresAuth = url.startsWith(SpotifyEndpoints.getSpotifyApiUrl()) && !url.endsWith(SpotifyEndpoints.getTokenEndpoint());
    SpotifyInterceptor.urlRequiresAuth.set(url, requiresAuth);
    return requiresAuth;
  }

  private requestContainsAuthHeaders(req: HttpRequest<any>): boolean {
    return req.headers.has('Authorization');
  }
}
