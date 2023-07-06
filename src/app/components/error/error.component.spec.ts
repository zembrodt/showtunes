import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { ErrorComponent } from './error.component';

describe('ErrorComponent', () => {
  let component: ErrorComponent;
  let fixture: ComponentFixture<ErrorComponent>;
  let loader: HarnessLoader;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ErrorComponent ],
      imports: [ MatIconModule ]
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the error icon', () => {
    const icon = fixture.debugElement.query(By.directive(MatIcon));
    expect(icon).toBeTruthy();
    expect(icon.componentInstance.color).toEqual('warn');
    expect(icon.nativeElement.textContent.trim()).toEqual('error_outline');
  });

  it('should display the error message', () => {
    const errorMessage = 'This is an error message';
    component.message = errorMessage;
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.mat-display-1')).nativeElement.textContent.trim()).toEqual(errorMessage);
  });
});
