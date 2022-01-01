import {Injectable, OnDestroy} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Select} from '@ngxs/store';
import {Observable, Subject} from 'rxjs';
import {AuthState} from './auth.state';
import {takeUntil} from 'rxjs/operators';
import {AuthToken} from './auth.model';

@Injectable()
export class AuthGuard implements CanActivate, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Select(AuthState.token) token$: Observable<AuthToken>;
  private accessToken: string = null;

  constructor(private router: Router) {
    this.token$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((token) => this.accessToken = token ? token.accessToken : null);
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.accessToken) {
      return true;
    } else {
      console.log(`Access token does not exist, redirecting to /login`);
      this.router.navigateByUrl('/login');
      return false;
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
