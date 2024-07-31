import { Component } from '@angular/core';
import {
  ComponentFixture,
  discardPeriodicTasks,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync
} from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { InteractionThrottleDirective } from './interaction-throttle.directive';

@Component({
  template: `
    <button appInteractionThrottle
            (throttledClick)="onClick()">Test Button</button>
  `
})
class TestComponent {
  onClick(): void {}
}

describe('ButtonThrottleDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        InteractionThrottleDirective,
        TestComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should call the throttledClick method when clicked', fakeAsync(() => {
    spyOn(component, 'onClick');
    const button = fixture.debugElement.nativeElement.querySelector('button');
    button.click();
    tick(500);
    expect(component.onClick).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));

  it('should call the throttledClick only once when within throttle delay', fakeAsync(() => {
    spyOn(component, 'onClick');
    const button = fixture.debugElement.nativeElement.querySelector('button');
    button.click(); // allowed
    tick(500);
    button.click(); // throttled
    tick(250);
    button.click(); // throttled
    tick(250);
    button.click(); // allowed
    expect(component.onClick).toHaveBeenCalledTimes(2);
    discardPeriodicTasks();
  }));
});
