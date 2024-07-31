import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { debounceTime, takeUntil, throttleTime } from 'rxjs/operators';
import { AppConfig } from '../../app.config';
import { DeviceModel, DisallowsModel, getDefaultDisallows } from '../../core/playback/playback.model';
import { PlaybackState } from '../../core/playback/playback.state';
import { SpotifyControlsService } from '../../services/spotify/controls/spotify-controls.service';

const FETCH_DEVICES_DELAY = 1000; // ms

@Component({
  selector: 'app-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.css']
})
export class DevicesComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Input() disallows: DisallowsModel = getDefaultDisallows();

  @Select(PlaybackState.device) currentDevice$: Observable<DeviceModel>;
  @Select(PlaybackState.availableDevices) availableDevices$: Observable<DeviceModel[]>;

  private fetchDevicesSubject = new BehaviorSubject<void>(null);

  constructor(private controls: SpotifyControlsService) { }

  ngOnInit(): void {
    const throttleDelay = AppConfig.isEnvInitialized() ? AppConfig.settings.env.throttleDelay : FETCH_DEVICES_DELAY;
    this.fetchDevicesSubject.pipe(
      takeUntil(this.ngUnsubscribe),
      throttleTime(throttleDelay)
    ).subscribe(() => this.controls.fetchAvailableDevices());
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  onMenuOpened(): void {
    this.fetchDevicesSubject.next();
  }

  onSelectDevice(device: DeviceModel): void {
    this.controls.setDevice(device, true);
  }
}
