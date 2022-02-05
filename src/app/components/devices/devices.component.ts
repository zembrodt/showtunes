import { Component } from '@angular/core';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { DeviceModel } from '../../core/playback/playback.model';
import { PlaybackState } from '../../core/playback/playback.state';
import { SpotifyService } from '../../services/spotify/spotify.service';

@Component({
  selector: 'app-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.css']
})
export class DevicesComponent {

  @Select(PlaybackState.device) currentDevice$: Observable<DeviceModel>;
  @Select(PlaybackState.availableDevices) availableDevices$: Observable<DeviceModel[]>;

  constructor(private spotify: SpotifyService) { }

  onMenuOpened(): void {
    this.spotify.fetchAvailableDevices();
  }

  onSelectDevice(device: DeviceModel): void {
    this.spotify.setDevice(device, true);
  }

  getDeviceIcon(deviceType: string): string {
    let icon = 'device_unknown';
    if (deviceType) {
      switch (deviceType.toLowerCase()) {
        case 'computer':
          icon = 'laptop_windows';
          break;
        case 'tv':
          icon = 'tv';
          break;
        case 'smartphone':
          icon = 'smartphone';
          break;
        case 'speaker':
          icon = 'speaker';
          break;
        case 'castaudio':
          icon = 'cast';
          break;
        default:
          console.log(`Unsupported device type: '${deviceType}'`);
      }
    }
    return icon;
  }
}
