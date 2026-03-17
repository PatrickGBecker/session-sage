export type SongType = 'song' | 'tune';
export type SongStatus = 'known' | 'learning' | 'wishlist';
export type TuneKey = string;

export interface Song {
  id: string;
  name: string;
  type: SongType;
  key?: TuneKey;
  tempo?: string;
  notes?: string;
  status: SongStatus;
  addedBy?: string;
  createdAt: number;
}

export interface SetListItem {
  songId: string;
  order: number;
  notes?: string;
}

export interface SetList {
  id: string;
  name: string;
  date?: string;
  venue?: string;
  notes?: string;
  items: SetListItem[];
  createdAt: number;
}

export interface AppData {
  songs: Song[];
  setLists: SetList[];
  bandName: string;
}

export type ViewTab = 'repertoire' | 'setlists';
