import {AlbumModel, DeviceModel, TrackModel} from './playback.model';

export class ChangeTrack {
  static readonly type = '[Playback] Change Track';
  constructor(public track: TrackModel, public duration: number) { }
}

export class ChangeAlbum {
  static readonly type = '[Playback] Change Album';
  constructor(public album: AlbumModel) { }
}

export class ChangeDevice {
  static readonly type = '[Playback] Change Device';
  constructor(public device: DeviceModel) { }
}

export class ChangeDeviceVolume {
  static readonly type = '[Playback] Change Device Volume';
  constructor(public volume: number) { }
}

export class ChangeDeviceIsActive {
  static readonly type = '[Playback] Change Device IsActive';
  constructor(public isActive: boolean) { }
}

export class ChangeProgress {
  static readonly type = '[Playback] Change Progress';
  constructor(public progress: number) { }
}

export class TogglePlaying {
  static readonly type = '[Playback] Toggle Playing';
}

export class SkipNextTrack {
  static readonly type = '[Playback] Skip Next Track';
}

export class SkipPreviousTrack {
  static readonly type = '[Playback] Skip Previous Track';
}

export class ToggleShuffle {
  static readonly type = '[Playback] Toggle Shuffle';
}

export class ChangeRepeatState {
  static readonly type = '[Playback] Change Repeat State';
  constructor(public repeatState: string) { }
}

export class ToggleLiked {
  static readonly type = '[Playback] Toggle Liked';
}

export class PollCurrentPlayback {
  static readonly type = '[Playback] Poll Current Playback';
  constructor(public interval: number) { }
}
