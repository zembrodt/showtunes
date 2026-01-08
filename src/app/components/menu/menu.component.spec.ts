import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MockComponent } from 'ng-mocks';
import { AlbumDisplayComponent } from '../album-display/album-display.component';
import { SettingsMenuComponent } from '../settings-menu/settings-menu.component';
import { TrackPlayerComponent } from '../track-player/track-player.component';

import { MenuComponent } from './menu.component';

describe('MenuComponent', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        MenuComponent,
        MockComponent(SettingsMenuComponent),
        MockComponent(AlbumDisplayComponent),
        MockComponent(TrackPlayerComponent)
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
