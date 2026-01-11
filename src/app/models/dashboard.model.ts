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
