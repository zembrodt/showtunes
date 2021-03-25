import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {isValidHex, VALID_HEX} from '../../core/util';
import {Observable, Subscription} from 'rxjs';
import {Select} from '@ngxs/store';
import {SettingsState} from '../../core/settings/settings.state';

const WHITE_HEX = 'FFFFFF';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss']
})
export class ColorPickerComponent implements OnInit, OnDestroy {

  private colorResetEventSubscription: Subscription;

  @Select(SettingsState.theme) theme$: Observable<string>;

  @Input() color: string;
  @Input() placeholderColor: string;
  @Input() presetColors: string[];
  @Input() colorResetEvent: Observable<void>;
  @Output() colorChange = new EventEmitter<string>();

  inputControl = new FormControl('', [
    Validators.required,
    Validators.pattern(VALID_HEX)
  ]);

  form = new FormGroup({
    color: this.inputControl
  });

  constructor() { }

  ngOnInit(): void {
    this.color = this.color.toUpperCase();
    this.setFormValue(this.color);

    this.colorResetEventSubscription = this.colorResetEvent.subscribe(() => {
      console.log('Received color reset request');
      this.setFormValue(this.color);
    });
  }

  ngOnDestroy(): void {
    this.colorResetEventSubscription.unsubscribe();
  }

  onColorChange(event): void {
    console.log('Color changed to: \'' + event.target.value + '\'');
    if (isValidHex(event.target.value)) {
      this.setColorChange(event.target.value);
    }
  }

  onPresetColorSelect(presetColor: string): void {
    console.log('Preset color selected: \'' + presetColor + '\'');
    this.setColorChange(presetColor);
  }

  calculateButtonClass(presetColor: string, theme: string): string[] {
    const classes: string[] = [];
    if (this.color === presetColor.toUpperCase()) {
      classes.push('selected');
      if (this.color === WHITE_HEX) {
        if (theme === 'light-theme') {
          classes.push('white-selected-light');
        } else {
          classes.push('white-selected-dark');
        }
      }
    } else {
      if (presetColor.toUpperCase() === WHITE_HEX) {
        classes.push('white-unselected');
        if (theme === 'light-theme') {
          classes.push('white-unselected-light');
        } else {
          classes.push('white-unselected-dark');
        }
      }
    }
    return classes;
  }

  calculateButtonStyle(presetColor: string): any {
    if (presetColor.toUpperCase() !== WHITE_HEX) {
      if (this.color === presetColor.toUpperCase()) {
        // Selected preset color (non-white)
        return {
          'box-shadow': '#' + presetColor + ' 0px 0px 0px 6px inset'
        };
      }
      // Unselected preset color (non-white)
      return {
        'background-color': '#' + presetColor
      };
    }
  }

  private setColorChange(color: string): void {
    this.color = color.toUpperCase();
    this.setFormValue(this.color);
    this.colorChange.emit(this.color);
  }

  private setFormValue(value: string): void {
    this.form.setValue({
      color: value
    });
  }
}
