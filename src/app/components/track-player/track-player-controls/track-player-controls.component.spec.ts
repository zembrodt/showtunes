import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ElementRef } from '@angular/core';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, waitForAsync } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatIconHarness } from '@angular/material/icon/testing';
import { MatSlider, MatSliderChange, MatSliderModule } from '@angular/material/slider';
import { By } from '@angular/platform-browser';
import { NgxsModule } from '@ngxs/store';
import { MockComponent, MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { PlayerControlsOptions } from '../../../core/settings/settings.model';
import { MockInteractionThrottleDirective } from '../../../core/testing/mock-interaction-throttle.directive';
import { NgxsSelectorMock } from '../../../core/testing/ngxs-selector-mock';
import { getTestDisallowsModel } from '../../../core/testing/test-models';
import { callComponentChange, callComponentChanges } from '../../../core/testing/test-util';
import { InactivityService } from '../../../services/inactivity/inactivity.service';
import { SpotifyControlsService } from '../../../services/spotify/controls/spotify-controls.service';
import { PREVIOUS_VOLUME, StorageService } from '../../../services/storage/storage.service';
import { DevicesComponent } from '../../devices/devices.component';
import { TrackPlayerControlsComponent } from './track-player-controls.component';

const BUTTON_COUNT = 7;
const SHUFFLE_BUTTON_INDEX = 0;
const PREVIOUS_BUTTON_INDEX = 1;
const PAUSE_BUTTON_INDEX = 2;
const NEXT_BUTTON_INDEX = 3;
const REPEAT_BUTTON_INDEX = 4;
const VOLUME_BUTTON_INDEX = 5;
const LIKE_BUTTON_INDEX = 6;

describe('TrackPlayerControlsComponent', () => {
  const mockSelectors = new NgxsSelectorMock<TrackPlayerControlsComponent>();
  let component: TrackPlayerControlsComponent;
  let fixture: ComponentFixture<TrackPlayerControlsComponent>;
  let loader: HarnessLoader;
  let controls: SpotifyControlsService;
  let storage: StorageService;

  let showPlayerControlsProducer: BehaviorSubject<PlayerControlsOptions>;
  let inactivityProducer: BehaviorSubject<boolean>;

  beforeEach(waitForAsync(() => {
    inactivityProducer = new BehaviorSubject<boolean>(null);
    TestBed.configureTestingModule({
      declarations: [
        TrackPlayerControlsComponent,
        MockInteractionThrottleDirective,
        MockComponent(DevicesComponent)
      ],
      imports: [
        MatButtonModule,
        MatIconModule,
        MatSliderModule,
        NgxsModule.forRoot([], {developmentMode: true})
      ],
      providers: [
        MockProvider(SpotifyControlsService),
        MockProvider(StorageService),
        MockProvider(InactivityService, {
          inactive$: inactivityProducer
        }),
        MockProvider(ElementRef)
      ]
    }).compileComponents();
    controls = TestBed.inject(SpotifyControlsService);
    storage = TestBed.inject(StorageService);

    fixture = TestBed.createComponent(TrackPlayerControlsComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);

    showPlayerControlsProducer = mockSelectors.defineNgxsSelector<PlayerControlsOptions>(component, 'showPlayerControls$');

    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain the player buttons', fakeAsync(() => {
    const buttonsFound = new Set<string>();
    let buttons: MatButtonHarness[];
    loader.getAllHarnesses(MatButtonHarness).then((matButtons) => buttons = matButtons);
    flushMicrotasks();
    expect(buttons.length).toEqual(BUTTON_COUNT);

    buttons.map((button) => {
      let icon: MatIconHarness;
      button.getHarness(MatIconHarness).then((harness) => icon = harness);
      flushMicrotasks();
      expect(icon).toBeTruthy();
      let iconName;
      icon.getName().then((name) => iconName = name);
      flushMicrotasks();
      buttonsFound.add(iconName);
    });

    expect(buttonsFound.size).toEqual(BUTTON_COUNT);
    expect(buttonsFound).toContain('shuffle');
    expect(buttonsFound).toContain('skip_previous');
    expect(buttonsFound).toContain('play_arrow');
    expect(buttonsFound).toContain('skip_next');
    expect(buttonsFound).toContain('repeat');
    expect(buttonsFound).toContain('volume_up');
    expect(buttonsFound).toContain('thumb_up');
  }));

  it('should contain the volume slider', () => {
    const slider = fixture.debugElement.query(By.directive(MatSlider));
    expect(slider).toBeTruthy();
  });

  it('should contain the DevicesComponent', () => {
    const settings = fixture.debugElement.query(By.directive(DevicesComponent));
    expect(settings).toBeTruthy();
  });

  it('should display shuffle button without accent if shuffle is off', () => {
    component.isShuffle = false;
    fixture.detectChanges();
    const buttons = fixture.debugElement.queryAll(By.directive(MatButton));
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const shuffle = buttons[SHUFFLE_BUTTON_INDEX];
    expect(shuffle).toBeTruthy();
    expect(shuffle.classes['track-player-icon']).toBeTruthy();
    expect(shuffle.classes['track-player-icon-accent']).toBeFalsy();
    expect(shuffle.classes['default-cursor']).toBeFalsy();
  });

  it('should display shuffle button with accent if shuffle is on', () => {
    component.isShuffle = true;
    callComponentChange(fixture, 'isShuffle', component.isShuffle);
    const buttons = fixture.debugElement.queryAll(By.directive(MatButton));
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const shuffle = buttons[SHUFFLE_BUTTON_INDEX];
    expect(shuffle).toBeTruthy();
    expect(shuffle.classes['track-player-icon']).toBeFalsy();
    expect(shuffle.classes['track-player-icon-accent']).toBeTruthy();
    expect(shuffle.classes['default-cursor']).toBeFalsy();
  });

  it('should display shuffle button with accent if shuffle is off and isSmartShuffle', () => {
    component.isShuffle = false;
    component.isSmartShuffle = true;
    callComponentChanges(fixture, ['isShuffle', 'isSmartShuffle'], [component.isShuffle, component.isSmartShuffle]);
    const buttons = fixture.debugElement.queryAll(By.directive(MatButton));
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const shuffle = buttons[SHUFFLE_BUTTON_INDEX];
    expect(shuffle).toBeTruthy();
    expect(shuffle.classes['track-player-icon']).toBeFalsy();
    expect(shuffle.classes['track-player-icon-accent']).toBeTruthy();
    expect(shuffle.classes['default-cursor']).toBeTruthy();
  });

  it('should display the shuffle icon when not isSmartShuffle', async () => {
    component.isSmartShuffle = false;
    callComponentChange(fixture, 'isSmartShuffle', component.isSmartShuffle);
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const shuffleButton = buttons[SHUFFLE_BUTTON_INDEX];
    const icon = await shuffleButton.getHarness(MatIconHarness);
    expect(icon).toBeTruthy();
    expect(await icon.getName()).toEqual('shuffle');
  });

  it('should display the smart shuffle icon when isSmartShuffle', async () => {
    component.isSmartShuffle = true;
    callComponentChange(fixture, 'isSmartShuffle', component.isSmartShuffle);
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const shuffleButton = buttons[SHUFFLE_BUTTON_INDEX];
    const icon = await shuffleButton.getHarness(MatIconHarness);
    expect(icon).toBeTruthy();
    expect(await icon.getName()).toEqual('model_training');
  });

  it('should disable the smart shuffle button ripple when isSmartShuffle', async () => {
    component.isSmartShuffle = true;
    callComponentChange(fixture, 'isSmartShuffle', component.isSmartShuffle);
    const buttons = fixture.debugElement.queryAll(By.directive(MatButton));
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const shuffle = buttons[SHUFFLE_BUTTON_INDEX];
    expect(shuffle.attributes['ng-reflect-disable-ripple']).toEqual('true');
  });

  it('should disable the shuffle button when shuffle disallowed', async () => {
    component.disallows = {
      ...getTestDisallowsModel(),
      shuffle: true
    };
    fixture.detectChanges();
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    const shuffleButton = buttons[SHUFFLE_BUTTON_INDEX];
    expect(await shuffleButton.isDisabled()).toBeTrue();
  });

  it('should not disable the shuffle button when shuffle is not disallowed', async () => {
    component.disallows = getTestDisallowsModel();
    fixture.detectChanges();
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    const shuffleButton = buttons[SHUFFLE_BUTTON_INDEX];
    expect(await shuffleButton.isDisabled()).toBeFalse();
  });

  it('should call onToggleShuffle when shuffle button is clicked and not isSmartShuffle', async () => {
    component.isSmartShuffle = false;
    callComponentChange(fixture, 'isSmartShuffle', component.isSmartShuffle);

    spyOn(component, 'onToggleShuffle');
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const shuffleButton = buttons[SHUFFLE_BUTTON_INDEX];
    expect(shuffleButton).toBeTruthy();
    await shuffleButton.click();
    expect(component.onToggleShuffle).toHaveBeenCalled();
  });

  it('should call onSkipPrevious when previous button is clicked', async () => {
    spyOn(component, 'onSkipPrevious');
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const prevButton = buttons[PREVIOUS_BUTTON_INDEX];
    await prevButton.click();
    expect(component.onSkipPrevious).toHaveBeenCalled();
  });

  it('should disable the skip prev button when skip prev and seek disallowed', async () => {
    component.disallows = {
      ...getTestDisallowsModel(),
      skipPrev: true,
      seek: true
    };
    fixture.detectChanges();
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    const prevButton = buttons[PREVIOUS_BUTTON_INDEX];
    expect(await prevButton.isDisabled()).toBeTrue();
  });

  it('should not disable the skip prev button when skip prev disallowed and seek is not disallowed', async () => {
    component.disallows = {
      ...getTestDisallowsModel(),
      skipPrev: true,
      seek: false
    };
    fixture.detectChanges();
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    const prevButton = buttons[PREVIOUS_BUTTON_INDEX];
    expect(await prevButton.isDisabled()).toBeFalse();
  });

  it('should not disable the skip prev button when skip prev is not disallowed and seek disallowed', async () => {
    component.disallows = {
      ...getTestDisallowsModel(),
      skipPrev: false,
      seek: true
    };
    fixture.detectChanges();
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    const prevButton = buttons[PREVIOUS_BUTTON_INDEX];
    expect(await prevButton.isDisabled()).toBeFalse();
  });

  it('should not disable the skip prev button when skip prev and seek are not disallowed', async () => {
    component.disallows = getTestDisallowsModel();
    fixture.detectChanges();
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    const prevButton = buttons[PREVIOUS_BUTTON_INDEX];
    expect(await prevButton.isDisabled()).toBeFalse();
  });

  it('should call onPause when play/pause button is clicked', async () => {
    spyOn(component, 'onPause');
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const pauseButton = buttons[PAUSE_BUTTON_INDEX];
    await pauseButton.click();
    expect(component.onPause).toHaveBeenCalled();
  });

  it('should display play button when not playing', async () => {
    component.isPlaying = false;
    callComponentChange(fixture, 'isPlaying', component.isPlaying);
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const pauseButton = buttons[PAUSE_BUTTON_INDEX];
    const icon = await pauseButton.getHarness(MatIconHarness);
    expect(icon).toBeTruthy();
    expect(await icon.getName()).toEqual('play_arrow');
  });

  it('should display pause button when playing', async () => {
    component.isPlaying = true;
    callComponentChange(fixture, 'isPlaying', component.isPlaying);
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const pauseButton = buttons[PAUSE_BUTTON_INDEX];
    const icon = await pauseButton.getHarness(MatIconHarness);
    expect(icon).toBeTruthy();
    expect(await icon.getName()).toEqual('pause');
  });

  it('should disable the pause button when is playing and pause disallowed', async () => {
    component.isPlaying = true;
    component.disallows = {
      ...getTestDisallowsModel(),
      pause: true
    };
    fixture.detectChanges();
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    const pauseButton = buttons[PAUSE_BUTTON_INDEX];
    expect(await pauseButton.isDisabled()).toBeTrue();
  });

  it('should not disable the pause button when is playing and resume disallowed', async () => {
    component.isPlaying = true;
    component.disallows = {
      ...getTestDisallowsModel(),
      resume: true
    };
    fixture.detectChanges();
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    const pauseButton = buttons[PAUSE_BUTTON_INDEX];
    expect(await pauseButton.isDisabled()).toBeFalse();
  });

  it('should not disable the pause button when is playing and pause is not disallowed', async () => {
    component.isPlaying = true;
    component.disallows = getTestDisallowsModel();
    fixture.detectChanges();
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    const pauseButton = buttons[PAUSE_BUTTON_INDEX];
    expect(await pauseButton.isDisabled()).toBeFalse();
  });

  it('should disable the resume button when is not playing and resume disallowed', async () => {
    component.isPlaying = false;
    component.disallows = {
      ...getTestDisallowsModel(),
      resume: true
    };
    fixture.detectChanges();
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    const resumeButton = buttons[PAUSE_BUTTON_INDEX];
    expect(await resumeButton.isDisabled()).toBeTrue();
  });

  it('should not disable the resume button when is not playing and pause disallowed', async () => {
    component.isPlaying = false;
    component.disallows = {
      ...getTestDisallowsModel(),
      pause: true
    };
    fixture.detectChanges();
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    const resumeButton = buttons[PAUSE_BUTTON_INDEX];
    expect(await resumeButton.isDisabled()).toBeFalse();
  });

  it('should not disable the resume button when is not playing and resume is not disallowed', async () => {
    component.isPlaying = false;
    component.disallows = getTestDisallowsModel();
    fixture.detectChanges();
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    const resumeButton = buttons[PAUSE_BUTTON_INDEX];
    expect(await resumeButton.isDisabled()).toBeFalse();
  });

  it('should call onSkipNext when next button is clicked', async () => {
    spyOn(component, 'onSkipNext');
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const nextButton = buttons[NEXT_BUTTON_INDEX];
    await nextButton.click();
    expect(component.onSkipNext).toHaveBeenCalled();
  });

  it('should disable the skip next button when skip next disallowed', async () => {
    component.disallows = {
      ...getTestDisallowsModel(),
      skipNext: true
    };
    fixture.detectChanges();
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    const nextButton = buttons[NEXT_BUTTON_INDEX];
    expect(await nextButton.isDisabled()).toBeTrue();
  });

  it('should not disable the skip next button when skip next is not disallowed', async () => {
    component.disallows = getTestDisallowsModel();
    fixture.detectChanges();
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    const nextButton = buttons[NEXT_BUTTON_INDEX];
    expect(await nextButton.isDisabled()).toBeFalse();
  });

  it('should display repeat button with accent if repeat is not off', () => {
    component.repeatState = 'track';
    callComponentChange(fixture, 'repeatState', component.repeatState);
    const buttons = fixture.debugElement.queryAll(By.directive(MatButton));
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const repeat = buttons[REPEAT_BUTTON_INDEX];
    expect(repeat).toBeTruthy();
    expect(repeat.classes['track-player-icon']).toBeFalsy();
    expect(repeat.classes['track-player-icon-accent']).toBeTruthy();
  });

  it('should display repeat button without accent if repeat is off', () => {
    component.repeatState = 'off';
    callComponentChange(fixture, 'repeatState', component.repeatState);
    const buttons = fixture.debugElement.queryAll(By.directive(MatButton));
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const repeat = buttons[REPEAT_BUTTON_INDEX];
    expect(repeat).toBeTruthy();
    expect(repeat.classes['track-player-icon']).toBeTruthy();
    expect(repeat.classes['track-player-icon-accent']).toBeFalsy();
  });

  it('should call onRepeatChange when repeat button is clicked', async () => {
    spyOn(component, 'onRepeatChange');
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const repeatButton = buttons[REPEAT_BUTTON_INDEX];
    await repeatButton.click();
    expect(component.onRepeatChange).toHaveBeenCalled();
  });

  it('should display repeat icon when repeat is off', async () => {
    component.repeatState = 'off';
    callComponentChange(fixture, 'repeatState', component.repeatState);
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const repeatButton = buttons[REPEAT_BUTTON_INDEX];
    const icon = await repeatButton.getHarness(MatIconHarness);
    expect(icon).toBeTruthy();
    expect(await icon.getName()).toEqual('repeat');
  });

  it('should display repeat icon when repeat is context', async () => {
    component.repeatState = 'context';
    callComponentChange(fixture, 'repeatState', component.repeatState);
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const repeatButton = buttons[REPEAT_BUTTON_INDEX];
    const icon = await repeatButton.getHarness(MatIconHarness);
    expect(icon).toBeTruthy();
    expect(await icon.getName()).toEqual('repeat');
  });

  it('should display single repeat icon when repeat is track', async () => {
    component.repeatState = 'track';
    callComponentChange(fixture, 'repeatState', component.repeatState);
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const repeatButton = buttons[REPEAT_BUTTON_INDEX];
    const icon = await repeatButton.getHarness(MatIconHarness);
    expect(icon).toBeTruthy();
    expect(await icon.getName()).toEqual('repeat_one');
  });

  it('should disable the repeat button when repeat context disallowed', async () => {
    component.disallows = {
      ...getTestDisallowsModel(),
      repeatContext: true
    };
    fixture.detectChanges();
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    const repeatButton = buttons[REPEAT_BUTTON_INDEX];
    expect(await repeatButton.isDisabled()).toBeTrue();
  });

  it('should not disable the repeat button when repeat context is not disallowed', async () => {
    component.disallows = getTestDisallowsModel();
    fixture.detectChanges();
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    const repeatButton = buttons[REPEAT_BUTTON_INDEX];
    expect(await repeatButton.isDisabled()).toBeFalse();
  });

  it('should call onVolumeMute when volume button is clicked', async () => {
    spyOn(component, 'onVolumeMute');
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const volumeButton = buttons[VOLUME_BUTTON_INDEX];
    await volumeButton.click();
    expect(component.onVolumeMute).toHaveBeenCalled();
  });

  it('should display volume high icon when volume is >= 50', async () => {
    component.volume = 50;
    callComponentChange(fixture, 'volume', component.volume);
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const volumeButton = buttons[VOLUME_BUTTON_INDEX];
    const icon = await volumeButton.getHarness(MatIconHarness);
    expect(icon).toBeTruthy();
    expect(await icon.getName()).toEqual('volume_up');
  });

  it('should display volume low icon when volume is < 50', async () => {
    component.volume = 25;
    callComponentChange(fixture, 'volume', component.volume);
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const volumeButton = buttons[VOLUME_BUTTON_INDEX];
    const icon = await volumeButton.getHarness(MatIconHarness);
    expect(icon).toBeTruthy();
    expect(await icon.getName()).toEqual('volume_down');
  });

  it('should display volume mute icon when volume is = 0', async () => {
    component.volume = 0;
    callComponentChange(fixture, 'volume', component.volume);
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const volumeButton = buttons[VOLUME_BUTTON_INDEX];
    const icon = await volumeButton.getHarness(MatIconHarness);
    expect(icon).toBeTruthy();
    expect(await icon.getName()).toEqual('volume_off');
  });

  it('should display like button with accent when liked', () => {
    component.isLiked = true;
    callComponentChange(fixture, 'isLiked', component.isLiked);
    const buttons = fixture.debugElement.queryAll(By.directive(MatButton));
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const repeat = buttons[LIKE_BUTTON_INDEX];
    expect(repeat).toBeTruthy();
    expect(repeat.classes['track-player-icon']).toBeFalsy();
    expect(repeat.classes['track-player-icon-accent']).toBeTruthy();
  });

  it('should display like button without accent when not liked', () => {
    component.isLiked = false;
    callComponentChange(fixture, 'isLiked', component.isLiked);
    const buttons = fixture.debugElement.queryAll(By.directive(MatButton));
    expect(buttons.length).toEqual(BUTTON_COUNT);
    const repeat = buttons[LIKE_BUTTON_INDEX];
    expect(repeat).toBeTruthy();
    expect(repeat.classes['track-player-icon']).toBeTruthy();
    expect(repeat.classes['track-player-icon-accent']).toBeFalsy();
  });

  it('should not fade controls if show controls option is off', () => {
    spyOn(fixture.debugElement.nativeElement, 'animate');
    component.fadePlayerControls = true;
    showPlayerControlsProducer.next(PlayerControlsOptions.Off);
    fixture.detectChanges();
    expect(component.fadePlayerControls).toBeFalse();
    expect(fixture.debugElement.nativeElement.animate).toHaveBeenCalledWith({
      opacity: 1
    }, jasmine.anything());
  });

  it('should not fade controls if show controls option is on', () => {
    spyOn(fixture.debugElement.nativeElement, 'animate');
    component.fadePlayerControls = true;
    showPlayerControlsProducer.next(PlayerControlsOptions.On);
    fixture.detectChanges();
    expect(component.fadePlayerControls).toBeFalse();
    expect(fixture.debugElement.nativeElement.animate).toHaveBeenCalledWith({
      opacity: 1
    }, jasmine.anything());
  });

  it('should fade controls if show controls option is fade', () => {
    spyOn(fixture.debugElement.nativeElement, 'animate');
    component.fadePlayerControls = false;
    showPlayerControlsProducer.next(PlayerControlsOptions.Fade);
    fixture.detectChanges();
    expect(component.fadePlayerControls).toBeTrue();
    expect(fixture.debugElement.nativeElement.animate).not.toHaveBeenCalled();
  });

  it('should fade controls out if fading controls and is inactive', () => {
    spyOn(fixture.debugElement.nativeElement, 'animate');
    component.fadePlayerControls = true;
    inactivityProducer.next(true);
    fixture.detectChanges();
    expect(fixture.debugElement.nativeElement.animate).toHaveBeenCalledWith({
      opacity: 0
    }, jasmine.anything());
  });

  it('should fade controls in if fading controls and is not inactive', () => {
    spyOn(fixture.debugElement.nativeElement, 'animate');
    component.fadePlayerControls = true;
    inactivityProducer.next(false);
    fixture.detectChanges();
    expect(fixture.debugElement.nativeElement.animate).toHaveBeenCalledWith({
      opacity: 1
    }, jasmine.anything());
  });

  it('should not fade controls if not fading controls and is inactive', () => {
    spyOn(fixture.debugElement.nativeElement, 'animate');
    component.fadePlayerControls = false;
    inactivityProducer.next(true);
    fixture.detectChanges();
    expect(fixture.debugElement.nativeElement.animate).not.toHaveBeenCalled();
  });

  it('should not fade controls if not fading controls and is not inactive', () => {
    spyOn(fixture.debugElement.nativeElement, 'animate');
    component.fadePlayerControls = false;
    inactivityProducer.next(false);
    fixture.detectChanges();
    expect(fixture.debugElement.nativeElement.animate).not.toHaveBeenCalled();
  });

  it('should toggle Spotify playing on pause', () => {
    component.onPause();
    expect(controls.togglePlaying).toHaveBeenCalled();
  });

  it('should call Spotify skip on skip previous', () => {
    component.onSkipPrevious();
    expect(controls.skipPrevious).toHaveBeenCalledWith(false, false);
  });

  it('should call Spotify skip on skip previous with skip prev disallowed', () => {
    component.disallows = {
      ...getTestDisallowsModel(),
      skipPrev: true
    };
    fixture.detectChanges();
    component.onSkipPrevious();
    expect(controls.skipPrevious).toHaveBeenCalledWith(true, false);
  });

  it('should call Spotify skip on skip previous with seek disallowed', () => {
    component.disallows = {
      ...getTestDisallowsModel(),
      seek: true
    };
    fixture.detectChanges();
    component.onSkipPrevious();
    expect(controls.skipPrevious).toHaveBeenCalledWith(false, true);
  });

  it('should call Spotify skip on skip previous with skip prev and seek disallowed', () => {
    component.disallows = {
      ...getTestDisallowsModel(),
      skipPrev: true,
      seek: true
    };
    fixture.detectChanges();
    component.onSkipPrevious();
    expect(controls.skipPrevious).toHaveBeenCalledWith(true, true);
  });

  it('should call Spotify skip on skip next', () => {
    component.onSkipNext();
    expect(controls.skipNext).toHaveBeenCalled();
  });

  it('should change Spotify device volume on volume change', () => {
    const change = new MatSliderChange();
    change.value = 10;
    component.onVolumeChange(change);
    expect(controls.setVolume).toHaveBeenCalledWith(10);
  });

  it('should change Spotify volume to 0 on volume mute when volume > 0', () => {
    component.volume = 1;
    component.onVolumeMute();
    expect(storage.set).toHaveBeenCalledWith(PREVIOUS_VOLUME, '1');
    expect(controls.setVolume).toHaveBeenCalledWith(0);
  });

  it('should change Spotify volume to previous volume on volume mute when volume = 0', () => {
    storage.get = jasmine.createSpy().and.returnValue('10');
    component.volume = 0;
    component.onVolumeMute();
    expect(storage.get).toHaveBeenCalledWith(PREVIOUS_VOLUME);
    expect(controls.setVolume).toHaveBeenCalledWith(10);
  });

  it('should change Spotify volume to default volume on volume mute when volume = 0 and previous NaN', () => {
    storage.get = jasmine.createSpy().and.returnValue('abc');
    component.volume = 0;
    component.onVolumeMute();
    expect(storage.get).toHaveBeenCalledWith(PREVIOUS_VOLUME);
    expect(controls.setVolume).toHaveBeenCalledWith(50);
  });

  it('should change Spotify volume to default volume on volume mute when volume = 0 and previous = 0', () => {
    storage.get = jasmine.createSpy().and.returnValue('0');
    component.volume = 0;
    component.onVolumeMute();
    expect(storage.get).toHaveBeenCalledWith(PREVIOUS_VOLUME);
    expect(controls.setVolume).toHaveBeenCalledWith(50);
  });

  it('should call Spotify shuffle on toggle shuffle', () => {
    component.onToggleShuffle();
    expect(controls.toggleShuffle).toHaveBeenCalled();
  });

  it('should not call toggleShuffle when onToggleShuffle is called', async () => {
    component.isSmartShuffle = true;
    callComponentChange(fixture, 'isSmartShuffle', component.isSmartShuffle);

    component.onToggleShuffle();
    expect(controls.toggleShuffle).not.toHaveBeenCalled();
  });

  it('should change Spotify repeat state to \'context\' on repeat change when state is off', () => {
    component.repeatState = 'off';
    component.onRepeatChange();
    expect(controls.setRepeatState).toHaveBeenCalledWith('context');
  });

  it('should change Spotify repeat state to \'track\' on repeat change when state is context', () => {
    component.repeatState = 'context';
    component.onRepeatChange();
    expect(controls.setRepeatState).toHaveBeenCalledWith('track');
  });

  it('should change Spotify repeat state to \'off\' on repeat change when state is track', () => {
    component.repeatState = 'track';
    component.onRepeatChange();
    expect(controls.setRepeatState).toHaveBeenCalledWith('off');
  });

  it('should change Spotify repeat state to \'off\' on repeat change when state is null', () => {
    component.repeatState = null;
    component.onRepeatChange();
    expect(controls.setRepeatState).toHaveBeenCalledWith('off');
  });

  it('should toggle Spotify liked on like change', () => {
    component.onLikeChange();
    expect(controls.toggleLiked).toHaveBeenCalled();
  });

  it('should set the shuffle class when isShuffle', fakeAsync(() => {
    component.isShuffle = true;
    callComponentChange(fixture, 'isShuffle', component.isShuffle);
    expect(component.shuffleClasses).toEqual(['track-player-icon-accent', '']);
  }));

  it('should set the shuffle class when not isShuffle', () => {
    component.isShuffle = false;
    callComponentChange(fixture, 'isShuffle', component.isShuffle);
    expect(component.shuffleClasses).toEqual(['track-player-icon', '']);
  });

  it('should set the shuffle classes when isShuffle and isSmartShuffle', () => {
    component.isShuffle = true;
    component.isSmartShuffle = true;
    callComponentChanges(fixture, ['isShuffle', 'isSmartShuffle'], [component.isShuffle, component.isSmartShuffle]);

    expect(component.shuffleClasses).toEqual(['track-player-icon-accent', 'default-cursor']);
  });

  it('should set the shuffle classes when not isShuffle and isSmartShuffle', () => {
    component.isShuffle = false;
    component.isSmartShuffle = true;
    callComponentChanges(fixture, ['isShuffle', 'isSmartShuffle'], [component.isShuffle, component.isSmartShuffle]);

    expect(component.shuffleClasses).toEqual(['track-player-icon-accent', 'default-cursor']);
  });

  it('should set the shuffle icon when isShuffle and not isSmartShuffle', () => {
    component.isShuffle = true;
    component.isSmartShuffle = false;
    callComponentChanges(fixture, ['isShuffle', 'isSmartShuffle'], [component.isShuffle, component.isSmartShuffle]);
    expect(component.shuffleIcon).toEqual('shuffle');
  });

  it('should set the shuffle icon when isShuffle and isSmartShuffle', () => {
    component.isShuffle = true;
    component.isSmartShuffle = true;
    callComponentChanges(fixture, ['isShuffle', 'isSmartShuffle'], [component.isShuffle, component.isSmartShuffle]);
    expect(component.shuffleIcon).toEqual('model_training');
  });

  it('should set the pause icon name when playing', () => {
    component.isPlaying = true;
    callComponentChange(fixture, 'isPlaying', component.isPlaying);
    expect(component.playIcon).toEqual('pause');
  });

  it('should set the play icon name when not playing', () => {
    component.isPlaying = false;
    callComponentChange(fixture, 'isPlaying', component.isPlaying);
    expect(component.playIcon).toEqual('play_arrow');
  });

  it('should set the correct repeat icon and class when repeat state is off', () => {
    component.repeatState = 'off';
    callComponentChange(fixture, 'repeatState', component.repeatState);
    expect(component.repeatIcon).toEqual('repeat');
    expect(component.repeatClass).toEqual('track-player-icon');
  });

  it('should set the correct repeat icon and class when repeat state is on', () => {
    component.repeatState = 'context';
    callComponentChange(fixture, 'repeatState', component.repeatState);
    expect(component.repeatIcon).toEqual('repeat');
    expect(component.repeatClass).toEqual('track-player-icon-accent');
  });

  it('should set the correct repeat icon and class when repeat state is track', () => {
    component.repeatState = 'track';
    callComponentChange(fixture, 'repeatState', component.repeatState);
    expect(component.repeatIcon).toEqual('repeat_one');
    expect(component.repeatClass).toEqual('track-player-icon-accent');
  });

  it('should set the volume high icon name when volume >= 50', () => {
    component.volume = 50;
    callComponentChange(fixture, 'volume', component.volume);
    expect(component.volumeIcon).toEqual('volume_up');

    component.volume = 100;
    callComponentChange(fixture, 'volume', component.volume);
    expect(component.volumeIcon).toEqual('volume_up');
  });

  it('should set the volume low icon name when volume < 50', () => {
    component.volume = 49;
    callComponentChange(fixture, 'volume', component.volume);
    expect(component.volumeIcon).toEqual('volume_down');

    component.volume = 1;
    callComponentChange(fixture, 'volume', component.volume);
    expect(component.volumeIcon).toEqual('volume_down');
  });

  it('should set the volume mute icon name when volume = 0', () => {
    component.volume = 0;
    callComponentChange(fixture, 'volume', component.volume);
    expect(component.volumeIcon).toEqual('volume_off');
  });

  it('should set the liked class when isLiked', () => {
    component.isLiked = true;
    callComponentChange(fixture, 'isLiked', component.isLiked);
    expect(component.likedClass).toEqual('track-player-icon-accent');
  });

  it('should set the liked class when not isLiked', () => {
    component.isLiked = false;
    callComponentChange(fixture, 'isLiked', component.isLiked);
    expect(component.likedClass).toEqual('track-player-icon');
  });
});
