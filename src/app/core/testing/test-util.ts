import { SimpleChange } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';

export function callComponentChange(fixture: ComponentFixture<any>, variable: string, value: any): void {
  const simpleChange = {};
  simpleChange[variable] = new SimpleChange(null, value, false);
  fixture.componentInstance.ngOnChanges(simpleChange);
  fixture.detectChanges();
}
