import { TestBed } from '@angular/core/testing';

import { SettingsService } from './settings.service';

describe('DarkModeService', () => {
  let service: SettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
