import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { MockComponent, MockProvider } from 'ng-mocks';
import { AlbumDisplayComponent } from '../album-display/album-display.component';
import { SettingsMenuComponent } from '../settings-menu/settings-menu.component';
import { TrackPlayerComponent } from '../track-player/track-player.component';

import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        DashboardComponent,
        MockComponent(SettingsMenuComponent),
        MockComponent(AlbumDisplayComponent),
        MockComponent(TrackPlayerComponent)
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({
                type: 'spotify'
              })
            }
          }
        },
        MockProvider(Router)
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain the SettingsMenuComponent', () => {
    const settings = fixture.debugElement.query(By.directive(SettingsMenuComponent));
    expect(settings).toBeTruthy();
  });

  it('should contain the AlbumDisplayComponent', () => {
    const settings = fixture.debugElement.query(By.directive(AlbumDisplayComponent));
    expect(settings).toBeTruthy();
  });

  it('should contain the TrackPlayerComponent', () => {
    const settings = fixture.debugElement.query(By.directive(TrackPlayerComponent));
    expect(settings).toBeTruthy();
  });
});
