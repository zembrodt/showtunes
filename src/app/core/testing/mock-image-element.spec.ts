/* tslint:disable:no-string-literal */

import { fakeAsync, tick } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { MockImageElement } from './mock-image-element';

const STEP = 10;

describe('MockImageElement', () => {
  let mockImageElement: MockImageElement = null;

  beforeEach(() => {
    mockImageElement = new MockImageElement(1, 1);
  });

  it('should set the width and height of the mock image', () => {
    expect(mockImageElement.width).toBeTruthy();
    expect(mockImageElement.height).toBeTruthy();
  });

  it('should set the onLoad function with addEventListener', () => {
    expect(mockImageElement['loadFn']).toBeNull();

    mockImageElement.addEventListener('load', () => {});
    expect(mockImageElement['loadFn']).not.toBeNull();
  });

  it('should set the onError function with addEventListener', () => {
    expect(mockImageElement['errorFn']).toBeNull();

    mockImageElement.addEventListener('error', () => {});
    expect(mockImageElement['errorFn']).not.toBeNull();
  });

  it('should set the onAbort function with addEventListener', () => {
    expect(mockImageElement['abortFn']).toBeNull();

    mockImageElement.addEventListener('abort', () => {});
    expect(mockImageElement['abortFn']).not.toBeNull();
  });

  it('should remove the onLoad function with removeEventListener', () => {
    expect(mockImageElement['loadFn']).toBeNull();

    mockImageElement.addEventListener('load', () => {});
    expect(mockImageElement['loadFn']).not.toBeNull();

    mockImageElement.removeEventListener('load', () => {});
    expect(mockImageElement['loadFn']).toBeNull();
  });

  it('should remove the onError function with removeEventListener', () => {
    expect(mockImageElement['errorFn']).toBeNull();

    mockImageElement.addEventListener('error', () => {});
    expect(mockImageElement['errorFn']).not.toBeNull();

    mockImageElement.removeEventListener('error', () => {});
    expect(mockImageElement['errorFn']).toBeNull();
  });

  it('should remove the onAbort function with removeEventListener', () => {
    expect(mockImageElement['abortFn']).toBeNull();

    mockImageElement.addEventListener('abort', () => {});
    expect(mockImageElement['abortFn']).not.toBeNull();

    mockImageElement.removeEventListener('abort', () => {});
    expect(mockImageElement['abortFn']).toBeNull();
  });

  it('should call the onLoad function after given timeout', fakeAsync(() => {
    let value = 0;
    const onLoad = () => value++;
    mockImageElement.addEventListener('load', onLoad);

    mockImageElement.onLoad(STEP);
    expect(value).toEqual(0);

    tick(STEP);
    expect(value).toEqual(1);
  }));

  it('should call the onError function after given timeout', fakeAsync(() => {
    let value = 0;
    const onError = () => value++;
    mockImageElement.addEventListener('error', onError);

    mockImageElement.onError(STEP);
    expect(value).toEqual(0);

    tick(STEP);
    expect(value).toEqual(1);
  }));

  it('should call the onAbort function after given timeout', fakeAsync(() => {
    let value = 0;
    const onAbort = () => value++;
    mockImageElement.addEventListener('abort', onAbort);

    mockImageElement.onAbort(STEP);
    expect(value).toEqual(0);

    tick(STEP);
    expect(value).toEqual(1);
  }));
});
