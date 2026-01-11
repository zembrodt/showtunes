import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule, MatCardTitle } from '@angular/material/card';
import { By } from '@angular/platform-browser';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MockComponent } from 'ng-mocks';
import { AlbumDisplayComponent } from '../album-display/album-display.component';
import { SettingsMenuComponent } from '../settings-menu/settings-menu.component';
import { TrackPlayerComponent } from '../track-player/track-player.component';

import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        LandingComponent,
        MockComponent(SettingsMenuComponent)
      ],
      imports: [
        FontAwesomeModule,
        MatCardModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain the Spotify landing page link', () => {
    const landingEls = fixture.debugElement.queryAll(By.directive(MatCardTitle));
    expect(landingEls.length).toEqual(1);

    const spotifyLandingEl = landingEls[0];
    const spotifyIcon = spotifyLandingEl.query(By.css('fa-icon'));
    expect(spotifyIcon).toBeTruthy();
    expect(spotifyLandingEl.nativeElement.textContent.trim()).toEqual('Spotify');
  });
});
