export interface Device {
  id: string;
  name: string;
  type: string;
  volume: number;
  isActive: boolean;
  isPrivateSession: boolean;
  isRestricted: boolean;
}

export interface DeviceResponse {
  id: string;
  name: string;
  type: string;
  volume_percent: number;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
}

export interface MultipleDevicesResponse {
  devices: DeviceResponse[];
}
