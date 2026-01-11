import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MockComponent } from 'ng-mocks';
import { AlbumDisplayComponent } from '../album-display/album-display.component';
import { SettingsMenuComponent } from '../settings-menu/settings-menu.component';
import { TrackPlayerComponent } from '../track-player/track-player.component';

import { LandingComponent } from './landing.component';

describe('MenuComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        LandingComponent,
        MockComponent(SettingsMenuComponent),
        MockComponent(AlbumDisplayComponent),
        MockComponent(TrackPlayerComponent)
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
