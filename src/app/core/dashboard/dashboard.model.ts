export const DASHBOARD_STATE_NAME = 'SHOWTUNES_DASHBOARD';

export interface DashboardType {
  name: string;
  allowsAlbumArt: boolean;
  allowsTrackPlayer: boolean;
}

export const Dashboard = {
  Spotify: {
    name: 'Spotify',
    allowsAlbumArt: true,
    allowsTrackPlayer: true
  } as DashboardType
};

export const Dashboards = [ Dashboard.Spotify ];

export interface DashboardModel {
  currentDashboard: DashboardType;
}

export const DEFAULT_DASHBOARD: DashboardModel = {
  currentDashboard: null
};
