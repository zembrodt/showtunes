import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { SimpleChange } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';

export function callComponentChange(fixture: ComponentFixture<any>, variable: string, value: any): void {
  const simpleChange = {};
  simpleChange[variable] = new SimpleChange(null, value, false);
  fixture.componentInstance.ngOnChanges(simpleChange);
  fixture.detectChanges();
}

export function callComponentChanges(fixture: ComponentFixture<any>, variables: string[], values: any[]): void {
  if (variables.length !== values.length) {
    fail('Incompatible amount of variables and values for component change call');
  } else {
    const simpleChanges = {};
    for (let i = 0; i < variables.length; i++) {
      simpleChanges[variables[i]] = new SimpleChange(null, values[i], false);
    }
    fixture.componentInstance.ngOnChanges(simpleChanges);
    fixture.detectChanges();
  }
}

export function generateResponse<T>(body: T, status: number): HttpResponse<T> {
  return new HttpResponse<T>({
    body,
    headers: null,
    status,
    statusText: 'test-status',
    url: 'test-url'
  });
}

export function generateErrorResponse(status: number, error = null): HttpErrorResponse {
  return new HttpErrorResponse({
    error,
    status
  });
}
