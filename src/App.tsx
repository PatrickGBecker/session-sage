import { useState, useMemo, useCallback } from 'react';
import './index.css';
import { useSharedData } from './hooks/useSharedData';
import { generateId, formatDate, COMMON_KEYS, TEMPOS } from './lib/utils-app';
import type { Song, SongType, SongStatus, SetList, SetListItem, ViewTab, AppData } from './types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// ─── Icons ───────────────────────────────────────────────────────────
const Ico = ({ d, sz = 18, cls = '' }: { d: string; sz?: number; cls?: string }) => (
  <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}><path d={d} /></svg>
);
const PlusIcon = () => <Ico d="M12 5v14M5 12h14" />;
const SearchIcon = () => <Ico d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />;
const MusicIcon = () => <Ico d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z" />;
const ListIcon = () => <Ico d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />;
const TrashIcon = () => <Ico d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />;
const EditIcon = () => <Ico d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />;
const CalendarIcon = () => <Ico d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18" sz={14} />;
const ClipboardIcon = () => <Ico d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 2h6a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z" />;
const ArrowIcon = ({ dir }: { dir: 'up' | 'down' }) => (
  <Ico d={dir === 'up' ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'} sz={14} />
);
const DotsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
  </svg>
);
const ChevIcon = ({ dir = 'down' }: { dir?: string }) => {
  const r: Record<string, string> = { up: '180', left: '90', right: '-90', down: '0' };
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: `rotate(${r[dir] || '0'}deg)` }}><path d="M6 9l6 6 6-6" /></svg>
  );
};
const GripIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="opacity-30 flex-shrink-0">
    <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
  </svg>
);

