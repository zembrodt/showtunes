import {Component, HostBinding, OnDestroy, OnInit} from '@angular/core';
import { SettingsService } from '../../services/settings/settings.service';
import {Observable, Subscription} from 'rxjs';
import {OverlayContainer} from '@angular/cdk/overlay';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Spotify Display';

  private darkModeSubscription: Subscription;

  isDarkMode = false;

  theme$: Observable<string>;

  constructor(private settingsService: SettingsService, private overlayContainer: OverlayContainer) { }

  ngOnInit(): void {
    this.darkModeSubscription = this.settingsService
      .getDarkMode().subscribe(value => {
        this.isDarkMode = value;
        this.updateOverlayContainer(this.isDarkMode ? 'dark-theme' : 'light-theme');
      });
  }

  ngOnDestroy(): void {
    this.darkModeSubscription.unsubscribe();
  }

  private updateOverlayContainer(theme: string): void {
    const classList = this.overlayContainer.getContainerElement().classList;
    const toRemove = Array.from(classList).filter((item: string) =>
      item.includes('-theme')
    );
    if (toRemove.length > 0) {
      classList.remove(...toRemove);
    }
    classList.add(theme);
  }
}
