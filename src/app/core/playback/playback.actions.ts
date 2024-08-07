import { AlbumModel, DeviceModel, DisallowsModel, PlayerState, PlaylistModel, TrackModel } from './playback.model';

const PLAYBACK_ACTION_NAME = '[Playback]';

export class ChangeTrack {
  static readonly type = `${PLAYBACK_ACTION_NAME} Change Track`;
  constructor(public track: TrackModel) { }
}

export class ChangeAlbum {
  static readonly type = `${PLAYBACK_ACTION_NAME} Change Album`;
  constructor(public album: AlbumModel) { }
}

export class ChangePlaylist {
  static readonly type = `${PLAYBACK_ACTION_NAME} Change Playlist`;
  constructor(public playlist: PlaylistModel) { }
}

export class ChangeDevice {
  static readonly type = `${PLAYBACK_ACTION_NAME} Change Device`;
  constructor(public device: DeviceModel) { }
}

export class ChangeDeviceVolume {
  static readonly type = `${PLAYBACK_ACTION_NAME} Change Device Volume`;
  constructor(public volume: number) { }
}

export class ChangeDeviceIsActive {
  static readonly type = `${PLAYBACK_ACTION_NAME} Change Device IsActive`;
  constructor(public isActive: boolean) { }
}

export class SetAvailableDevices {
  static readonly type = `${PLAYBACK_ACTION_NAME} Set Available Devices`;
  constructor(public devices: DeviceModel[]) { }
}

export class SetProgress {
  static readonly type = `${PLAYBACK_ACTION_NAME} Set Progress`;
  constructor(public progress: number) { }
}

export class SetPlaying {
  static readonly type = `${PLAYBACK_ACTION_NAME} Set Playing`;
  constructor(public isPlaying: boolean) { }
}

export class SetShuffle {
  static readonly type = `${PLAYBACK_ACTION_NAME} Set Shuffle`;
  constructor(public isShuffle: boolean) { }
}

export class SetSmartShuffle {
  static readonly type = `${PLAYBACK_ACTION_NAME} Set Smart Shuffle`;
  constructor(public isSmartShuffle: boolean) { }
}

export class ChangeRepeatState {
  static readonly type = `${PLAYBACK_ACTION_NAME} Change Repeat State`;
  constructor(public repeatState: string) { }
}

export class SetLiked {
  static readonly type = `${PLAYBACK_ACTION_NAME} Set Liked`;
  constructor(public isLiked: boolean) { }
}

export class SetPlayerState {
  static readonly type = `${PLAYBACK_ACTION_NAME} Set Player State`;
  constructor(public playerState: PlayerState) { }
}

export class SetDisallows {
  static readonly type = `${PLAYBACK_ACTION_NAME} Set Disallows`;
  constructor(public disallows: DisallowsModel) {}
}
