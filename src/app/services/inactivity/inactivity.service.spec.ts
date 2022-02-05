import { TestBed } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { InactivityService } from './inactivity.service';

describe('InactivityService', () => {
  let service: InactivityService;

  beforeEach(() => {
    jasmine.clock().install();
    TestBed.configureTestingModule({});
    service = TestBed.inject(InactivityService);
    spyOn(service.inactive$, 'next');
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should initially emit inactive as false', () => {
    let isInactive = true;
    const sub = service.inactive$.subscribe((inactive) => isInactive = inactive);
    expect(isInactive).toBeFalse();
    expect(service.inactive$.next).not.toHaveBeenCalled();
    sub.unsubscribe();
  });

  it('should emit true after inactivity timer', () => {
    expect(service.inactive$.next).not.toHaveBeenCalled();
    jasmine.clock().tick(InactivityService.INACTIVITY_TIME);
    expect(service.inactive$.next).toHaveBeenCalledWith(true);
  });

  it('should emit false after keydown event', () => {
    jasmine.clock().tick(InactivityService.INACTIVITY_TIME);
    expect(service.inactive$.next).toHaveBeenCalledWith(true);
    document.dispatchEvent(new Event('keydown'));
    expect(service.inactive$.next).toHaveBeenCalledWith(false);
  });

  it('should emit false after mousemove event', () => {
    jasmine.clock().tick(InactivityService.INACTIVITY_TIME);
    expect(service.inactive$.next).toHaveBeenCalledWith(true);
    document.dispatchEvent(new Event('mousemove'));
    expect(service.inactive$.next).toHaveBeenCalledWith(false);
  });

  it('should emit false after mousedown event', () => {
    jasmine.clock().tick(InactivityService.INACTIVITY_TIME);
    expect(service.inactive$.next).toHaveBeenCalledWith(true);
    document.dispatchEvent(new Event('mousedown'));
    expect(service.inactive$.next).toHaveBeenCalledWith(false);
  });

  it('should emit false after wheel event', () => {
    jasmine.clock().tick(InactivityService.INACTIVITY_TIME);
    expect(service.inactive$.next).toHaveBeenCalledWith(true);
    document.dispatchEvent(new Event('wheel'));
    expect(service.inactive$.next).toHaveBeenCalledWith(false);
  });

  it('should emit false after touchstart event', () => {
    jasmine.clock().tick(InactivityService.INACTIVITY_TIME);
    expect(service.inactive$.next).toHaveBeenCalledWith(true);
    document.dispatchEvent(new Event('touchstart'));
    expect(service.inactive$.next).toHaveBeenCalledWith(false);
  });
});
