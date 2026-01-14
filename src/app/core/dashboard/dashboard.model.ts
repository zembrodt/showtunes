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
  } as DashboardType,
  Discogs: {
    name: 'Discogs',
    allowsAlbumArt: true,
    allowsTrackPlayer: false
  } as DashboardType
};

export const Dashboards = [ Dashboard.Spotify, Dashboard.Discogs ];

export interface DashboardModel {
  currentDashboard: DashboardType;
}

export const DEFAULT_DASHBOARD: DashboardModel = {
  currentDashboard: null
};
