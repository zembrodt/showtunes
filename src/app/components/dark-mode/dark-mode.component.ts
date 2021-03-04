import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';
import {DarkModeService} from '../../services/dark-mode.service';

const ENABLED_COLOR = 'accent';
const DISABLED_COLOR = 'primary';

@Component({
  selector: 'app-dark-mode',
  templateUrl: './dark-mode.component.html',
  styleUrls: ['./dark-mode.component.css']
})
export class DarkModeComponent implements OnInit {

  @Input() darkModeEnabled = true;

  isDarkMode = true;
  iconColor: string;

  constructor(private darkModeService: DarkModeService) { }

  ngOnInit(): void {
    this.calculateIconColor();
  }

  onDarkModeChange(change: MatSlideToggleChange): void {
    this.darkModeService.toggleDarkMode();
    this.calculateIconColor();
  }

  getDarkMode(): boolean {
    return this.darkModeService.getDarkMode();
  }

  private calculateIconColor(): void {
    if (this.isDarkMode) {
      this.iconColor = ENABLED_COLOR;
    } else {
      this.iconColor = DISABLED_COLOR;
    }
  }
}
