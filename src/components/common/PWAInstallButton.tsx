import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-md shadow-blue-600/25 active:scale-95 transition-all ${
          compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3.5 py-2 text-xs'
        }`}
        title="Instalar Kinetix como App en tu celular o computadora"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className={compact ? 'hidden sm:inline' : ''}>Instalar App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-blue-500/40 text-blue-300 font-semibold transition-all active:scale-95 ${
            compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3.5 py-2 text-xs'
          }`}
          title="Instalar Kinetix en iPhone o iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className={compact ? 'hidden sm:inline' : ''}>Instalar iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white font-brand">Instalar Kinetix en iPhone / iPad</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <Share className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    1. Toca el botón <strong>Compartir</strong> en la barra inferior/superior de Safari.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <PlusSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    2. Desliza hacia abajo y elige <strong>Agregar a inicio</strong> (Add to Home Screen) para recibir alertas y abrirla como app.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
