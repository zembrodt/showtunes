import { TestBed } from '@angular/core/testing';
import { AUTH_STATE_NAME } from '../../core/auth/auth.model';

import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
    window.localStorage.getItem = jasmine.createSpy()
      .withArgs(StorageService.prefix + '_TEST').and.returnValue('value')
      .withArgs(null).and.returnValue(null);
    spyOn(window.localStorage, 'setItem');
    spyOn(window.localStorage, 'removeItem');
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should retrieve a localStorage value with correct key', () => {
    expect(service.get('TEST')).toEqual('value');
    expect(window.localStorage.getItem).toHaveBeenCalledOnceWith(StorageService.prefix + '_TEST');
  });

  it('should capitalize keys to always be uppercase', () => {
    expect(service.get('test')).toEqual('value');
    expect(window.localStorage.getItem).toHaveBeenCalledOnceWith(StorageService.prefix + '_TEST');
  });

  it('should return null when a key doesn\'t exist in localStorage (null)', () => {
    expect(service.get(null)).toEqual(null);
    expect(window.localStorage.getItem).toHaveBeenCalledOnceWith(null);
  });

  it('should set a localStorage value with correct key', () => {
    service.set('test', 'value');
    expect(window.localStorage.setItem).toHaveBeenCalledOnceWith(StorageService.prefix + '_TEST', 'value');
  });

  it('should remove a localStorage value with correct key', () => {
    service.remove('test');
    expect(window.localStorage.removeItem).toHaveBeenCalledOnceWith(StorageService.prefix + '_TEST');
  });

  it('should remove the auth state fom localStorage with correct key', () => {
    service.removeAuthToken();
    expect(window.localStorage.removeItem).toHaveBeenCalledOnceWith(AUTH_STATE_NAME);
  });
});
