import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SpotifyAPIResponse, SpotifyService } from './spotify.service';

@Injectable()
export class SpotifyInterceptor implements HttpInterceptor {
  constructor(private spotify: SpotifyService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let authReq = req;
    if (req.url.startsWith(SpotifyService.spotifyApiUrl)) {
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
          const apiResponse = this.spotify.checkErrorResponse(err);
          if (apiResponse === SpotifyAPIResponse.ReAuthenticated) {
            return next.handle(authReq);
          }
        }
        return throwError(err);
      })
    );
  }
}
