import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { MatSlider, MatSliderChange, MatSliderModule } from '@angular/material/slider';
import { MatSliderHarness } from '@angular/material/slider/testing';
import { By } from '@angular/platform-browser';
import { NgxsModule } from '@ngxs/store';
import { MockProvider } from 'ng-mocks';
import { DisallowsModel } from '../../../core/playback/playback.model';
import { MockInteractionThrottleDirective } from '../../../core/testing/mock-interaction-throttle.directive';
import { getTestDisallowsModel } from '../../../core/testing/test-models';
import { callComponentChange } from '../../../core/testing/test-util';
import { SpotifyControlsService } from '../../../services/spotify/controls/spotify-controls.service';
import { TrackPlayerProgressComponent } from './track-player-progress.component';

describe('TrackPlayerProgressComponent', () => {
  let component: TrackPlayerProgressComponent;
  let fixture: ComponentFixture<TrackPlayerProgressComponent>;
  let loader: HarnessLoader;
  let controls: SpotifyControlsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        TrackPlayerProgressComponent,
        MockInteractionThrottleDirective
      ],
      imports: [
        MatSliderModule,
        NgxsModule.forRoot([], { developmentMode: true })
      ],
      providers: [ MockProvider(SpotifyControlsService) ]
    }).compileComponents();
    controls = TestBed.inject(SpotifyControlsService);

    fixture = TestBed.createComponent(TrackPlayerProgressComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain the progress slider', () => {
    const slider = fixture.debugElement.query(By.directive(MatSlider));
    expect(slider).toBeTruthy();
  });

  it('should have the correct slider values', async () => {
    component.progress = 5;
    component.duration = 10;
    fixture.detectChanges();
    const slider = await loader.getHarness(MatSliderHarness);
    const start = await slider.getMinValue();
    const progress = await slider.getValue();
    const duration = await slider.getMaxValue();
    expect(start).toEqual(0);
    expect(progress).toEqual(5);
    expect(duration).toEqual(10);
  });

  it('should display progress time', () => {
    component.progress = 1000;
    callComponentChange(fixture, 'progress', component.progress);
    const progress = fixture.debugElement.query(By.css('.progress-time'));
    expect(progress.nativeElement.textContent.trim()).toEqual('0:01');
  });

  it('should display duration time', () => {
    component.duration = 1000;
    callComponentChange(fixture, 'duration', component.duration);
    const duration = fixture.debugElement.query(By.css('.duration-time'));
    expect(duration.nativeElement.textContent.trim()).toEqual('0:01');
  });

  it('should call onProgressChange when slider moved', async () => {
    spyOn(component, 'onProgressChange');
    component.progress = 5;
    component.duration = 10;
    fixture.detectChanges();
    const slider = await loader.getHarness(MatSliderHarness);
    await slider.setValue(6);
    expect(slider).toBeTruthy();
    expect(component.onProgressChange).toHaveBeenCalled();
  });

  it('should call Spotify setTrackPosition', () => {
    const change = new MatSliderChange();
    change.value = 10;
    component.onProgressChange(change);
    expect(controls.setTrackPosition).toHaveBeenCalledWith(10);
  });

  it('should not disable the progress bar when seeking allowed', async () => {
    component.disallows = {
      ...getTestDisallowsModel()
    };
    fixture.detectChanges();
    const slider = await loader.getHarness(MatSliderHarness);
    expect(await slider.isDisabled()).toBeFalse();
  });

  it('should disable the progress bar when seeking disallowed', async () => {
    component.disallows = {
      ...getTestDisallowsModel(),
      seek: true
    };
    fixture.detectChanges();
    const slider = await loader.getHarness(MatSliderHarness);
    expect(await slider.isDisabled()).toBeTrue();
  });

  it('should display single seconds digit progress correctly', () => {
    component.progress = 1000;
    component.duration = 1000;
    callComponentChange(fixture, 'progress', component.progress);
    callComponentChange(fixture, 'duration', component.duration);
    expect(component.progressFormatted).toEqual('0:01');
    expect(component.durationFormatted).toEqual('0:01');
  });

  it('should display double seconds digit progress correctly', () => {
    component.progress = 10000;
    component.duration = 10000;
    callComponentChange(fixture, 'progress', component.progress);
    callComponentChange(fixture, 'duration', component.duration);
    expect(component.progressFormatted).toEqual('0:10');
    expect(component.durationFormatted).toEqual('0:10');
  });

  it('should display single minutes digit progress correctly', () => {
    component.progress = 60000;
    component.duration = 60000;
    callComponentChange(fixture, 'progress', component.progress);
    callComponentChange(fixture, 'duration', component.duration);
    expect(component.progressFormatted).toEqual('1:00');
    expect(component.durationFormatted).toEqual('1:00');
  });

  it('should display double minutes digit progress correctly', () => {
    component.progress = 600000;
    component.duration = 600000;
    callComponentChange(fixture, 'progress', component.progress);
    callComponentChange(fixture, 'duration', component.duration);
    expect(component.progressFormatted).toEqual('10:00');
    expect(component.durationFormatted).toEqual('10:00');
  });

  it('should display hours digit with single minutes digit progress correctly', () => {
    component.progress = 3661000;
    component.duration = 3661000;
    callComponentChange(fixture, 'progress', component.progress);
    callComponentChange(fixture, 'duration', component.duration);
    expect(component.progressFormatted).toEqual('1:01:01');
    expect(component.durationFormatted).toEqual('1:01:01');
  });

  it('should display hours digit with double minutes digit progress correctly', () => {
    component.progress = 4201000;
    component.duration = 4201000;
    callComponentChange(fixture, 'progress', component.progress);
    callComponentChange(fixture, 'duration', component.duration);
    expect(component.progressFormatted).toEqual('1:10:01');
    expect(component.durationFormatted).toEqual('1:10:01');
  });

  it('should display less than 1000 milliseconds as 0', () => {
    component.progress = 999;
    component.duration = 999;
    callComponentChange(fixture, 'progress', component.progress);
    callComponentChange(fixture, 'duration', component.duration);
    expect(component.progressFormatted).toEqual('0:00');
    expect(component.durationFormatted).toEqual('0:00');
  });

  it('should display 0 milliseconds as 0', () => {
    component.progress = 0;
    component.duration = 0;
    callComponentChange(fixture, 'progress', component.progress);
    callComponentChange(fixture, 'duration', component.duration);
    expect(component.progressFormatted).toEqual('0:00');
    expect(component.durationFormatted).toEqual('0:00');
  });

  it('should display less than 0 milliseconds as 0', () => {
    component.progress = -1000;
    component.duration = -1000;
    callComponentChange(fixture, 'progress', component.progress);
    callComponentChange(fixture, 'duration', component.duration);
    expect(component.progressFormatted).toEqual('0:00');
    expect(component.durationFormatted).toEqual('0:00');
  });
});
