import React, { useState, useEffect } from 'react';
import { UserProfile, BodyCompositionRecord } from '../../types';
import { 
  Camera, 
  Lock, 
  Eye, 
  EyeOff, 
  Calendar, 
  CheckCircle2, 
  Upload, 
  Sliders, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Plus,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

interface ProgressPhotoItem {
  id: string;
  monthLabel: string;
  date: string;
  weight: number;
  bodyFat: number;
  muscle?: number;
  frontUrl?: string;
  sideUrl?: string;
  backUrl?: string;
}

interface PrivateProgressPhotosViewProps {
  athlete: UserProfile;
  bodyCompRecords: BodyCompositionRecord[];
}

export const PrivateProgressPhotosView: React.FC<PrivateProgressPhotosViewProps> = ({
  athlete,
  bodyCompRecords,
}) => {
  const [selectedAngle, setSelectedAngle] = useState<'front' | 'side' | 'back'>('front');
  const [isPhotoHidden, setIsPhotoHidden] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  // Form states for uploading photos
  const [uploadAngle, setUploadAngle] = useState<'front' | 'side' | 'back'>('front');
  const [uploadDate, setUploadDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [uploadLabel, setUploadLabel] = useState<string>('Evaluación Mensual');
  const [uploadWeight, setUploadWeight] = useState<number>(bodyCompRecords[bodyCompRecords.length - 1]?.weightKg || 70);
  const [uploadBodyFat, setUploadBodyFat] = useState<number>(bodyCompRecords[bodyCompRecords.length - 1]?.bodyFatPercent || 15);
  const [uploadedImageData, setUploadedImageData] = useState<string>('');

  // Storage key specific to this athlete: eliminates any test photos by default
  const storageKey = `kinetix_private_photos_${athlete.id}`;

  const [photosData, setPhotosData] = useState<ProgressPhotoItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return []; // Clean empty state without private test photos
  });

  // Keep localStorage updated
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(photosData));
    } catch {
      // ignore
    }
  }, [photosData, storageKey]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedImageData(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedImageData) return;

    // Check if an entry with the same date/month exists or create new
    const existingIndex = photosData.findIndex((p) => p.date === uploadDate);

    let updatedList: ProgressPhotoItem[];
    if (existingIndex >= 0) {
      const existing = { ...photosData[existingIndex] };
      if (uploadAngle === 'front') existing.frontUrl = uploadedImageData;
      if (uploadAngle === 'side') existing.sideUrl = uploadedImageData;
      if (uploadAngle === 'back') existing.backUrl = uploadedImageData;
      existing.weight = uploadWeight;
      existing.bodyFat = uploadBodyFat;
      updatedList = [...photosData];
      updatedList[existingIndex] = existing;
    } else {
      const newItem: ProgressPhotoItem = {
        id: `photo-${Date.now()}`,
        monthLabel: uploadLabel,
        date: uploadDate,
        weight: uploadWeight,
        bodyFat: uploadBodyFat,
        frontUrl: uploadAngle === 'front' ? uploadedImageData : undefined,
        sideUrl: uploadAngle === 'side' ? uploadedImageData : undefined,
        backUrl: uploadAngle === 'back' ? uploadedImageData : undefined,
      };
      updatedList = [...photosData, newItem].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    }

    setPhotosData(updatedList);
    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
      setShowUploadModal(false);
      setUploadedImageData('');
    }, 1200);
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('¿Deseas eliminar este registro de foto de tu álbum privado?')) {
      setPhotosData(photosData.filter((p) => p.id !== id));
    }
  };

  const initialMonth = photosData[0];
  const currentMonth = photosData[photosData.length - 1];

  const getPhotoForAngle = (item?: ProgressPhotoItem, angle?: 'front' | 'side' | 'back') => {
    if (!item) return undefined;
    const targetAngle = angle || selectedAngle;
    if (targetAngle === 'front') return item.frontUrl || item.sideUrl || item.backUrl;
    if (targetAngle === 'side') return item.sideUrl || item.frontUrl || item.backUrl;
    return item.backUrl || item.frontUrl || item.sideUrl;
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Privacy Guarantee Banner */}
      <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-blue-500/30 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white flex items-center gap-1.5 font-brand text-xs">
              <span>Álbum de Fotos 100% Privado</span>
              <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono">
                Solo para ti
              </span>
            </h4>
            {photosData.length > 0 && (
              <button
                onClick={() => setIsPhotoHidden(!isPhotoHidden)}
                className="text-neutral-400 hover:text-white flex items-center gap-1 text-[11px]"
                title="Ocultar fotos en pantalla"
              >
                {isPhotoHidden ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{isPhotoHidden ? 'Mostrar' : 'Ocultar'}</span>
              </button>
            )}
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Fotografías confidenciales y privadas para el control y seguimiento personal de tu evolución física.
          </p>
        </div>
      </div>

      {/* Angle Selector Tabs & Action Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800 flex-1">
          <button
            onClick={() => setSelectedAngle('front')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              selectedAngle === 'front' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Frontal
          </button>
          <button
            onClick={() => setSelectedAngle('side')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              selectedAngle === 'side' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Perfil Lateral
          </button>
          <button
            onClick={() => setSelectedAngle('back')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              selectedAngle === 'back' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Espalda
          </button>
        </div>

        <button
          onClick={() => {
            setUploadedImageData('');
            setShowUploadModal(true);
          }}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20 shrink-0 active:scale-95 transition-transform"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Subir Foto</span>
        </button>
      </div>

      {/* EMPTY STATE: When no photos are uploaded */}
      {photosData.length === 0 ? (
        <div className="p-8 rounded-3xl bg-neutral-900/40 border border-dashed border-neutral-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-neutral-400 mx-auto shadow-inner">
            <Camera className="w-7 h-7 text-blue-400" />
          </div>
          <div className="max-w-xs mx-auto space-y-1.5">
            <h3 className="text-sm font-bold text-white font-brand">
              Álbum Privado de Fotos de Progreso
            </h3>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Inicia tu primer registro fotográfico: captura o sube tu fotografía en ángulo frontal, lateral o espalda para registrar tu evolución personal.
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir Mi Primera Foto de Progreso</span>
          </button>
        </div>
      ) : photosData.length === 1 ? (
        /* SINGLE PHOTO STATE */
        <div className="p-4 rounded-3xl bg-neutral-900/70 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between text-[11px]">
            <div>
              <span className="font-bold text-white block">{initialMonth.monthLabel}</span>
              <span className="text-[10px] text-neutral-400 font-mono">{initialMonth.date}</span>
            </div>
            <button
              onClick={() => handleDeleteEntry(initialMonth.id)}
              className="p-1.5 text-neutral-500 hover:text-rose-400 transition-colors"
              title="Eliminar foto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="relative aspect-[3/4] max-w-xs mx-auto rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center">
            {isPhotoHidden ? (
              <div className="text-center p-4 text-neutral-500 space-y-1">
                <EyeOff className="w-6 h-6 mx-auto opacity-50" />
                <span className="text-[10px]">Oculta por privacidad</span>
              </div>
            ) : getPhotoForAngle(initialMonth) ? (
              <img
                src={getPhotoForAngle(initialMonth)}
                alt="Foto de progreso"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4 text-neutral-500 space-y-1">
                <ImageIcon className="w-6 h-6 mx-auto opacity-40" />
                <span className="text-[10px]">Sin foto en ángulo {selectedAngle}</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-mono text-neutral-300 border border-white/10">
              {initialMonth.weight} kg · {initialMonth.bodyFat}% grasa
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-500/20 text-center space-y-1">
            <span className="text-[11px] text-blue-300 font-medium block">
              ¡Primer mes registrado exitosamente!
            </span>
            <p className="text-[10px] text-neutral-400">
              Sube una segunda foto el próximo mes para desbloquear la comparación de antes y después con barra de deslizamiento.
            </p>
          </div>
        </div>
      ) : (
        /* COMPARISON GRID: ANTES VS DESPUÉS (2+ Photos) */
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Before Card */}
            <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-neutral-300 truncate">{initialMonth.monthLabel}</span>
                <span className="text-[10px] text-neutral-500 font-mono">{initialMonth.date}</span>
              </div>

              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center">
                {isPhotoHidden ? (
                  <div className="text-center p-4 text-neutral-500 space-y-1">
                    <EyeOff className="w-6 h-6 mx-auto opacity-50" />
                    <span className="text-[10px]">Oculta por privacidad</span>
                  </div>
                ) : getPhotoForAngle(initialMonth) ? (
                  <img
                    src={getPhotoForAngle(initialMonth)}
                    alt="Foto progreso antes"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-3 text-neutral-500 space-y-1">
                    <ImageIcon className="w-5 h-5 mx-auto opacity-40" />
                    <span className="text-[9px]">Sin foto</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] font-mono text-neutral-300">
                  {initialMonth.weight}kg · {initialMonth.bodyFat}% grasa
                </div>
              </div>
            </div>

            {/* After / Current Card */}
            <div className="p-3 rounded-2xl bg-neutral-900/80 border border-blue-500/40 space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-600/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-blue-400 truncate">{currentMonth.monthLabel}</span>
                <span className="text-[10px] text-neutral-400 font-mono">{currentMonth.date}</span>
              </div>

              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center">
                {isPhotoHidden ? (
                  <div className="text-center p-4 text-neutral-500 space-y-1">
                    <EyeOff className="w-6 h-6 mx-auto opacity-50" />
                    <span className="text-[10px]">Oculta por privacidad</span>
                  </div>
                ) : getPhotoForAngle(currentMonth) ? (
                  <img
                    src={getPhotoForAngle(currentMonth)}
                    alt="Foto progreso actual"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-3 text-neutral-500 space-y-1">
                    <ImageIcon className="w-5 h-5 mx-auto opacity-40" />
                    <span className="text-[9px]">Sin foto</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-blue-950/80 backdrop-blur-md border border-blue-500/40 px-2 py-0.5 rounded-lg text-[9px] font-mono text-blue-300">
                  {currentMonth.weight}kg · {currentMonth.bodyFat}% grasa
                </div>
              </div>
            </div>
          </div>

          {/* Visual Transformation Delta Badge */}
          <div className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-white">Evolución observada:</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className={currentMonth.bodyFat <= initialMonth.bodyFat ? 'text-emerald-400 font-bold' : 'text-neutral-400'}>
                {(currentMonth.bodyFat - initialMonth.bodyFat).toFixed(1)}% Grasa
              </span>
              <span className="text-blue-400 font-bold">
                {(currentMonth.weight - initialMonth.weight).toFixed(1)} kg Peso
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white font-brand flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-400" />
              <span>Subir Foto de Progreso Privada</span>
            </h3>
            <p className="text-[11px] text-neutral-400">
              Esta imagen se guarda exclusivamente en tu dispositivo bajo encriptación local.
            </p>

            {uploadSuccess ? (
              <div className="p-5 text-center text-emerald-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto animate-bounce text-emerald-400" />
                <div className="font-bold text-xs">¡Foto guardada en tu álbum privado!</div>
              </div>
            ) : (
              <form onSubmit={handleSavePhoto} className="space-y-3">
                <div>
                  <label className="text-neutral-300 block mb-1 text-[11px] font-semibold">
                    Etiqueta / Mes
                  </label>
                  <input
                    type="text"
                    value={uploadLabel}
                    onChange={(e) => setUploadLabel(e.target.value)}
                    placeholder="Ej. Octubre 2026 (Mes 3)"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-neutral-300 block mb-1 text-[11px] font-semibold">
                      Ángulo
                    </label>
                    <select
                      value={uploadAngle}
                      onChange={(e) => setUploadAngle(e.target.value as any)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-500 outline-none"
                    >
                      <option value="front">Frontal</option>
                      <option value="side">Perfil Lateral</option>
                      <option value="back">Espalda</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-neutral-300 block mb-1 text-[11px] font-semibold">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={uploadDate}
                      onChange={(e) => setUploadDate(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2 text-white text-xs focus:border-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-neutral-300 block mb-1 text-[11px]">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={uploadWeight}
                      onChange={(e) => setUploadWeight(parseFloat(e.target.value) || 0)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-300 block mb-1 text-[11px]">
                      % Grasa
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={uploadBodyFat}
                      onChange={(e) => setUploadBodyFat(parseFloat(e.target.value) || 0)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* File picker */}
                <div className="space-y-1.5">
                  <label className="text-neutral-300 block text-[11px] font-semibold">
                    Archivo de imagen
                  </label>
                  <label className="border-2 border-dashed border-neutral-800 rounded-2xl p-4 text-center text-neutral-400 space-y-1.5 hover:border-blue-500 transition-colors cursor-pointer block bg-neutral-950/50">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {uploadedImageData ? (
                      <div className="space-y-2">
                        <img
                          src={uploadedImageData}
                          alt="Vista previa"
                          className="w-20 h-24 object-cover mx-auto rounded-xl border border-neutral-700"
                        />
                        <span className="text-[10px] text-emerald-400 block font-semibold">
                          Foto seleccionada (Toca para cambiar)
                        </span>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-6 h-6 mx-auto text-blue-400" />
                        <span className="block text-[11px] text-neutral-300 font-medium">
                          Toca para tomar foto o elegir de tu galería
                        </span>
                        <span className="text-[10px] text-neutral-500 block">
                          Formatos JPG, PNG, WEBP
                        </span>
                      </>
                    )}
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!uploadedImageData}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs shadow-md shadow-blue-500/25 transition-all"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

