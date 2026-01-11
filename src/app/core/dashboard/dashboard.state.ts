import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { ChangeDashboard } from './dashboard.action';
import { DASHBOARD_STATE_NAME, DashboardModel, DashboardType, DEFAULT_DASHBOARD } from './dashboard.model';

@State<DashboardModel>({
  name: DASHBOARD_STATE_NAME,
  defaults: DEFAULT_DASHBOARD
})
@Injectable()
export class DashboardState {
  @Selector()
  static currentDashboard(state: DashboardModel): DashboardType {
    return state.currentDashboard;
  }

  @Action(ChangeDashboard)
  changeDashboard(ctx: StateContext<DashboardModel>, action: ChangeDashboard): void {
    ctx.patchState({currentDashboard: action.dashboard});
  }
}
