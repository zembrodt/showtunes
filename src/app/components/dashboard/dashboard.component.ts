import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Dashboards, DashboardType } from '../../models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  dashboardType: DashboardType;

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    const type = this.route.snapshot.paramMap.get('type');
    const validDashboardTypes = Dashboards.map(d => d.name.toLowerCase());
    if (type == null || !validDashboardTypes.includes(type.toLowerCase())) {
      console.error(`Invalid dashboard type requested: '${type}'. Valid types are [${validDashboardTypes.join(', ')}]`);
      this.router.navigate(['/landing']);
      return;
    }
    this.dashboardType = Dashboards.find(d => d.name.toLowerCase() === type.toLowerCase());
  }
}
