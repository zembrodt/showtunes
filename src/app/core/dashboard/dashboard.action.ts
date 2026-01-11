import { DashboardType } from './dashboard.model';

const DASHBOARD_ACTION_NAME = '[Dashboard]';

export class ChangeDashboard {
  static readonly type = `${DASHBOARD_ACTION_NAME} Change Dashboard`;
  constructor(public dashboard: DashboardType) {}
}
