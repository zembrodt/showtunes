import {AlbumModel, DeviceModel, TrackModel} from './playback.model';

const PLAYBACK_ACTION_NAME = '[Playback]';

export class ChangeTrack {
  static readonly type = `${PLAYBACK_ACTION_NAME} Change Track`;
  constructor(public track: TrackModel, public duration: number) { }
}

export class ChangeAlbum {
  static readonly type = `${PLAYBACK_ACTION_NAME} Change Album`;
  constructor(public album: AlbumModel) { }
}

export class ChangePlaylist {
  static readonly type = `${PLAYBACK_ACTION_NAME} Change Playlist`;
  constructor(public playlistId: string) { }
}

export class ChangeDevice {
  static readonly type = `${PLAYBACK_ACTION_NAME} Change Device`;
  constructor(public device: DeviceModel, public isPlaying: boolean) { }
}

export class ChangeDeviceVolume {
  static readonly type = `${PLAYBACK_ACTION_NAME} Change Device Volume`;
  constructor(public volume: number) { }
}

export class ChangeDeviceIsActive {
  static readonly type = `${PLAYBACK_ACTION_NAME} Change Device IsActive`;
  constructor(public isActive: boolean) { }
}

export class GetAvailableDevices {
  static readonly type = `${PLAYBACK_ACTION_NAME} Get Available Devices`;
}

export class ChangeProgress {
  static readonly type = `${PLAYBACK_ACTION_NAME} Change Progress`;
  constructor(public progress: number) { }
}

export class TogglePlaying {
  static readonly type = `${PLAYBACK_ACTION_NAME} Toggle Playing`;
}

export class SkipNextTrack {
  static readonly type = `${PLAYBACK_ACTION_NAME} Skip Next Track`;
}

export class SkipPreviousTrack {
  static readonly type = `${PLAYBACK_ACTION_NAME} Skip Previous Track`;
}

export class ToggleShuffle {
  static readonly type = `${PLAYBACK_ACTION_NAME} Toggle Shuffle`;
}

export class ChangeRepeatState {
  static readonly type = `${PLAYBACK_ACTION_NAME} Change Repeat State`;
  constructor(public repeatState: string) { }
}

export class ToggleLiked {
  static readonly type = `${PLAYBACK_ACTION_NAME} Toggle Liked`;
}

export class SetLiked {
  static readonly type = `${PLAYBACK_ACTION_NAME} Set Liked`;
  constructor(public isLiked: boolean) { }
}

export class PollCurrentPlayback {
  static readonly type = `${PLAYBACK_ACTION_NAME} Poll Current Playback`;
  constructor(public interval: number) { }
}
