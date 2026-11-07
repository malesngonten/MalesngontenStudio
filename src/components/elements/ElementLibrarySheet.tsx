import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import {
  Search,
  Download,
  Check,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Code2,
  Copy,
  Plus,
  ArrowLeft,
  Sparkles,
  Trash2,
  Layers,
  X,
} from 'lucide-react';
import {
  getAllElements,
  saveInstalledElementSlugs,
  createElementTimelineClip,
  saveUserElement,
  deleteUserElement,
  createUserElementFromClip,
} from '../../remotion/elements/registry';
import {
  RemotionElementDefinition,
  ElementCategory,
} from '../../remotion/elements/types';
import { TimelineData, TimelineClip } from '../../types';

interface ElementLibrarySheetProps {
  timeline: TimelineData;
  onInsertElementToTimeline: (clip: TimelineClip, layerName?: string) => void;
  onInstallElementToWorkspace: (element: RemotionElementDefinition) => void;
  installedSlugs: string[];
  onOpenCodeEditor?: (fileName: string) => void;
  onOpenRender?: () => void;
  initialCategory?: 'all' | ElementCategory;
}

const CATEGORIES: { id: 'all' | ElementCategory; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'Komponen Pengguna', label: 'Komponen Saya' },
  { id: 'Animated Typography', label: 'Typography' },
  { id: 'Lower Thirds', label: 'Lower Thirds' },
  { id: 'Captions & Subtitles', label: 'Subtitles' },
  { id: 'Transitions', label: 'Transitions' },
  { id: 'Backgrounds', label: 'Backgrounds' },
  { id: 'Charts & Data Visualization', label: 'Charts' },
  { id: 'Infographics', label: 'Infographics' },
  { id: 'Shapes & Decorative Elements', label: 'Shapes' },
  { id: 'Social Media Elements', label: 'Social' },
];

/**
 * Single Element Card with its own Live Interactive Remotion Preview Player (Zero Border)
 */
interface ElementCardProps {
  element: RemotionElementDefinition;
  isInstalled: boolean;
  onInstall: (element: RemotionElementDefinition) => void;
  onInsert: (element: RemotionElementDefinition) => void;
  onCustomize: (element: RemotionElementDefinition) => void;
  onDelete?: (slug: string) => void;
}

