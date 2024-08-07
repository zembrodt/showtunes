import { ActionsResponse } from './actions.model';
import { DeviceResponse } from './device.model';
import { TrackResponse } from './track.model';
import { ContextResponse } from './context.model';

export interface CurrentPlaybackResponse {
  item: TrackResponse;
  progress_ms: number;
  is_playing: boolean;
  shuffle_state: boolean;
  smart_shuffle: boolean;
  repeat_state: string;
  context: ContextResponse;
  device: DeviceResponse;
  currently_playing_type: string;
  timestamp: number;
  actions: {
    disallows: ActionsResponse;
  };
}
