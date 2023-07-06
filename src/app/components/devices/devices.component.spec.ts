import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuItem, MatMenuModule } from '@angular/material/menu';
import { MatMenuHarness, MatMenuItemHarness } from '@angular/material/menu/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxsModule } from '@ngxs/store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { DeviceModel } from '../../core/playback/playback.model';
import { NgxsSelectorMock } from '../../core/testing/ngxs-selector-mock';
import { SpotifyService } from '../../services/spotify/spotify.service';

import { DevicesComponent } from './devices.component';

const TEST_DEVICE_1: DeviceModel = {
  id: '1',
  name: 'test1',
  type: 'computer',
  volume: 50,
  isActive: true,
  isPrivateSession: false,
  isRestricted: false,
  icon: 'laptop_windows'
};

const TEST_DEVICE_2: DeviceModel = {
  id: '2',
  name: 'test2',
  type: 'smartphone',
  volume: 100,
  isActive: false,
  isPrivateSession: false,
  isRestricted: false,
  icon: 'smartphone'
};

describe('DevicesComponent', () => {
  const mockSelectors = new NgxsSelectorMock<DevicesComponent>();
  let component: DevicesComponent;
  let fixture: ComponentFixture<DevicesComponent>;
  let loader: HarnessLoader;
  let rootLoader: HarnessLoader;
  let spotify: SpotifyService;

  let currentDeviceProducer: BehaviorSubject<DeviceModel>;
  let availableDevicesProducer: BehaviorSubject<DeviceModel[]>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DevicesComponent ],
      imports: [
        BrowserAnimationsModule,
        MatIconModule,
        MatMenuModule,
        NgxsModule.forRoot([], { developmentMode: true })
      ],
      providers: [ MockProvider(SpotifyService) ]
    }).compileComponents();
    spotify = TestBed.inject(SpotifyService);

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
    availableDevicesProducer.next([TEST_DEVICE_1, TEST_DEVICE_2]);
    fixture.debugElement.nativeElement.querySelector('button').click();
    const devicesMenu = await loader.getHarness(MatMenuHarness);
    const devices = fixture.debugElement.queryAll(By.directive(MatMenuItem));
    expect(await devicesMenu.isOpen()).toBeTruthy();
    expect(devices.length).toEqual(2);
  });

  it('should highlight the current device', () => {
    availableDevicesProducer.next([TEST_DEVICE_1, TEST_DEVICE_2]);
    currentDeviceProducer.next(TEST_DEVICE_1);
    fixture.debugElement.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    const devices = fixture.debugElement.queryAll(By.directive(MatMenuItem));
    expect(devices[0].classes.active).toBeTruthy();
    expect(devices[1].classes.active).toBeFalsy();

    // Check if active device is updated on currentDevice$ change
    currentDeviceProducer.next(TEST_DEVICE_2);
    fixture.detectChanges();
    expect(devices[0].classes.active).toBeFalsy();
    expect(devices[1].classes.active).toBeTruthy();
  });

  it('should display empty menu when no available devices', async () => {
    fixture.debugElement.nativeElement.querySelector('button').click();
    const devices = await rootLoader.getAllHarnesses(MatMenuItemHarness);
    expect(devices.length).toEqual(0);
  });

  it('should update device list when availableDevices$ updated', async () => {
    availableDevicesProducer.next([TEST_DEVICE_1, TEST_DEVICE_2]);
    fixture.debugElement.nativeElement.querySelector('button').click();
    let devices = await rootLoader.getAllHarnesses(MatMenuItemHarness);
    expect(devices.length).toEqual(2);

    availableDevicesProducer.next([TEST_DEVICE_1]);
    devices = await rootLoader.getAllHarnesses(MatMenuItemHarness);
    expect(devices.length).toEqual(1);
  });

  it('should retrieve available devices on menu open', () => {
    fixture.debugElement.nativeElement.querySelector('button').click();
    expect(spotify.fetchAvailableDevices).toHaveBeenCalled();
  });

  it('should update device on select', () => {
    availableDevicesProducer.next([TEST_DEVICE_1, TEST_DEVICE_2]);
    fixture.debugElement.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    const device = fixture.debugElement.query(By.directive(MatMenuItem));
    device.triggerEventHandler('click', new MouseEvent('button'));
    expect(spotify.setDevice).toHaveBeenCalledWith(TEST_DEVICE_1, true);
  });
});
