import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Theme } from '../../core/settings/settings.model';
import { SettingsState } from '../../core/settings/settings.state';
import { isHexColor, VALID_HEX_COLOR } from '../../core/util';

const WHITE_HEX = 'FFFFFF';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss']
})
export class ColorPickerComponent implements OnInit, OnChanges, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Select(SettingsState.theme) theme$: Observable<string>;
  theme: string;

  @Input() color: string;
  @Input() placeholderColor: string;
  @Input() presetColors: string[];
  @Input() colorReset$: Observable<void>;
  @Output() colorChange = new EventEmitter<string>();

  calculatedPresetColors: PresetColor[] = null;

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
    ).subscribe((theme) => {
      this.theme = theme;
      this.updatePresetColors();
    });

    this.colorReset$.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.setFormValue(this.color);
    });

    this.createPresetColors();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.presetColors) {
      this.createPresetColors();
    }
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

  private setColorChange(color: string): void {
    this.color = color.toUpperCase();
    this.setFormValue(this.color);
    this.colorChange.emit(this.color);
    this.updatePresetColors();
  }

  private setFormValue(value: string): void {
    this.form.setValue({
      color: value
    });
  }

  private createPresetColors(): void {
    this.calculatedPresetColors = new Array(this.presetColors.length);
    this.presetColors.forEach((presetColor, index) => {
      this.calculatedPresetColors[index] = new PresetColor(presetColor, this.color, this.theme);
    });
  }

  private updatePresetColors(): void {
    if (this.calculatedPresetColors !== null) {
      this.calculatedPresetColors.forEach((presetColor) => {
        presetColor.updatePresetColor(this.color, this.theme);
      });
    }
  }
}

class PresetColor {
  presetColor: string;
  buttonStyle: any;
  buttonClass: string[];
  previousColor: string = null;
  previousTheme: string = null;

  constructor(presetColor: string, currentColor: string, currentTheme: string) {
    this.presetColor = presetColor;
    this.updatePresetColor(currentColor, currentTheme);
  }

  updatePresetColor(currentColor: string, currentTheme: string): void {
    if (currentColor !== this.previousColor) {
      this.setButtonClass(currentColor, currentTheme);
      this.setButtonStyle(currentColor);
    }
    else if (currentTheme !== this.previousTheme) {
      this.setButtonClass(currentColor, currentTheme);
    }
    this.previousColor = currentColor;
    this.previousTheme = currentTheme;
  }

  private setButtonClass(currentColor: string, currentTheme: string): void {
    const classes: string[] = [];
    if (currentColor === this.presetColor.toUpperCase()) {
      classes.push('selected');
      if (currentColor === WHITE_HEX) {
        if (currentTheme === Theme.Light) {
          classes.push('white-selected-light');
        } else {
          classes.push('white-selected-dark');
        }
      }
    } else {
      if (this.presetColor.toUpperCase() === WHITE_HEX) {
        classes.push('white-unselected');
        if (currentTheme === Theme.Light) {
          classes.push('white-unselected-light');
        } else {
          classes.push('white-unselected-dark');
        }
      }
    }
    this.buttonClass = classes;
  }

  private setButtonStyle(currentColor: string): void {
    if (this.presetColor.toUpperCase() !== WHITE_HEX) {
      if (currentColor === this.presetColor.toUpperCase()) {
        // Selected preset color (non-white)
        this.buttonStyle = {
          'box-shadow': '#' + this.presetColor + ' 0px 0px 0px 6px inset'
        };
      } else {
        // Unselected preset color (non-white)
        this.buttonStyle = {
          'background-color': '#' + this.presetColor
        };
      }
    }
  }
}
