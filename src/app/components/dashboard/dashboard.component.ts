import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChangeDashboard } from '../../core/dashboard/dashboard.action';
import { Dashboards, DashboardType } from '../../core/dashboard/dashboard.model';
import { DashboardState } from '../../core/dashboard/dashboard.state';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Select(DashboardState.currentDashboard) dashboard$: Observable<DashboardType>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store
  ) {}

  ngOnInit(): void {
    const type = this.route.snapshot.paramMap.get('type');
    const validDashboardTypes = Dashboards.map(d => d.name.toLowerCase());
    if (type == null || !validDashboardTypes.includes(type.toLowerCase())) {
      console.error(`Invalid dashboard type requested: '${type}'. Valid types are [${validDashboardTypes.join(', ')}]`);
      this.router.navigate(['/landing']);
      return;
    }
    const dashboardType = Dashboards.find(d => d.name.toLowerCase() === type.toLowerCase());
    this.store.dispatch(new ChangeDashboard(dashboardType));

    this.dashboard$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
