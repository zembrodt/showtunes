import {Component, OnDestroy, OnInit} from '@angular/core';
import {SpotifyService} from '../../services/spotify/spotify.service';
import {DeviceResponse} from '../../models/device.model';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.css']
})
export class DevicesComponent implements OnInit, OnDestroy {

  private devicesSubscription: Subscription;

  devices: DeviceResponse[] = [];

  constructor(private spotify: SpotifyService) { }

  ngOnInit(): void {
    this.devicesSubscription = this.spotify
      .getDevices().subscribe(res => {
        if (res.devices !== null) {
          this.devices = res.devices;
        }
      });
  }

  ngOnDestroy(): void {
    this.devicesSubscription.unsubscribe();
  }

  getDeviceIcon(deviceType: string): string {
    let icon = 'device_unknown';
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
    return icon;
  }
}
