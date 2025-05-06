/**
 * Entry type representing a gas flow entry
 */
export interface Entry {
  dateTime: Date;
  flow: number;
  fio2: number;
}

/**
 * Usage type representing calculated gas usage
 */
export interface Usage {
  [date: string]: {
    oxygen: number;
    nitrogen: number;
  };
}

/**
 * Settings type for app configuration
 */
export interface Settings {
  fio2Mode: boolean;
  noRoomAirMode: boolean;
}