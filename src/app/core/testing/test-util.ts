import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { SimpleChange } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';

export function callComponentChange(fixture: ComponentFixture<any>, variable: string, value: any): void {
  const simpleChange = {};
  simpleChange[variable] = new SimpleChange(null, value, false);
  fixture.componentInstance.ngOnChanges(simpleChange);
  fixture.detectChanges();
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

export function generateErrorResponse(status: number): HttpErrorResponse {
  return new HttpErrorResponse({
    status
  });
}
