export interface Track {
  id: string;
  name: string;
  artist?: string; // Derived from filename usually
  url: string;
  file: File;
}

export enum PlaybackMode {
  NORMAL = 'NORMAL',
  SHUFFLE = 'SHUFFLE',
  REPEAT_ONE = 'REPEAT_ONE'
}
