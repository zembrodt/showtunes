import { Component } from '@angular/core';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { DeviceModel } from '../../core/playback/playback.model';
import { PlaybackState } from '../../core/playback/playback.state';
import { SpotifyControlsService } from '../../services/spotify/controls/spotify-controls.service';

@Component({
  selector: 'app-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.css']
})
export class DevicesComponent {

  @Select(PlaybackState.device) currentDevice$: Observable<DeviceModel>;
  @Select(PlaybackState.availableDevices) availableDevices$: Observable<DeviceModel[]>;

  constructor(private controls: SpotifyControlsService) { }

  onMenuOpened(): void {
    this.controls.fetchAvailableDevices();
  }

  onSelectDevice(device: DeviceModel): void {
    this.controls.setDevice(device, true);
  }
}
