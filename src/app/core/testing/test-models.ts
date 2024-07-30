import { DisallowsModel } from '../playback/playback.model';

export function getTestDisallowsModel(): DisallowsModel {
  return {
    pause: false,
    resume: false,
    skipPrev: false,
    skipNext: false,
    shuffle: false,
    repeatContext: false,
    repeatTrack: false,
    seek: false,
    transferPlayback: false,
    interruptPlayback: false
  };
}
