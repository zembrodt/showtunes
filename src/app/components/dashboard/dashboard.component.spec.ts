import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { MockComponent, MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { Dashboard, DashboardType } from '../../core/dashboard/dashboard.model';
import { NgxsSelectorMock } from '../../core/testing/ngxs-selector-mock';
import { AlbumDisplayComponent } from '../album-display/album-display.component';
import { SettingsMenuComponent } from '../settings-menu/settings-menu.component';
import { TrackPlayerComponent } from '../track-player/track-player.component';

import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  const mockSelectors = new NgxsSelectorMock<DashboardComponent>();
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let store: Store;

  let dashboardProducer: BehaviorSubject<DashboardType>;

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
        MockProvider(Router),
        MockProvider(Store)
      ]
    }).compileComponents();
    store = TestBed.inject(Store);

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;

    dashboardProducer = mockSelectors.defineNgxsSelector<DashboardType>(component, 'dashboard$');

    dashboardProducer.next(Dashboard.Spotify);

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
