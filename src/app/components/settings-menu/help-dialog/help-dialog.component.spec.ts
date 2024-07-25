import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { MockProvider } from 'ng-mocks';
import { SettingsMenuComponent } from '../settings-menu.component';
import { HelpDialogComponent, HelpDialogData } from './help-dialog.component';

const dataLight: HelpDialogData = {
  version: '0.0.0-light',
  githubIcon: faGithub,
  year: 2022,
  isLightTheme: true
};

const dataDark: HelpDialogData = {
  version: '0.0.0-dark',
  githubIcon: faGithub,
  year: 2022,
  isLightTheme: false
};

const SMART_SHUFFLE_INDEX = 0;
const THEME_INDEX = 1;
const CONTROLS_OFF_INDEX = 2;
const CONTROLS_FADE_INDEX = 3;
const CONTROLS_ON_INDEX = 4;
const PLAYLIST_INDEX = 5;
const SHOW_CODE_INDEX = 6;
const DYNAMIC_COLOR_INDEX = 7;
const DYNAMIC_ACCENT_INDEX = 8;
const DYNAMIC_CODE_INDEX = 9;
const BAR_COLOR_INDEX = 10;

describe('HelpDialogComponent', () => {
  describe('MAT_DIALOG_DATA with light theme', () => {
    let component: HelpDialogComponent;
    let fixture: ComponentFixture<HelpDialogComponent>;
    let dialogRef: MatDialogRef<HelpDialogComponent>;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [SettingsMenuComponent],
        imports: [
          FontAwesomeModule,
          MatButtonModule,
          MatDialogModule,
          MatIconModule,
        ],
        providers: [
          MockProvider(MatDialogRef),
          { provide: MAT_DIALOG_DATA, useValue: dataLight }
        ]
      }).compileComponents();
      dialogRef = TestBed.inject(MatDialogRef);

      fixture = TestBed.createComponent(HelpDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    }));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should contain the app title', () => {
      const title = fixture.debugElement.query(By.css('h1.help-dialog-title'));
      expect(title.nativeElement.textContent.trim()).toEqual('ShowTunes');
    });

    it('should contain mat-dialog-content', () => {
      const dialogContent = fixture.debugElement.query(By.css('mat-dialog-content'));
      expect(dialogContent).toBeTruthy();
    });

    it('should contain the version', () => {
      const version = fixture.debugElement.query(By.css('.version-text'));
      expect(version.nativeElement.textContent.trim()).toEqual(`v${dataLight.version}`);
    });

    it('should use scrollbar light when light theme', () => {
      const dialogContent = fixture.debugElement.query(By.css('mat-dialog-content'));
      expect(dialogContent.classes['scrollbar-light']).toBeTruthy();
    });

    it('should include an info section', () => {
      const titles = fixture.debugElement.queryAll(By.css('h1.help-dialog-title'));
      expect(titles.length).toBeGreaterThanOrEqual(2);
      expect(titles[1].nativeElement.textContent.trim()).toEqual('Info');
    });

    it('should include github link', () => {
      const githubInfo = fixture.debugElement.queryAll(By.css('p'))[2];
      const link = githubInfo.query(By.css('a'));
      expect(link.properties.href).toEqual('https://github.com/zembrodt/showtunes');
      expect(link.nativeElement.textContent.trim()).toEqual('Github');
    });

    it('should include a features section', () => {
      const titles = fixture.debugElement.queryAll(By.css('h1.help-dialog-title'));
      expect(titles.length).toBeGreaterThanOrEqual(3);
      expect(titles[2].nativeElement.textContent.trim()).toEqual('Features');
    });

    it('should include listed features', () => {
      const helpInfo = fixture.debugElement.queryAll(By.css('ul'))[0];
      expect(helpInfo.queryAll(By.css('li')).length).toEqual(6);
    });

    it('should include a help section', () => {
      const titles = fixture.debugElement.queryAll(By.css('h1.help-dialog-title'));
      expect(titles.length).toBeGreaterThanOrEqual(4);
      expect(titles[3].nativeElement.textContent.trim()).toEqual('Help');
    });

    it('should include all help info', () => {
      const helpInfo = fixture.debugElement.queryAll(By.css('ul'))[1];
      expect(helpInfo.queryAll(By.css('li')).length).toEqual(14);
    });

    it('should include help for smart shuffle', () => {
      const helpIcons = fixture.debugElement.queryAll(By.css('.help-icon'));
      expect(helpIcons[SMART_SHUFFLE_INDEX].nativeElement.textContent.trim()).toEqual('model_training');
    });

    it('should include help for theme toggle', () => {
      const helpIcons = fixture.debugElement.queryAll(By.css('.help-icon'));
      expect(helpIcons[THEME_INDEX].nativeElement.textContent.trim()).toEqual('dark_mode');
    });

    it('should include help for player controls off', () => {
      const helpIcons = fixture.debugElement.queryAll(By.css('.help-icon'));
      expect(helpIcons[CONTROLS_OFF_INDEX].nativeElement.textContent.trim()).toEqual('play_disabled');
    });

    it('should include help for player controls fade', () => {
      const helpIcons = fixture.debugElement.queryAll(By.css('.help-icon'));
      expect(helpIcons[CONTROLS_FADE_INDEX].nativeElement.textContent.trim()).toEqual('play_circle_outline');
    });

    it('should include help for player controls on', () => {
      const helpIcons = fixture.debugElement.queryAll(By.css('.help-icon'));
      expect(helpIcons[CONTROLS_ON_INDEX].nativeElement.textContent.trim()).toEqual('play_circle_filled');
    });

    it('should include help for playlist toggle', () => {
      const helpIcons = fixture.debugElement.queryAll(By.css('.help-icon'));
      expect(helpIcons[PLAYLIST_INDEX].nativeElement.textContent.trim()).toEqual('queue_music');
    });

    it('should include help for show spotify code toggle', () => {
      const helpIcons = fixture.debugElement.queryAll(By.css('.help-icon'));
      expect(helpIcons[SHOW_CODE_INDEX].nativeElement.textContent.trim()).toEqual('qr_code_2');
    });

    it('should include help for dynamic color toggle', () => {
      const helpIcons = fixture.debugElement.queryAll(By.css('.help-icon'));
      expect(helpIcons[DYNAMIC_COLOR_INDEX].nativeElement.textContent.trim()).toEqual('lightbulb');
    });

    it('should include help for dynamic accent toggle', () => {
      const helpIcons = fixture.debugElement.queryAll(By.css('.help-icon'));
      expect(helpIcons[DYNAMIC_ACCENT_INDEX].nativeElement.textContent.trim()).toEqual('play_circle_outline');
    });

    it('should include help for dynamic code toggle', () => {
      const helpIcons = fixture.debugElement.queryAll(By.css('.help-icon'));
      expect(helpIcons[DYNAMIC_CODE_INDEX].nativeElement.textContent.trim()).toEqual('qr_code_2');
    });

    it('should include help for bar color toggle', () => {
      const helpIcons = fixture.debugElement.queryAll(By.css('.help-icon'));
      expect(helpIcons[BAR_COLOR_INDEX].nativeElement.textContent.trim()).toEqual('invert_colors');
    });

    it('should close dialogRef when onClose called', () => {
      component.onClose();
      expect(dialogRef.close).toHaveBeenCalledTimes(1);
    });

    it('should include personal website link', () => {
      const developedBy = fixture.debugElement.queryAll(By.css('p'))[3];
      const link = developedBy.query(By.css('a'));
      expect(link.properties.href).toEqual('https://zembrodt.com/');
      expect(link.nativeElement.textContent.trim()).toEqual('Ryan Zembrodt');
    });

    it('should include github link with icon', () => {
      const footer = fixture.debugElement.queryAll(By.css('.footer-item'))[0];
      const link = footer.query(By.css('a'));
      const icon = link.query(By.css('fa-icon'));
      expect(icon).toBeTruthy();
      expect(link.properties.href).toEqual('https://github.com/zembrodt/showtunes');
    });

    it('should include github link with icon', () => {
      const copyright = fixture.debugElement.query(By.css('.copyright-link'));
      const link = copyright.query(By.css('a'));
      expect(link.properties.href).toEqual('https://raw.githubusercontent.com/zembrodt/showtunes/main/LICENSE');
      expect(link.nativeElement.textContent.trim()).toEqual(`© ${dataLight.year} Ryan Zembrodt`);
    });

    it('should include the close button', () => {
      const close = fixture.debugElement.query(By.css('button'));
      expect(close).toBeTruthy();
      expect(close.nativeElement.textContent.trim()).toEqual('Close');
    });

    it('should call onClose when the close button is clicked', () => {
      spyOn(component, 'onClose');
      const close = fixture.debugElement.query(By.css('button'));
      close.triggerEventHandler('click', null);
      expect(component.onClose).toHaveBeenCalled();
    });
  });

  describe('MAT_DIALOG_DATA with dark theme', () => {
    let component: HelpDialogComponent;
    let fixture: ComponentFixture<HelpDialogComponent>;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [SettingsMenuComponent],
        imports: [
          FontAwesomeModule,
          MatButtonModule,
          MatDialogModule,
          MatIconModule,
        ],
        providers: [
          MockProvider(MatDialogRef),
          { provide: MAT_DIALOG_DATA, useValue: dataDark }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(HelpDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    }));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should use scrollbar dark when dark theme', () => {
      const dialogContent = fixture.debugElement.query(By.css('mat-dialog-content'));
      expect(dialogContent.classes['scrollbar-dark']).toBeTruthy();
    });
  });
});
