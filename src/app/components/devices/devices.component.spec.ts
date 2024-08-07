import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuItem, MatMenuModule } from '@angular/material/menu';
import { MatMenuHarness, MatMenuItemHarness } from '@angular/material/menu/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxsModule } from '@ngxs/store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { AppConfig } from '../../app.config';
import { DeviceModel } from '../../core/playback/playback.model';
import { MockInteractionThrottleDirective } from '../../core/testing/mock-interaction-throttle.directive';
import { NgxsSelectorMock } from '../../core/testing/ngxs-selector-mock';
import { getTestDeviceModel, getTestDisallowsModel } from '../../core/testing/test-models';
import { getTestAppConfig } from '../../core/testing/test-responses';
import { SpotifyControlsService } from '../../services/spotify/controls/spotify-controls.service';

import { DevicesComponent } from './devices.component';

describe('DevicesComponent', () => {
  const mockSelectors = new NgxsSelectorMock<DevicesComponent>();
  let component: DevicesComponent;
  let fixture: ComponentFixture<DevicesComponent>;
  let loader: HarnessLoader;
  let rootLoader: HarnessLoader;
  let controls: SpotifyControlsService;

  let currentDeviceProducer: BehaviorSubject<DeviceModel>;
  let availableDevicesProducer: BehaviorSubject<DeviceModel[]>;

  beforeEach(waitForAsync(() => {
    AppConfig.settings = getTestAppConfig();
    AppConfig.settings.env.throttleDelay = 2;
    TestBed.configureTestingModule({
      declarations: [
        DevicesComponent,
        MockInteractionThrottleDirective
      ],
      imports: [
        BrowserAnimationsModule,
        MatIconModule,
        MatMenuModule,
        NgxsModule.forRoot([], { developmentMode: true })
      ],
      providers: [ MockProvider(SpotifyControlsService) ]
    }).compileComponents();
    controls = TestBed.inject(SpotifyControlsService);

    fixture = TestBed.createComponent(DevicesComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);

    currentDeviceProducer = mockSelectors.defineNgxsSelector<DeviceModel>(component, 'currentDevice$');
    availableDevicesProducer = mockSelectors.defineNgxsSelector<DeviceModel[]>(component, 'availableDevices$');

    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display devices menu on button click', async () => {
    availableDevicesProducer.next([getTestDeviceModel(1), getTestDeviceModel(2)]);
    fixture.debugElement.nativeElement.querySelector('button').click();
    const devicesMenu = await loader.getHarness(MatMenuHarness);
    const devices = fixture.debugElement.queryAll(By.directive(MatMenuItem));
    expect(await devicesMenu.isOpen()).toBeTruthy();
    expect(devices.length).toEqual(2);
  });

  it('should disable the devices menu button when transfer playback disallowed', async () => {
    component.disallows = {
      ...getTestDisallowsModel(),
      transferPlayback: true
    };
    fixture.detectChanges();
    const deviceButton = await loader.getHarness(MatButtonHarness);
    expect(await deviceButton.isDisabled()).toBeTrue();
  });

  it('should not disable the devices menu button when transfer playback not disallowed', async () => {
    component.disallows = getTestDisallowsModel();
    fixture.detectChanges();
    const deviceButton = await loader.getHarness(MatButtonHarness);
    expect(await deviceButton.isDisabled()).toBeFalse();
  });

  it('should highlight the current device', () => {
    availableDevicesProducer.next([getTestDeviceModel(1), getTestDeviceModel(2)]);
    currentDeviceProducer.next(getTestDeviceModel(1));
    fixture.debugElement.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    const devices = fixture.debugElement.queryAll(By.directive(MatMenuItem));
    expect(devices[0].classes.active).toBeTruthy();
    expect(devices[1].classes.active).toBeFalsy();

    // Check if active device is updated on currentDevice$ change
    currentDeviceProducer.next(getTestDeviceModel(2));
    fixture.detectChanges();
    expect(devices[0].classes.active).toBeFalsy();
    expect(devices[1].classes.active).toBeTruthy();
  });

  it('should disable device buttons when transfer playback disallowed', async () => {
    availableDevicesProducer.next([getTestDeviceModel(1), getTestDeviceModel(2)]);
    component.disallows = {
      ...getTestDisallowsModel(),
      transferPlayback: true
    };
    fixture.debugElement.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    const devices = await rootLoader.getAllHarnesses(MatMenuItemHarness);
    expect(await devices[0].isDisabled()).toBeTrue();
    expect(await devices[1].isDisabled()).toBeTrue();
  });

  it('should not disable device buttons when transfer playback is not disallowed', async () => {
    availableDevicesProducer.next([getTestDeviceModel(1), getTestDeviceModel(2)]);
    component.disallows = getTestDisallowsModel();
    fixture.debugElement.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    const devices = await rootLoader.getAllHarnesses(MatMenuItemHarness);
    expect(await devices[0].isDisabled()).toBeFalse();
    expect(await devices[1].isDisabled()).toBeFalse();
  });

  it('should display empty menu when no available devices', async () => {
    fixture.debugElement.nativeElement.querySelector('button').click();
    const devices = await rootLoader.getAllHarnesses(MatMenuItemHarness);
    expect(devices.length).toEqual(0);
  });

  it('should update device list when availableDevices$ updated', async () => {
    availableDevicesProducer.next([getTestDeviceModel(1), getTestDeviceModel(2)]);
    fixture.debugElement.nativeElement.querySelector('button').click();
    let devices = await rootLoader.getAllHarnesses(MatMenuItemHarness);
    expect(devices.length).toEqual(2);

    availableDevicesProducer.next([getTestDeviceModel(1)]);
    devices = await rootLoader.getAllHarnesses(MatMenuItemHarness);
    expect(devices.length).toEqual(1);
  });

  it('should retrieve available devices on menu open', () => {
    fixture.debugElement.nativeElement.querySelector('button').click();
    expect(controls.fetchAvailableDevices).toHaveBeenCalled();
  });

  it('should throttle fetchAvailableDevices call', fakeAsync(() => {
    // Check for initial call
    expect(controls.fetchAvailableDevices).toHaveBeenCalledTimes(1);
    component.onMenuOpened(); // allowed
    tick(1);
    component.onMenuOpened(); // throttled
    // Check we've only called the initial call and non-throttled call
    expect(controls.fetchAvailableDevices).toHaveBeenCalledTimes(2);
    discardPeriodicTasks();
  }));

  it('should update device on select', () => {
    availableDevicesProducer.next([getTestDeviceModel(1), getTestDeviceModel(2)]);
    fixture.debugElement.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    const device = fixture.debugElement.query(By.directive(MatMenuItem));
    device.triggerEventHandler('click', new MouseEvent('button'));
    expect(controls.setDevice).toHaveBeenCalledWith(getTestDeviceModel(1), true);
  });
});
