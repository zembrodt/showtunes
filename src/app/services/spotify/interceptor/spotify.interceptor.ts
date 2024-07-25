import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { SpotifyEndpoints } from '../../../core/spotify/spotify-endpoints';
import { SpotifyAPIResponse } from '../../../core/types';
import { SpotifyAuthService } from '../auth/spotify-auth.service';

@Injectable()
export class SpotifyInterceptor implements HttpInterceptor {
  private static readonly authRequestUrls = new Set();
  private static readonly requestUrls = new Set();

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
          console.log('interceptor err: ' + JSON.stringify(err));
          return from(this.auth.checkErrorResponse(err))
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
    if (SpotifyInterceptor.authRequestUrls.has(url)) {
      return true;
    }
    else if (SpotifyInterceptor.requestUrls.has(url)) {
      return false;
    }

    const requiresAuth = url.startsWith(SpotifyEndpoints.getSpotifyApiUrl()) && !url.endsWith(SpotifyEndpoints.getTokenEndpoint());
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