// ─── Status config ───────────────────────────────────────────────────
const STATUS_CFG: Record<SongStatus, { label: string; bg: string }> = {
  known: { label: 'Known', bg: 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' },
  learning: { label: 'Learning', bg: 'bg-amber-400/10 border-amber-400/20 text-amber-400' },
  wishlist: { label: 'Wishlist', bg: 'bg-sky-400/10 border-sky-400/20 text-sky-400' },
};

const greenBtn = 'bg-[hsl(145,45%,42%)] hover:bg-[hsl(145,45%,36%)] text-white';
const dialogBg = 'bg-[hsl(30,12%,11%)] border-[hsl(30,10%,20%)]';
const menuBg = 'bg-[hsl(30,12%,12%)] border-[hsl(30,10%,20%)]';

// ─── Song Form Dialog ────────────────────────────────────────────────
function SongForm({ open, onClose, onSave, initial, mode }: {
  open: boolean; onClose: () => void;
  onSave: (s: Omit<Song, 'id' | 'createdAt'>) => void;
  initial?: Song; mode: 'add' | 'edit';
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<SongType>(initial?.type ?? 'song');
  const [key, setKey] = useState(initial?.key ?? '');
  const [tempo, setTempo] = useState(initial?.tempo ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [status, setStatus] = useState<SongStatus>(initial?.status ?? 'known');

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={`max-w-md ${dialogBg}`}>
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Song / Tune' : 'Edit Song / Tune'}</DialogTitle>
          <DialogDescription>{mode === 'add' ? 'Add a new piece to your repertoire.' : 'Update the details.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. The Blarney Pilgrim"
              className="mt-1 bg-secondary border-border" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</label>
              <Select value={type} onValueChange={(v) => setType(v as SongType)}>
                <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="song">Song (vocal)</SelectItem><SelectItem value="tune">Tune (instrumental)</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v as SongStatus)}>
                <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="known">Known</SelectItem><SelectItem value="learning">Learning</SelectItem><SelectItem value="wishlist">Wishlist</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Key</label>
              <Select value={key || 'none'} onValueChange={(v) => setKey(v === 'none' ? '' : v)}>
                <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent><SelectItem value="none">None</SelectItem>{COMMON_KEYS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tempo</label>
              <Select value={tempo || 'none'} onValueChange={(v) => setTempo(v === 'none' ? '' : v)}>
                <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent><SelectItem value="none">None</SelectItem>{TEMPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..."
              className="mt-1 bg-secondary border-border h-20 resize-none" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            if (!name.trim()) return;
            onSave({ name: name.trim(), type, key: key || undefined, tempo: tempo || undefined, notes: notes || undefined, status });
            onClose();
          }} disabled={!name.trim()} className={greenBtn}>{mode === 'add' ? 'Add' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── SetList Form Dialog ─────────────────────────────────────────────
function SetListForm({ open, onClose, onSave, initial, mode }: {
  open: boolean; onClose: () => void;
  onSave: (s: { name: string; date?: string; venue?: string; notes?: string }) => void;
  initial?: SetList; mode: 'add' | 'edit';
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [date, setDate] = useState(initial?.date ?? '');
  const [venue, setVenue] = useState(initial?.venue ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={`max-w-md ${dialogBg}`}>
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'New Set List' : 'Edit Set List'}</DialogTitle>
          <DialogDescription>{mode === 'add' ? 'Create a set list for an upcoming show.' : 'Update the details.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. O'Malley's Friday Night"
              className="mt-1 bg-secondary border-border" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Venue</label>
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Optional" className="mt-1 bg-secondary border-border" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..."
              className="mt-1 bg-secondary border-border h-20 resize-none" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            if (!name.trim()) return;
            onSave({ name: name.trim(), date: date || undefined, venue: venue || undefined, notes: notes || undefined });
            onClose();
          }} disabled={!name.trim()} className={greenBtn}>{mode === 'add' ? 'Create' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Songs to SetList ────────────────────────────────────────────
function AddSongsDialog({ open, onClose, songs, existingIds, onAdd }: {
  open: boolean; onClose: () => void; songs: Song[]; existingIds: Set<string>;
  onAdd: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const avail = songs.filter((s) => s.status === 'known' && !existingIds.has(s.id) && s.name.toLowerCase().includes(search.toLowerCase()));
  const toggle = (id: string) => setSel((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const reset = () => { setSel(new Set()); setSearch(''); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && reset()}>
      <DialogContent className={`max-w-md ${dialogBg}`}>
        <DialogHeader><DialogTitle>Add to Set List</DialogTitle><DialogDescription>Select known songs and tunes to add.</DialogDescription></DialogHeader>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><SearchIcon /></span>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search known repertoire..." className="pl-10 bg-secondary border-border" />
        </div>
        <ScrollArea className="h-64 -mx-1 px-1">
          {avail.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              {songs.filter((s) => s.status === 'known').length === 0 ? 'No known songs yet.' : 'No matching songs.'}
            </p>
          ) : (
            <div className="space-y-1">{avail.map((song) => (
              <button key={song.id} onClick={() => toggle(song.id)}
                className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 transition-colors ${
                  sel.has(song.id) ? 'bg-[hsl(145,45%,42%,0.12)] border border-[hsl(145,45%,42%,0.3)]' : 'hover:bg-secondary border border-transparent'
                }`}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  sel.has(song.id) ? 'border-[hsl(145,45%,42%)] bg-[hsl(145,45%,42%)]' : 'border-[hsl(30,10%,30%)]'
                }`}>
                  {sel.has(song.id) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{song.name}</p>
                  <p className="text-xs text-muted-foreground">{song.type === 'tune' ? 'Tune' : 'Song'}{song.key && ` · ${song.key}`}{song.tempo && ` · ${song.tempo}`}</p>
                </div>
              </button>
            ))}</div>
          )}
        </ScrollArea>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={reset}>Cancel</Button>
          <Button onClick={() => { onAdd(Array.from(sel)); reset(); }} disabled={sel.size === 0} className={greenBtn}>
            Add{sel.size > 0 ? ` (${sel.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Song Row ────────────────────────────────────────────────────────
function SongRow({ song, onEdit, onDelete, onStatusChange }: {
  song: Song; onEdit: () => void; onDelete: () => void; onStatusChange: (s: SongStatus) => void;
}) {
  const cfg = STATUS_CFG[song.status];
  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{song.name}</span>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cfg.bg} border`}>{cfg.label}</Badge>
          {song.type === 'tune' && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-400/10 border-purple-400/20 text-purple-400">Tune</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {song.key && <span className="text-xs text-muted-foreground">Key: {song.key}</span>}
          {song.key && song.tempo && <span className="text-xs text-muted-foreground">·</span>}
          {song.tempo && <span className="text-xs text-muted-foreground">{song.tempo}</span>}
          {song.notes && <span className="text-xs text-muted-foreground italic ml-1">— {song.notes}</span>}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"><DotsIcon /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={menuBg}>
          <DropdownMenuItem onClick={onEdit} className="gap-2"><EditIcon /> Edit</DropdownMenuItem>
          <DropdownMenuSeparator />
          {song.status !== 'known' && <DropdownMenuItem onClick={() => onStatusChange('known')} className="gap-2 text-emerald-400">Mark as Known</DropdownMenuItem>}
          {song.status !== 'learning' && <DropdownMenuItem onClick={() => onStatusChange('learning')} className="gap-2 text-amber-400">Mark as Learning</DropdownMenuItem>}
          {song.status !== 'wishlist' && <DropdownMenuItem onClick={() => onStatusChange('wishlist')} className="gap-2 text-sky-400">Move to Wishlist</DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive"><TrashIcon /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ─── Repertoire Panel ────────────────────────────────────────────────
function RepertoirePanel({ songs, onAdd, onEdit, onDelete, onStatusChange }: {
  songs: Song[]; onAdd: () => void; onEdit: (s: Song) => void; onDelete: (id: string) => void;
  onStatusChange: (id: string, s: SongStatus) => void;
}) {
  const [search, setSearch] = useState('');
  const [fStatus, setFStatus] = useState<SongStatus | 'all'>('all');
  const [fType, setFType] = useState<SongType | 'all'>('all');

  const filtered = useMemo(() =>
    songs.filter((s) =>
      (fStatus === 'all' || s.status === fStatus) &&
      (fType === 'all' || s.type === fType) &&
      (!search || s.name.toLowerCase().includes(search.toLowerCase()))
    ).sort((a, b) => a.name.localeCompare(b.name)),
  [songs, search, fStatus, fType]);

  const counts = useMemo(() => ({
    all: songs.length,
    known: songs.filter((s) => s.status === 'known').length,
    learning: songs.filter((s) => s.status === 'learning').length,
    wishlist: songs.filter((s) => s.status === 'wishlist').length,
  }), [songs]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 space-y-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Repertoire</h2>
          <Button onClick={onAdd} size="sm" className={`${greenBtn} gap-1.5`}><PlusIcon /> Add</Button>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><SearchIcon /></span>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search songs & tunes..."
            className="pl-10 bg-secondary border-border" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'known', 'learning', 'wishlist'] as const).map((s) => (
            <button key={s} onClick={() => setFStatus(s)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                fStatus === s ? (s === 'all' ? 'bg-foreground/10 border-foreground/20 text-foreground' : STATUS_CFG[s].bg)
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
              }`}>{s === 'all' ? 'All' : STATUS_CFG[s].label} ({counts[s]})</button>
          ))}
          <Separator orientation="vertical" className="h-5 self-center mx-1" />
          {(['all', 'song', 'tune'] as const).map((t) => (
            <button key={t} onClick={() => setFType(t)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                fType === t ? 'bg-foreground/10 border-foreground/20 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
              }`}>{t === 'all' ? 'All Types' : t === 'song' ? 'Songs' : 'Tunes'}</button>
          ))}
        </div>
      </div>
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MusicIcon />
            <p className="mt-3 text-sm">{songs.length === 0 ? 'Your repertoire is empty.' : 'No matches found.'}</p>
            {songs.length === 0 && (
              <Button onClick={onAdd} variant="ghost" size="sm" className="mt-2 gap-1.5 text-[hsl(145,45%,52%)]"><PlusIcon /> Add your first piece</Button>
            )}
          </div>
        ) : (
          <div>{filtered.map((song) => (
            <SongRow key={song.id} song={song} onEdit={() => onEdit(song)} onDelete={() => onDelete(song.id)}
              onStatusChange={(st) => onStatusChange(song.id, st)} />
          ))}</div>
        )}
      </ScrollArea>
    </div>
  );
}

// ─── Set List Detail ─────────────────────────────────────────────────
function SetListDetail({ setList, songs, onBack, onEdit, onDelete, onAddSongs, onRemoveSong, onReorder }: {
  setList: SetList; songs: Song[]; onBack: () => void; onEdit: () => void; onDelete: () => void;
  onAddSongs: () => void; onRemoveSong: (id: string) => void; onReorder: (items: SetListItem[]) => void;
}) {
  const songMap = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);
  const move = (i: number, dir: -1 | 1) => {
    const items = [...setList.items];
    const t = i + dir;
    if (t < 0 || t >= items.length) return;
    [items[i], items[t]] = [items[t], items[i]];
    items.forEach((item, idx) => { item.order = idx; });
    onReorder(items);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 space-y-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors p-1"><ChevIcon dir="left" /></button>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold tracking-tight truncate">{setList.name}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
              {setList.date && <span className="flex items-center gap-1"><CalendarIcon />{formatDate(setList.date)}</span>}
              {setList.venue && <span>· {setList.venue}</span>}
              <span>· {setList.items.length} piece{setList.items.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><DotsIcon /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={menuBg}>
              <DropdownMenuItem onClick={onEdit} className="gap-2"><EditIcon /> Edit Details</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive"><TrashIcon /> Delete Set List</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {setList.notes && <p className="text-xs text-muted-foreground italic px-7">{setList.notes}</p>}
        <div className="flex justify-end">
          <Button onClick={onAddSongs} size="sm" variant="outline" className="gap-1.5 border-border"><PlusIcon /> Add Songs</Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        {setList.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ClipboardIcon /><p className="mt-3 text-sm">This set list is empty.</p>
            <Button onClick={onAddSongs} variant="ghost" size="sm" className="mt-2 gap-1.5 text-[hsl(145,45%,52%)]"><PlusIcon /> Add songs</Button>
          </div>
        ) : (
          <div>{setList.items.sort((a, b) => a.order - b.order).map((item, index) => {
            const song = songMap.get(item.songId);
            if (!song) return null;
            return (
              <div key={item.songId} className="group flex items-center gap-2 px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border/50">
                <span className="text-xs text-muted-foreground w-6 text-right font-mono flex-shrink-0">{index + 1}.</span>
                <GripIcon />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{song.name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{song.type === 'tune' ? 'Tune' : 'Song'}</span>
                    {song.key && <span className="text-xs text-muted-foreground">· {song.key}</span>}
                    {song.tempo && <span className="text-xs text-muted-foreground">· {song.tempo}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={index === 0} onClick={() => move(index, -1)}><ArrowIcon dir="up" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={index === setList.items.length - 1} onClick={() => move(index, 1)}><ArrowIcon dir="down" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => onRemoveSong(item.songId)}><TrashIcon /></Button>
                </div>
              </div>
            );
          })}</div>
        )}
      </ScrollArea>
    </div>
  );
}

// ─── Set Lists Panel ─────────────────────────────────────────────────
function SetListsPanel({ setLists, songs, data, saveData }: {
  setLists: SetList[]; songs: Song[]; data: AppData; saveData: (d: AppData) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingSL, setEditingSL] = useState<SetList | null>(null);
  const [showAddSongs, setShowAddSongs] = useState(false);
  const active = setLists.find((sl) => sl.id === activeId);

  const createSL = (info: { name: string; date?: string; venue?: string; notes?: string }) => {
    const sl: SetList = { id: generateId(), ...info, items: [], createdAt: Date.now() };
    saveData({ ...data, setLists: [...data.setLists, sl] });
    setActiveId(sl.id);
  };
  const editSL = (info: { name: string; date?: string; venue?: string; notes?: string }) => {
    if (!editingSL) return;
    saveData({ ...data, setLists: data.setLists.map((sl) => sl.id === editingSL.id ? { ...sl, ...info } : sl) });
    setEditingSL(null);
  };
  const deleteSL = (id: string) => { saveData({ ...data, setLists: data.setLists.filter((sl) => sl.id !== id) }); setActiveId(null); };
  const addSongs = (songIds: string[]) => {
    if (!active) return;
    const maxO = active.items.reduce((m, i) => Math.max(m, i.order), -1);
    const newItems = songIds.map((songId, i) => ({ songId, order: maxO + 1 + i }));
    saveData({ ...data, setLists: data.setLists.map((sl) => sl.id === active.id ? { ...sl, items: [...sl.items, ...newItems] } : sl) });
  };
  const removeSong = (songId: string) => {
    if (!active) return;
    const items = active.items.filter((i) => i.songId !== songId);
    items.forEach((item, idx) => { item.order = idx; });
    saveData({ ...data, setLists: data.setLists.map((sl) => sl.id === active.id ? { ...sl, items } : sl) });
  };
  const reorder = (items: SetListItem[]) => {
    if (!active) return;
    saveData({ ...data, setLists: data.setLists.map((sl) => sl.id === active.id ? { ...sl, items } : sl) });
  };

  if (active) return (
    <>
      <SetListDetail setList={active} songs={songs} onBack={() => setActiveId(null)}
        onEdit={() => setEditingSL(active)} onDelete={() => deleteSL(active.id)}
        onAddSongs={() => setShowAddSongs(true)} onRemoveSong={removeSong} onReorder={reorder} />
      {editingSL && <SetListForm open={true} onClose={() => setEditingSL(null)} onSave={editSL} initial={editingSL} mode="edit" />}
      <AddSongsDialog open={showAddSongs} onClose={() => setShowAddSongs(false)} songs={songs}
        existingIds={new Set(active.items.map((i) => i.songId))} onAdd={addSongs} />
    </>
  );

  const sorted = [...setLists].sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date);
    if (a.date) return -1; if (b.date) return 1;
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Set Lists</h2>
          <Button onClick={() => setShowCreate(true)} size="sm" className={`${greenBtn} gap-1.5`}><PlusIcon /> New Set List</Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ListIcon /><p className="mt-3 text-sm">No set lists yet.</p>
            <Button onClick={() => setShowCreate(true)} variant="ghost" size="sm" className="mt-2 gap-1.5 text-[hsl(145,45%,52%)]"><PlusIcon /> Create your first</Button>
          </div>
        ) : (
          <div className="px-4 space-y-2 pb-4">{sorted.map((sl) => (
            <button key={sl.id} onClick={() => setActiveId(sl.id)}
              className="w-full text-left p-4 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border transition-all">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">{sl.name}</h3><ChevIcon dir="right" />
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                {sl.date && <span>{formatDate(sl.date)}</span>}
                {sl.venue && <span>· {sl.venue}</span>}
                <span>· {sl.items.length} piece{sl.items.length !== 1 ? 's' : ''}</span>
              </div>
            </button>
          ))}</div>
        )}
      </ScrollArea>
      <SetListForm open={showCreate} onClose={() => setShowCreate(false)} onSave={createSL} mode="add" />
    </div>
  );
}

// ─── Confirm Dialog ──────────────────────────────────────────────────
function ConfirmDlg({ open, onClose, onConfirm, title, desc }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; desc: string;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={`max-w-sm ${dialogBg}`}>
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{desc}</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onClose(); }}>Delete</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Band Name Dialog ────────────────────────────────────────────────
function BandNameDlg({ open, onClose, currentName, onSave }: {
  open: boolean; onClose: () => void; currentName: string; onSave: (n: string) => void;
}) {
  const [name, setName] = useState(currentName);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={`max-w-sm ${dialogBg}`}>
        <DialogHeader><DialogTitle>Band Name</DialogTitle><DialogDescription>Set your band's name.</DialogDescription></DialogHeader>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border" autoFocus />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSave(name.trim() || 'Our Band'); onClose(); }} className={greenBtn}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main App ────────────────────────────────────────────────────────
function App() {
  const { data, saveData, loading } = useSharedData();
  const [tab, setTab] = useState<ViewTab>('repertoire');
  const [showSongForm, setShowSongForm] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showBandName, setShowBandName] = useState(false);

  const addSong = useCallback((s: Omit<Song, 'id' | 'createdAt'>) => {
    saveData({ ...data, songs: [...data.songs, { ...s, id: generateId(), createdAt: Date.now() }] });
  }, [data, saveData]);

  const editSong = useCallback((s: Omit<Song, 'id' | 'createdAt'>) => {
    if (!editingSong) return;
    saveData({ ...data, songs: data.songs.map((x) => x.id === editingSong.id ? { ...x, ...s } : x) });
    setEditingSong(null);
  }, [data, saveData, editingSong]);

  const deleteSong = useCallback((id: string) => {
    saveData({ ...data, songs: data.songs.filter((s) => s.id !== id),
      setLists: data.setLists.map((sl) => ({ ...sl, items: sl.items.filter((i) => i.songId !== id) })) });
  }, [data, saveData]);

  const changeStatus = useCallback((id: string, status: SongStatus) => {
    saveData({ ...data, songs: data.songs.map((s) => s.id === id ? { ...s, status } : s) });
  }, [data, saveData]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[hsl(145,45%,42%)] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between flex-shrink-0"
        style={{ background: 'linear-gradient(180deg, hsl(30,12%,10%) 0%, hsl(30,15%,7%) 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[hsl(145,45%,42%)] flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div className="min-w-0">
            <button onClick={() => setShowBandName(true)} className="hover:text-[hsl(145,45%,52%)] transition-colors">
              <h1 className="text-lg font-bold tracking-tight leading-none truncate">{data.bandName}</h1>
            </button>
            <p className="text-[11px] text-muted-foreground tracking-widest uppercase mt-0.5">Session Sage</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
          <span>{data.songs.length} piece{data.songs.length !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{data.setLists.length} set{data.setLists.length !== 1 ? 's' : ''}</span>
        </div>
      </header>

      <div className="border-b border-border px-4 py-2 flex-shrink-0 bg-card">
        <Tabs value={tab} onValueChange={(v) => setTab(v as ViewTab)}>
          <TabsList className="bg-secondary/70 h-9">
            <TabsTrigger value="repertoire" className="gap-1.5 text-xs data-[state=active]:bg-[hsl(145,45%,42%,0.15)] data-[state=active]:text-[hsl(145,45%,52%)]">
              <MusicIcon /> Repertoire
            </TabsTrigger>
            <TabsTrigger value="setlists" className="gap-1.5 text-xs data-[state=active]:bg-[hsl(145,45%,42%,0.15)] data-[state=active]:text-[hsl(145,45%,52%)]">
              <ListIcon /> Set Lists
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <main className="flex-1 overflow-hidden">
        {tab === 'repertoire' ? (
          <RepertoirePanel songs={data.songs} onAdd={() => setShowSongForm(true)}
            onEdit={setEditingSong} onDelete={setDeletingId} onStatusChange={changeStatus} />
        ) : (
          <SetListsPanel setLists={data.setLists} songs={data.songs} data={data} saveData={saveData} />
        )}
      </main>

      {showSongForm && <SongForm open={true} onClose={() => setShowSongForm(false)} onSave={addSong} mode="add" />}
      {editingSong && <SongForm open={true} onClose={() => setEditingSong(null)} onSave={editSong} initial={editingSong} mode="edit" />}
      {deletingId && <ConfirmDlg open={true} onClose={() => setDeletingId(null)} onConfirm={() => deleteSong(deletingId)}
        title="Delete Song" desc="This will remove this piece from your repertoire and all set lists." />}
      <BandNameDlg open={showBandName} onClose={() => setShowBandName(false)} currentName={data.bandName}
        onSave={(n) => saveData({ ...data, bandName: n })} />
    </div>
  );
}

export default App;
