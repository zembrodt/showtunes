import { TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { BehaviorSubject } from 'rxjs';
import { NgxsSelectorMock } from './ngxs-selector-mock';

class TestClass {
  observable$: BehaviorSubject<boolean>;
}

describe('NgxsSelectorMock', () => {
  let mock: NgxsSelectorMock<TestClass>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    mock = new NgxsSelectorMock<TestClass>();
  });

  it('should create', () => {
    expect(mock).toBeTruthy();
  });

  it('should create producer', () => {
    const test = new TestClass();
    expect(test.observable$).toBeFalsy();
    const producer = mock.defineNgxsSelector<boolean>(test, 'observable$');
    expect(producer).toBeTruthy();
    expect(test.observable$).toBeTruthy();
    expect(test.observable$).toEqual(producer);
  });

  it('should emit a null value by default', () => {
    const test = new TestClass();
    const producer = mock.defineNgxsSelector<boolean>(test, 'observable$');
    producer.subscribe((value => {
      expect(value).toEqual(null);
    }));
  });

  it('should emit the passed value by default', () => {
    const test = new TestClass();
    const producer = mock.defineNgxsSelector<boolean>(test, 'observable$', true);
    producer.subscribe((value => {
      expect(value).toEqual(true);
    }));
  });

  it('should not create producer when variable null', () => {
    const test = new TestClass();
    const producer = mock.defineNgxsSelector<boolean>(test, null);
    expect(producer).toBeFalsy();
  });

  it('should not create producer when variable empty string', () => {
    const test = new TestClass();
    const producer = mock.defineNgxsSelector<boolean>(test, '');
    expect(producer).toBeFalsy();
  });

  it('should not create producer when variable only white space', () => {
    const test = new TestClass();
    const producer = mock.defineNgxsSelector<boolean>(test, '   ');
    expect(producer).toBeFalsy();
  });
});
