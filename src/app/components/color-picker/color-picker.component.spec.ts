import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatGridListModule, MatGridTile } from '@angular/material/grid-list';
import { MatGridTileHarness } from '@angular/material/grid-list/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxsModule } from '@ngxs/store';
import { BehaviorSubject, Subject } from 'rxjs';
import { NgxsSelectorMock } from '../../core/testing/ngxs-selector-mock';
import { callComponentChange } from '../../core/testing/test-util';

import { ColorPickerComponent } from './color-picker.component';

const PRESET_COLORS = [
  'FFFFFF', '010101', '3C94F0', '4B23F2', '2A48B4', '1A3366',
  '8FBBCA', '78E9D7', '240E7D', '273FEA', '368A7D', '0B664F'
];

describe('ColorPickerComponent', () => {
  const mockSelectors = new NgxsSelectorMock<ColorPickerComponent>();
  let component: ColorPickerComponent;
  let fixture: ComponentFixture<ColorPickerComponent>;
  let loader: HarnessLoader;
  let rootLoader: HarnessLoader;
  let colorPickerResetEvent: Subject<void>;
  let themeProducer: BehaviorSubject<string>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ColorPickerComponent ],
      imports: [
        BrowserAnimationsModule,
        MatButtonModule,
        MatGridListModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        ReactiveFormsModule,
        NgxsModule.forRoot([], { developmentMode: true })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ColorPickerComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    colorPickerResetEvent = new Subject<void>();
    themeProducer = mockSelectors.defineNgxsSelector<string>(component, 'theme$');

    component.color = '123ABC';
    component.presetColors = PRESET_COLORS;
    component.colorReset$ = colorPickerResetEvent.asObservable();

    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input value', () => {
    const color = component.form.controls.color;
    expect(color.valid).toBeTruthy();
    expect(color.value).toEqual('123ABC');
    expect(component.color).toEqual('123ABC');
  });

  it('should accept valid hex input', () => {
    const colorInput = fixture.debugElement.query(By.directive(MatFormField)).query(By.css('input'));
    const color = component.form.controls.color;
    colorInput.triggerEventHandler('input', { target: { value: 'FFFFFF' }});
    expect(color.errors).toBeFalsy();
    expect(component.color).toEqual('FFFFFF');
  });

  it('should not accept invalid input as hex', () => {
    const colorInput = fixture.debugElement.query(By.directive(MatFormField)).query(By.css('input'));
    const color = component.form.controls.color;
    const defaultValue = component.color;
    colorInput.triggerEventHandler('input', { target: { value: 'test' }});
    expect(color.errors.pattern).toBeTruthy();
    expect(component.color).toEqual(defaultValue);
  });

  it('should not accept an empty string as hex', () => {
    const colorInput = fixture.debugElement.query(By.directive(MatFormField)).query(By.css('input'));
    const color = component.form.controls.color;
    const defaultValue = component.color;
    colorInput.triggerEventHandler('input', { target: { value: '' }});
    expect(color.errors.required).toBeTruthy();
    expect(component.color).toEqual(defaultValue);
  });

  it('should display color menu on button click', async () => {
    fixture.debugElement.nativeElement.querySelector('button').click();
    const colorMenu = await loader.getHarness(MatMenuHarness);
    expect(await colorMenu.isOpen()).toBeTruthy();
  });

  it('should change input value on color selection', async () => {
    spyOn(component.colorChange, 'emit');
    const colorMenu = await loader.getHarness(MatMenuHarness);
    await colorMenu.open();
    const color = component.form.controls.color;
    const previousColor = color.value;
    const tile = fixture.debugElement.query(By.directive(MatGridTile)).query(By.css('button'));
    tile.triggerEventHandler('click', new MouseEvent('button'));
    fixture.detectChanges();
    expect(color.value).toBeTruthy();
    expect(color.value).not.toEqual(previousColor);
    expect(color.value).toEqual(component.color);
    // button should have selected class
    expect(tile.classes.selected).toBeTruthy();
    // colorChange should emit
    expect(component.colorChange.emit).toHaveBeenCalled();
  });

  it('should display all preset colors', async () => {
    const colorMenu = await loader.getHarness(MatMenuHarness);
    await colorMenu.open();
    const colorTiles = await rootLoader.getAllHarnesses(MatGridTileHarness);
    expect(colorTiles.length).toEqual(PRESET_COLORS.length);
  });

  it('should unselect colors on another color selection', async () => {
    const colorMenu = await loader.getHarness(MatMenuHarness);
    await colorMenu.open();
    const tiles = fixture.debugElement.queryAll(By.directive(MatGridTile)).map((tile) => {
      return tile.query(By.css('button'));
    });

    tiles[0].triggerEventHandler('click', new MouseEvent('button'));
    fixture.detectChanges();
    expect(tiles[0].classes.selected).toBeTruthy();

    tiles[1].triggerEventHandler('click', new MouseEvent('button'));
    fixture.detectChanges();
    expect(tiles[0].classes.selected).toBeFalsy();
    expect(tiles[1].classes.selected).toBeTruthy();
  });

  it('should emit color change', () => {
    spyOn(component.colorChange, 'emit');
    const colorInput = fixture.debugElement.query(By.directive(MatFormField)).query(By.css('input'));
    const event = { target: { value: 'ffffff' } };
    colorInput.triggerEventHandler('input', event);
    fixture.detectChanges();
    expect(component.colorChange.emit).toHaveBeenCalledWith('FFFFFF');
  });

  it('should calculate white selected light classes when color is white, selected color is white and light theme', () => {
    themeProducer.next('light-theme');
    component.color = 'FFFFFF';
    component.presetColors = ['FFFFFF'];
    callComponentChange(fixture, 'presetColors', component.presetColors);
    expect(component.calculatedPresetColors.length).toEqual(1);
    expect(component.calculatedPresetColors[0].buttonClass).toEqual(['selected', 'white-selected-light']);
  });

  it('should calculate no class when color is not white, selected color is white, and light theme', () => {
    themeProducer.next('light-theme');
    component.color = 'FFFFFF';
    component.presetColors = ['123123'];
    callComponentChange(fixture, 'presetColors', component.presetColors);
    expect(component.calculatedPresetColors.length).toEqual(1);
    expect(component.calculatedPresetColors[0].buttonClass).toEqual([]);
  });

  it('should calculate selected class when color is not white, selected color is not white, and light theme', () => {
    themeProducer.next('light-theme');
    component.color = '123123';
    component.presetColors = ['123123'];
    callComponentChange(fixture, 'presetColors', component.presetColors);
    expect(component.calculatedPresetColors.length).toEqual(1);
    expect(component.calculatedPresetColors[0].buttonClass).toEqual(['selected']);
  });

  it('should calculate white unselected light classes when color is white, selected color is not white, and light theme', () => {
    themeProducer.next('light-theme');
    component.color = '123123';
    component.presetColors = ['FFFFFF'];
    callComponentChange(fixture, 'presetColors', component.presetColors);
    expect(component.calculatedPresetColors.length).toEqual(1);
    expect(component.calculatedPresetColors[0].buttonClass).toEqual(['white-unselected', 'white-unselected-light']);
  });

  it('should calculate white selected dark classes when color is white, selected color is white, and dark theme', () => {
    themeProducer.next('dark-theme');
    component.color = 'FFFFFF';
    component.presetColors = ['FFFFFF'];
    callComponentChange(fixture, 'presetColors', component.presetColors);
    expect(component.calculatedPresetColors.length).toEqual(1);
    expect(component.calculatedPresetColors[0].buttonClass).toEqual(['selected', 'white-selected-dark']);
  });

  it('should calculate no classes when color is not white, selected color is white, and dark theme', () => {
    themeProducer.next('dark-theme');
    component.color = 'FFFFFF';
    component.presetColors = ['123123'];
    callComponentChange(fixture, 'presetColors', component.presetColors);
    expect(component.calculatedPresetColors.length).toEqual(1);
    expect(component.calculatedPresetColors[0].buttonClass).toEqual([]);
  });

  it('should calculate white unselected dark classes when color is white, selected color is not white, and dark theme', () => {
    themeProducer.next('dark-theme');
    component.color = '123123';
    component.presetColors = ['FFFFFF'];
    callComponentChange(fixture, 'presetColors', component.presetColors);
    expect(component.calculatedPresetColors.length).toEqual(1);
    expect(component.calculatedPresetColors[0].buttonClass).toEqual(['white-unselected', 'white-unselected-dark']);
  });

  it('should calculate selected class when color is not white, selected color is not white, and dark theme', () => {
    themeProducer.next('dark-theme');
    component.color = '123123';
    component.presetColors = ['123123'];
    callComponentChange(fixture, 'presetColors', component.presetColors);
    expect(component.calculatedPresetColors.length).toEqual(1);
    expect(component.calculatedPresetColors[0].buttonClass).toEqual(['selected']);
  });

  it('should calculate the selected button style when preset color selected', () => {
    component.color = 'ABC123';
    component.presetColors = ['ABC123'];
    callComponentChange(fixture, 'presetColors', component.presetColors);
    expect(component.calculatedPresetColors.length).toEqual(1);
    expect(component.calculatedPresetColors[0].buttonStyle).toEqual({'box-shadow': '#ABC123 0px 0px 0px 6px inset'});
  });

  it('should calculate the unselected button style when preset color is not selected', () => {
    component.color = 'ABC123';
    component.presetColors = ['123123'];
    callComponentChange(fixture, 'presetColors', component.presetColors);
    expect(component.calculatedPresetColors.length).toEqual(1);
    expect(component.calculatedPresetColors[0].buttonStyle).toEqual({'background-color': '#123123'});
  });

  it('should calculate no button style when preset color is white and selected', () => {
    component.color = 'FFFFFF';
    component.presetColors = ['FFFFFF'];
    callComponentChange(fixture, 'presetColors', component.presetColors);
    expect(component.calculatedPresetColors.length).toEqual(1);
    expect(component.calculatedPresetColors[0].buttonStyle).toBeFalsy();
  });

  it('should calculate no button style when preset color is white and unselected', () => {
    component.color = 'ABC123';
    component.presetColors = ['FFFFFF'];
    callComponentChange(fixture, 'presetColors', component.presetColors);
    expect(component.calculatedPresetColors.length).toEqual(1);
    expect(component.calculatedPresetColors[0].buttonStyle).toBeFalsy();
  });

  it('should reset input field value on event', () => {
    const colorInput = fixture.debugElement.query(By.directive(MatFormField)).query(By.css('input'));
    const color = component.form.controls.color;
    const defaultColor = component.color;

    colorInput.triggerEventHandler('input', { target: { value: 'test' } });
    expect(component.color).toEqual(defaultColor);
    expect(color.value).toEqual('test');

    colorPickerResetEvent.next();
    expect(component.color).toEqual(defaultColor);
    expect(color.value).toEqual(defaultColor);
  });

  it('should display the pattern error message when input is not hex', () => {
    const color = component.form.controls.color;
    color.setValue('test');
    color.markAsTouched();
    fixture.detectChanges();
    const error = fixture.debugElement.query(By.css('mat-error'));
    expect(color.errors.pattern).toBeTruthy();
    expect(error.nativeElement.textContent.trim()).toEqual('Value must be a valid hex value');
  });

  it('should display the required error message when input is empty', () => {
    const color = component.form.controls.color;
    color.setValue('');
    color.markAsTouched();
    fixture.detectChanges();
    const error = fixture.debugElement.query(By.css('mat-error'));
    expect(color.errors.required).toBeTruthy();
    expect(error.nativeElement.textContent.trim()).toEqual('Background color is required');
  });

  it('should display no error message when the input is valid hex', () => {
    const color = component.form.controls.color;
    color.setValue('ABC123');
    color.markAsTouched();
    fixture.detectChanges();
    const error = fixture.debugElement.query(By.css('mat-error'));
    expect(color.errors).toBeFalsy();
    expect(error).toBeFalsy();
  });
});
