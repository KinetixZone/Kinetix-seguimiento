import React, { useState } from 'react';
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
  Plus
} from 'lucide-react';

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

  // Sample private photos stored for demo
  const [photosData, setPhotosData] = useState([
    {
      monthLabel: 'Enero 2024 (Inicio)',
      date: '2024-01-15',
      weight: 77.0,
      bodyFat: 14.5,
      muscle: 43.8,
      frontUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80',
      sideUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
      backUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    },
    {
      monthLabel: 'Marzo 2024 (Actual)',
      date: '2024-03-20',
      weight: 75.0,
      bodyFat: 12.0,
      muscle: 45.0,
      frontUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
      sideUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80',
      backUrl: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=600&q=80',
    }
  ]);

  const initialMonth = photosData[0];
  const currentMonth = photosData[photosData.length - 1];

  const handleSimulateUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
      setShowUploadModal(false);
    }, 1500);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Privacy Guarantee Banner */}
      <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-blue-500/30 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white flex items-center gap-1.5 font-brand text-xs">
              <span>Álbum de Fotos 100% Privado</span>
              <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded font-mono">Solo para ti</span>
            </h4>
            <button
              onClick={() => setIsPhotoHidden(!isPhotoHidden)}
              className="text-neutral-400 hover:text-white flex items-center gap-1 text-[11px]"
              title="Ocultar fotos en pantalla"
            >
              {isPhotoHidden ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{isPhotoHidden ? 'Mostrar' : 'Ocultar'}</span>
            </button>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Estas fotografías son exclusivamente para tu control personal. Nadie más tiene acceso. 
            Te permiten ver tu cambio corporal real mes a mes.
          </p>
        </div>
      </div>

      {/* Angle Selector Tabs */}
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
          onClick={() => setShowUploadModal(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Subir Foto</span>
        </button>
      </div>

      {/* Comparison Grid: Antes vs Después */}
      <div className="grid grid-cols-2 gap-3">
        {/* Before Card */}
        <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-neutral-300">Antes (Enero)</span>
            <span className="text-[10px] text-neutral-500 font-mono">15 Ene 2024</span>
          </div>

          <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center">
            {isPhotoHidden ? (
              <div className="text-center p-4 text-neutral-500 space-y-1">
                <EyeOff className="w-6 h-6 mx-auto opacity-50" />
                <span className="text-[10px]">Oculta por privacidad</span>
              </div>
            ) : (
              <img
                src={
                  selectedAngle === 'front' ? initialMonth.frontUrl :
                  selectedAngle === 'side' ? initialMonth.sideUrl : initialMonth.backUrl
                }
                alt="Foto progreso antes"
                className="w-full h-full object-cover"
              />
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
            <span className="font-bold text-blue-400">Actual (Marzo)</span>
            <span className="text-[10px] text-neutral-400 font-mono">20 Mar 2024</span>
          </div>

          <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center">
            {isPhotoHidden ? (
              <div className="text-center p-4 text-neutral-500 space-y-1">
                <EyeOff className="w-6 h-6 mx-auto opacity-50" />
                <span className="text-[10px]">Oculta por privacidad</span>
              </div>
            ) : (
              <img
                src={
                  selectedAngle === 'front' ? currentMonth.frontUrl :
                  selectedAngle === 'side' ? currentMonth.sideUrl : currentMonth.backUrl
                }
                alt="Foto progreso actual"
                className="w-full h-full object-cover"
              />
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
          <span className="font-semibold text-white">Evolución en 60 días:</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="text-emerald-400">-2.5% Grasa</span>
          <span className="text-blue-400">+1.2% Músculo</span>
        </div>
      </div>

      {/* Modal Upload Simulation */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white font-brand">Subir Foto de Progreso Mensual</h3>
            <p className="text-[11px] text-neutral-400">
              Esta foto se guarda exclusivamente en tu perfil privado.
            </p>

            {uploadSuccess ? (
              <div className="p-4 text-center text-emerald-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto animate-bounce" />
                <div className="font-bold">¡Foto guardada en tu álbum privado!</div>
              </div>
            ) : (
              <form onSubmit={handleSimulateUpload} className="space-y-3">
                <div>
                  <label className="text-neutral-300 block mb-1">Ángulo de la Foto</label>
                  <select className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-white">
                    <option value="front">Frontal</option>
                    <option value="side">Perfil Lateral</option>
                    <option value="back">Espalda</option>
                  </select>
                </div>

                <div className="border-2 border-dashed border-neutral-800 rounded-2xl p-6 text-center text-neutral-400 space-y-2 hover:border-blue-500 transition-colors cursor-pointer">
                  <Camera className="w-6 h-6 mx-auto text-blue-400" />
                  <span className="block text-[11px]">Selecciona o toma una foto desde tu cámara</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
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
