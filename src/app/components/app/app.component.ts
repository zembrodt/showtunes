import {Component, ElementRef, OnDestroy, OnInit, Renderer2} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {Select} from '@ngxs/store';
import {SettingsState} from '../../core/settings/settings.state';
import {PlaybackService} from '../../services/playback/playback.service';
import {InactivityService} from '../../services/inactivity/inactivity.service';
import {PlayerControlsOptions} from '../../core/settings/settings.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'ShowTunes';
  private ngUnsubscribe = new Subject();

  @Select(SettingsState.theme) theme$: Observable<string>;
  @Select(SettingsState.showPlayerControls) showPlayerControls$: Observable<PlayerControlsOptions>;

  fadePlayerControls = false;

  constructor(
    private inactivity: InactivityService,
    private playbackService: PlaybackService,
    private renderer: Renderer2,
    private element: ElementRef) {}

  ngOnInit(): void {
    this.playbackService.initialize();

    this.inactivity.inactive$.subscribe((isInactive) => {
      if (this.fadePlayerControls) {
        this.fadeCursor(isInactive);
      }
    });

    this.showPlayerControls$.subscribe((option) => {
      const isFading = option === PlayerControlsOptions.Fade;
      // Make sure we display cursor if previously off
      if (this.fadePlayerControls && !isFading) {
        this.fadeCursor(false);
      }
      this.fadePlayerControls = isFading;
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private fadeCursor(isFaded: boolean): void {
    this.renderer.setStyle(
      this.element.nativeElement.querySelector('.showtunes-app'),
      'cursor',
      isFaded ? 'none' : 'inherit');
  }
}
