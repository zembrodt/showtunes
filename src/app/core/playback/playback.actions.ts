import { AlbumModel, DeviceModel, PlaylistModel, TrackModel } from './playback.model';

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

export class ChangeRepeatState {
  static readonly type = `${PLAYBACK_ACTION_NAME} Change Repeat State`;
  constructor(public repeatState: string) { }
}

export class SetLiked {
  static readonly type = `${PLAYBACK_ACTION_NAME} Set Liked`;
  constructor(public isLiked: boolean) { }
}

export class SetIdle {
  static readonly type = `${PLAYBACK_ACTION_NAME} Set Idle`;
  constructor(public isIdle: boolean) { }
}
