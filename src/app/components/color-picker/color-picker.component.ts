import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SettingsState } from '../../core/settings/settings.state';
import { isHexColor, VALID_HEX_COLOR } from '../../core/util';

const WHITE_HEX = 'FFFFFF';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss']
})
export class ColorPickerComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Select(SettingsState.theme) theme$: Observable<string>;
  theme: string;

  @Input() color: string;
  @Input() placeholderColor: string;
  @Input() presetColors: string[];
  @Input() colorReset$: Observable<void>;
  @Output() colorChange = new EventEmitter<string>();

  inputControl = new FormControl('', [
    Validators.required,
    Validators.pattern(VALID_HEX_COLOR)
  ]);

  form = new FormGroup({
    color: this.inputControl
  });

  constructor() { }

  ngOnInit(): void {
    this.color = this.color.toUpperCase();
    this.setFormValue(this.color);

    this.theme$.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe((theme) => this.theme = theme);

    this.colorReset$.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.setFormValue(this.color);
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  onColorChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (isHexColor(target.value)) {
      this.setColorChange(target.value);
    }
  }

  onPresetColorSelect(presetColor: string): void {
    this.setColorChange(presetColor);
  }

  calculateButtonClass(presetColor: string): string[] {
    const classes: string[] = [];
    if (this.color === presetColor.toUpperCase()) {
      classes.push('selected');
      if (this.color === WHITE_HEX) {
        if (this.theme === 'light-theme') {
          classes.push('white-selected-light');
        } else {
          classes.push('white-selected-dark');
        }
      }
    } else {
      if (presetColor.toUpperCase() === WHITE_HEX) {
        classes.push('white-unselected');
        if (this.theme === 'light-theme') {
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
