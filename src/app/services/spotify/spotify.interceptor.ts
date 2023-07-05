import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { SpotifyAPIResponse, SpotifyService } from './spotify.service';

@Injectable()
export class SpotifyInterceptor implements HttpInterceptor {
  constructor(private spotify: SpotifyService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let authReq = req;
    if (req.url.startsWith(SpotifyService.spotifyApiUrl) && !req.url.endsWith(SpotifyService.TOKEN_ENDPOINT)) {
      const authHeader = this.spotify.getAuthorizationHeader();
      if (!authHeader) {
        return throwError('No auth token present');
      }
      authReq = req.clone({
        headers: req.headers.set('Authorization', authHeader)
      });
    }

    return next.handle(authReq).pipe(
      catchError(err => {
        if (err instanceof HttpErrorResponse) {
          return from(this.spotify.checkErrorResponse(err))
            .pipe(switchMap((apiResponse) => {
              if (apiResponse === SpotifyAPIResponse.ReAuthenticated) {
                return next.handle(authReq);
              }
            }));
        }
        return throwError(err);
      })
    );
  }
}