const ElementCard: React.FC<ElementCardProps> = ({
  element,
  isInstalled,
  onInstall,
  onInsert,
  onCustomize,
  onDelete,
}) => {
  const playerRef = useRef<PlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const p = playerRef.current;
    if (!p) return;
    if (isPlaying) {
      p.pause();
      setIsPlaying(false);
    } else {
      p.play();
      setIsPlaying(true);
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    playerRef.current?.seekTo(0);
  };

  return (
    <div className="bg-gradient-to-b from-[#181822] to-[#111116] rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-all group">
      {/* 1. Card Header */}
      <div className="p-3.5 flex items-center justify-between gap-2 bg-[#1b1b24] shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ${
              element.isUserCreated ? 'bg-amber-400 shadow-amber-500/50' : 'bg-red-500 shadow-red-500/50'
            }`}
          />
          <h4 className="text-sm font-bold text-white truncate">{element.displayName}</h4>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {element.isUserCreated && (
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 text-[10px] font-semibold">
              Komponen Anda
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-300">
            {element.category}
          </span>
          {isInstalled && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 text-[10px] font-semibold shadow-xs">
              <Check className="w-3 h-3" />
              <span>Terpasang</span>
            </span>
          )}
          {element.isUserCreated && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(element.slug);
              }}
              className="tap w-6 h-6 rounded-full bg-zinc-800/80 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 flex items-center justify-center transition-colors"
              title="Hapus komponen ini"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Direct Interactive Live Remotion Player Preview */}
      <div className="relative w-full h-[175px] sm:h-[195px] bg-black overflow-hidden flex items-center justify-center">
        <Player
          ref={playerRef}
          component={element.component}
          inputProps={element.initialProps}
          durationInFrames={element.durationInFrames}
          fps={element.fps}
          compositionWidth={element.dimensions.width}
          compositionHeight={element.dimensions.height}
          style={{
            width: '100%',
            height: '100%',
            maxHeight: '100%',
            pointerEvents: 'none',
          }}
          controls={false}
          autoPlay={true}
          loop
        />

        {/* Floating Quick Play / Reset Control on Card */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-auto opacity-80 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={togglePlay}
              className="tap px-2.5 py-1 rounded-full bg-black/85 hover:bg-black text-white flex items-center gap-1 text-[11px] font-semibold backdrop-blur-md shadow-md"
              title={isPlaying ? 'Jeda preview' : 'Putar preview'}
            >
              {isPlaying ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-white" />}
              <span>{isPlaying ? 'Jeda' : 'Putar'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="tap w-6 h-6 rounded-full bg-black/85 hover:bg-black text-zinc-300 hover:text-white flex items-center justify-center backdrop-blur-md shadow-md"
              title="Reset ke awal"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-black/85 text-[10px] font-mono text-zinc-300 backdrop-blur-md shadow-md">
            {(element.durationInFrames / element.fps).toFixed(1)}s • {element.dimensions.width}x{element.dimensions.height}
          </span>
        </div>
      </div>

      {/* 3. Card Description & Tags */}
      <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
          {element.description}
        </p>

        {/* 4. Action Buttons */}
        <div className="flex items-center gap-2 pt-1 bg-gradient-to-t from-white/5 to-transparent rounded-xl p-1">
          <button
            type="button"
            onClick={() => onInsert(element)}
            className="tap flex-1 py-2 px-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-red-950/50 active:scale-95"
            title="Tambahkan elemen ini ke timeline aktif"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Gunakan</span>
          </button>

          <button
            type="button"
            onClick={() => onCustomize(element)}
            className="tap py-2 px-3.5 rounded-full bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            title="Ubah teks, warna, ukuran props dan lihat kode TSX"
          >
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            <span>Kustomisasi</span>
          </button>

          {!isInstalled && (
            <button
              type="button"
              onClick={() => onInstall(element)}
              className="tap p-2 rounded-full bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all shadow-xs"
              title="Pasang source code TSX ke project"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const ElementLibrarySheet: React.FC<ElementLibrarySheetProps> = ({
  timeline,
  onInsertElementToTimeline,
  onInstallElementToWorkspace,
  installedSlugs,
  onOpenCodeEditor,
  onOpenRender,
  initialCategory,
}) => {
  const [elementsList, setElementsList] = useState<RemotionElementDefinition[]>(() => getAllElements());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | ElementCategory>(() => initialCategory || 'all');
  const [customizingElement, setCustomizingElement] = useState<RemotionElementDefinition | null>(null);
  const [customProps, setCustomProps] = useState<Record<string, any>>({});
  const [showCodeView, setShowCodeView] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [installedSet, setInstalledSet] = useState<Set<string>>(() => new Set(installedSlugs));

  // State for creating new component from active video
  const [showCreateFromVideo, setShowCreateFromVideo] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string>('');
  const [newComponentName, setNewComponentName] = useState('');
  const [newComponentCategory, setNewComponentCategory] = useState<ElementCategory>('Komponen Pengguna');
  const [newComponentDesc, setNewComponentDesc] = useState('');

  const modalPlayerRef = useRef<PlayerRef>(null);
  const [isModalPlaying, setIsModalPlaying] = useState(true);

  // Sync all elements on mount or updates
  const refreshElements = () => {
    setElementsList(getAllElements());
  };

  // User-created elements count
  const userComponentsCount = useMemo(() => {
    return elementsList.filter((el) => el.isUserCreated || el.category === 'Komponen Pengguna').length;
  }, [elementsList]);

  // Extract all clips from timeline layers
  const availableTimelineClips = useMemo(() => {
    const list: { layerName: string; clip: TimelineClip }[] = [];
    if (timeline && timeline.layers) {
      timeline.layers.forEach((layer) => {
        layer.clips.forEach((clip) => {
          list.push({ layerName: layer.name, clip });
        });
      });
    }
    return list;
  }, [timeline]);

  // Filter elements
  const filteredElements = useMemo(() => {
    return elementsList.filter((el) => {
      let matchCat = false;
      if (selectedCategory === 'all') {
        matchCat = true;
      } else if (selectedCategory === 'Komponen Pengguna') {
        matchCat = Boolean(el.isUserCreated || el.category === 'Komponen Pengguna');
      } else {
        matchCat = el.category === selectedCategory;
      }

      const matchSearch =
        !searchQuery.trim() ||
        el.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [elementsList, selectedCategory, searchQuery]);

  // Install to workspace
  const handleInstall = (element: RemotionElementDefinition) => {
    onInstallElementToWorkspace(element);
    const updated = new Set(installedSet);
    updated.add(element.slug);
    setInstalledSet(updated);
    saveInstalledElementSlugs(Array.from(updated));
    refreshElements();
  };

  // Insert to active project timeline
  const handleInsert = (element: RemotionElementDefinition, propsToUse?: Record<string, any>) => {
    if (!installedSet.has(element.slug)) {
      handleInstall(element);
    }
    const clip = createElementTimelineClip(element, 0, propsToUse || element.initialProps);
    onInsertElementToTimeline(clip, `Layer ${element.displayName}`);
  };

  // Delete user element
  const handleDeleteUserElement = (slug: string) => {
    deleteUserElement(slug);
    refreshElements();
  };

  // Open customization modal
  const handleOpenCustomize = (element: RemotionElementDefinition) => {
    setCustomizingElement(element);
    setCustomProps({ ...element.initialProps });
    setShowCodeView(false);
    setIsModalPlaying(true);
  };

  // Update prop in customizer
  const handlePropChange = (key: string, value: any) => {
    setCustomProps((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCopyCode = () => {
    if (!customizingElement) return;
    navigator.clipboard.writeText(customizingElement.sourceCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Open "Buat dari Video" dialog
  const handleOpenCreateModal = () => {
    if (availableTimelineClips.length > 0) {
      const first = availableTimelineClips[0];
      setSelectedClipId(first.clip.id);
      setNewComponentName(first.clip.name || 'Judul Estetik Baru');
    } else {
      setSelectedClipId('sample');
      setNewComponentName('Komponen Video Baru');
    }
    setNewComponentCategory('Animated Typography');
    setNewComponentDesc('Elemen reusable yang disimpan dari susunan video aktif.');
    setShowCreateFromVideo(true);
  };

  // Save new user element from selected video clip
  const handleSaveComponentFromVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const clipData = availableTimelineClips.find((c) => c.clip.id === selectedClipId)?.clip || {
      id: `clip-fallback-${Date.now()}`,
      name: newComponentName,
      from: 0,
      duration: 90,
      props: {
        text: newComponentName,
        color: '#FFFFFF',
        backgroundColor: '#E50914',
        fontSize: 54,
        animation: 'zoom',
      },
    };

    const newElement = createUserElementFromClip(
      clipData,
      newComponentName.trim() || 'Komponen Kustom',
      newComponentCategory,
      newComponentDesc
    );

    saveUserElement(newElement);
    refreshElements();
    setShowCreateFromVideo(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-[#0a0a0d] text-[#f2f2f3] select-none relative">
      {/* 1. Header Toolbar: Search + Action Button + Category Chips (Zero Border) */}
      <div className="shrink-0 p-3.5 space-y-3 bg-gradient-to-b from-[#14141c] to-[#0e0e13] shadow-md">
        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari elemen visual (title, chart, lower third, subtitle...)"
              className="w-full bg-[#1c1c24] text-sm text-white placeholder-zinc-500 rounded-full pl-10 pr-4 py-2 outline-none shadow-inner transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-xs text-zinc-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Add Component From Video Button */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="tap px-3.5 py-2 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-red-950/60 transition-all shrink-0 active:scale-95"
            title="Simpan klip atau elemen dari video yang sedang dibuat sebagai komponen baru"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tambah dari Video</span>
            <span className="sm:hidden">+ Dari Video</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const count =
              cat.id === 'all'
                ? elementsList.length
                : cat.id === 'Komponen Pengguna'
                ? userComponentsCount
                : elementsList.filter((e) => e.category === cat.id).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`tap px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? cat.id === 'Komponen Pengguna'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-950/60'
                      : 'bg-red-600 text-white shadow-md shadow-red-950/50'
                    : 'bg-zinc-850/80 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{cat.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-black/30 text-white'
                        : cat.id === 'Komponen Pengguna'
                        ? 'bg-amber-500/20 text-amber-300 font-bold'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Direct Live Interactive Preview Cards Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3">
        <div className="flex items-center justify-between px-1 text-xs text-zinc-400 font-medium">
          <span>Koleksi Komponen ({filteredElements.length})</span>
          <span className="font-mono text-[11px] text-zinc-500">Live Remotion Previews</span>
        </div>

        {filteredElements.length === 0 ? (
          <div className="py-12 px-4 flex flex-col items-center text-center space-y-4 max-w-sm mx-auto bg-gradient-to-b from-[#161620] to-[#101014] rounded-3xl p-6 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/10 flex items-center justify-center text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                {selectedCategory === 'Komponen Pengguna'
                  ? 'Belum Ada Komponen Sendiri'
                  : 'Tidak Ada Komponen Ditemukan'}
              </h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {selectedCategory === 'Komponen Pengguna'
                  ? 'Simpan klip teks, judul, atau grafik dari video aktif Anda menjadi komponen reusable melalui menu Render Studio atau tombol "+ Dari Video" di atas.'
                  : 'Coba gunakan kata kunci pencarian yang berbeda atau pilih kategori Semua.'}
              </p>
            </div>
            {selectedCategory === 'Komponen Pengguna' && (
              <div className="flex items-center gap-2 pt-2">
                {onOpenRender && (
                  <button
                    type="button"
                    onClick={onOpenRender}
                    className="tap px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-red-950/60"
                  >
                    Buka Render Studio
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="tap px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold transition-all"
                >
                  + Tambah Sekarang
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredElements.map((el) => (
              <ElementCard
                key={el.slug}
                element={el}
                isInstalled={installedSet.has(el.slug)}
                onInstall={handleInstall}
                onInsert={(element) => handleInsert(element)}
                onCustomize={handleOpenCustomize}
                onDelete={handleDeleteUserElement}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Modal: "+ Tambah Komponen Baru dari Video Aktif" */}
      {showCreateFromVideo && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#16161e] rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-red-600/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-red-400" />
                </div>
                <h3 className="text-base font-bold text-white">Simpan Elemen dari Video</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateFromVideo(false)}
                className="tap w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Jadikan klip dari susunan video aktif sebagai komponen reusable yang bisa dipasang dan dipakai berulang kali.
            </p>

            <form onSubmit={handleSaveComponentFromVideo} className="space-y-3.5">
              {/* Select Clip From Video */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Pilih Klip dari Video Aktif</label>
                {availableTimelineClips.length > 0 ? (
                  <select
                    value={selectedClipId}
                    onChange={(e) => {
                      setSelectedClipId(e.target.value);
                      const chosen = availableTimelineClips.find((c) => c.clip.id === e.target.value);
                      if (chosen) {
                        setNewComponentName(chosen.clip.name);
                      }
                    }}
                    className="w-full bg-[#20202c] text-xs text-white px-3.5 py-2.5 rounded-2xl outline-none"
                  >
                    {availableTimelineClips.map(({ layerName, clip }) => (
                      <option key={clip.id} value={clip.id}>
                        {layerName} : {clip.name} ({clip.duration} frames)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2.5 rounded-2xl bg-zinc-800/60 text-xs text-zinc-400">
                    Belum ada klip di timeline. Sistem akan membuat preset komponen baru dari pengaturan video.
                  </div>
                )}
              </div>

              {/* Component Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Nama Komponen</label>
                <input
                  type="text"
                  required
                  value={newComponentName}
                  onChange={(e) => setNewComponentName(e.target.value)}
                  placeholder="Misal: Viral Hook Typography"
                  className="w-full bg-[#20202c] text-xs text-white px-3.5 py-2.5 rounded-2xl outline-none"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Kategori</label>
                <select
                  value={newComponentCategory}
                  onChange={(e) => setNewComponentCategory(e.target.value as ElementCategory)}
                  className="w-full bg-[#20202c] text-xs text-white px-3.5 py-2.5 rounded-2xl outline-none"
                >
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={newComponentDesc}
                  onChange={(e) => setNewComponentDesc(e.target.value)}
                  placeholder="Keterangan fungsi elemen ini..."
                  className="w-full bg-[#20202c] text-xs text-white px-3.5 py-2 rounded-2xl outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateFromVideo(false)}
                  className="tap flex-1 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="tap flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950/60 active:scale-95"
                >
                  Simpan ke Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Detailed Customization & TSX Code Modal Drawer (When tapping Kustomisasi) */}
      {customizingElement && (
        <div className="absolute inset-0 z-50 bg-[#0d0d12] flex flex-col animate-in fade-in slide-in-from-bottom duration-200">
          {/* Top Header */}
          <div className="h-12 px-4 bg-[#14141c] shadow-xs flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => setCustomizingElement(null)}
              className="tap flex items-center gap-1.5 text-xs font-bold text-zinc-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Katalog</span>
            </button>

            <span className="text-xs font-bold text-white truncate max-w-[180px]">
              {customizingElement.displayName}
            </span>

            <button
              type="button"
              onClick={() => setShowCodeView((prev) => !prev)}
              className={`tap px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                showCodeView
                  ? 'bg-zinc-200 text-black shadow-md'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showCodeView ? 'Props' : 'Kode TSX'}</span>
            </button>
          </div>

          {/* Large Live Remotion Player */}
          <div className="shrink-0 h-[210px] sm:h-[250px] bg-black relative flex items-center justify-center overflow-hidden shadow-md">
            <Player
              ref={modalPlayerRef}
              component={customizingElement.component}
              inputProps={customProps}
              durationInFrames={customizingElement.durationInFrames}
              fps={customizingElement.fps}
              compositionWidth={customizingElement.dimensions.width}
              compositionHeight={customizingElement.dimensions.height}
              style={{
                width: '100%',
                height: '100%',
                maxHeight: '100%',
              }}
              controls={false}
              autoPlay={true}
              loop
            />

            {/* Floating Player Controls */}
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2 z-20 pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  const p = modalPlayerRef.current;
                  if (!p) return;
                  if (isModalPlaying) {
                    p.pause();
                    setIsModalPlaying(false);
                  } else {
                    p.play();
                    setIsModalPlaying(true);
                  }
                }}
                className="tap px-3 py-1.5 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center gap-1.5 text-xs font-semibold shadow-lg backdrop-blur-md"
              >
                {isModalPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                <span>{isModalPlaying ? 'Jeda' : 'Putar'}</span>
              </button>

              <button
                type="button"
                onClick={() => modalPlayerRef.current?.seekTo(0)}
                className="tap w-7 h-7 rounded-full bg-black/75 hover:bg-black text-zinc-300 hover:text-white flex items-center justify-center backdrop-blur-md shadow-md"
                title="Ulangi dari awal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom Edit Area: Live Props Editor or TSX Code View */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            {showCodeView ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-mono">{customizingElement.slug}.element.tsx</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="tap flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-semibold transition-all shadow-xs"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Disalin!' : 'Salin Kode'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-black/90 rounded-2xl text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed max-h-[220px] shadow-inner">
                  {customizingElement.sourceCode}
                </pre>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-red-400" />
                    <span>Ubah Nilai Props (Live Update)</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">Remotion Reactive</span>
                </div>

                <div className="space-y-2.5 bg-[#14141a] p-3 rounded-2xl shadow-sm">
                  {customizingElement.propsSchema.map((field) => (
                    <div key={field.name} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-zinc-300">{field.label}</span>
                        {field.type === 'number' && (
                          <span className="font-mono text-zinc-400">{customProps[field.name]}</span>
                        )}
                      </div>

                      {field.type === 'text' && (
                        <input
                          type="text"
                          value={customProps[field.name] || ''}
                          onChange={(e) => handlePropChange(field.name, e.target.value)}
                          className="w-full bg-[#1e1e28] text-xs text-white px-3 py-1.5 rounded-xl outline-none"
                        />
                      )}

                      {field.type === 'number' && (
                        <input
                          type="range"
                          min={field.min ?? 0}
                          max={field.max ?? 100}
                          step={field.step ?? 1}
                          value={customProps[field.name] ?? field.defaultValue}
                          onChange={(e) => handlePropChange(field.name, Number(e.target.value))}
                          className="w-full accent-red-500 cursor-pointer"
                        />
                      )}

                      {field.type === 'color' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customProps[field.name] || '#ffffff'}
                            onChange={(e) => handlePropChange(field.name, e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent outline-none"
                          />
                          <input
                            type="text"
                            value={customProps[field.name] || ''}
                            onChange={(e) => handlePropChange(field.name, e.target.value)}
                            className="flex-1 bg-[#1e1e28] text-xs font-mono text-white px-3 py-1.5 rounded-xl outline-none"
                          />
                        </div>
                      )}

                      {field.type === 'select' && (
                        <select
                          value={customProps[field.name] || field.defaultValue}
                          onChange={(e) => handlePropChange(field.name, e.target.value)}
                          className="w-full bg-[#1e1e28] text-xs text-white px-3 py-1.5 rounded-xl outline-none"
                        >
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  handleInsert(customizingElement, customProps);
                  setCustomizingElement(null);
                }}
                className="tap w-full sm:flex-1 py-2.5 px-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-950/60 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambahkan ke Timeline</span>
              </button>

              <button
                type="button"
                onClick={() => handleInstall(customizingElement)}
                className={`tap w-full sm:w-auto py-2.5 px-4 rounded-full font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                  installedSet.has(customizingElement.slug)
                    ? 'bg-emerald-950/40 text-emerald-300'
                    : 'bg-zinc-850 hover:bg-zinc-800 text-white shadow-xs'
                }`}
              >
                {installedSet.has(customizingElement.slug) ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Terpasang di Proyek</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Pasang ke Proyek</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
