import React from 'react';
import { FileText, Smartphone, LayoutDashboard, Printer, Download, Bell, Globe } from 'lucide-react';
import { BrandTheme } from '../types';

interface NavigationHeaderProps {
  viewMode: 'web' | 'simulator' | 'spec' | 'split';
  setViewMode: (mode: 'web' | 'simulator' | 'spec' | 'split') => void;
  brandTheme: BrandTheme;
  setBrandTheme: (theme: BrandTheme) => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onPrint: () => void;
  onExportMarkdown: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  viewMode,
  setViewMode,
  brandTheme,
  setBrandTheme,
  unreadNotificationsCount,
  onOpenNotifications,
  onPrint,
  onExportMarkdown,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/80 px-4 md:px-8 py-3 transition-colors no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark with Kinetix Blue & Red Official Identity */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2.5 group">
            {/* Dual Color Brand Badge: Blue with Red Flame Accent */}
            <div className="relative w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm tracking-tighter shadow-md shadow-blue-500/30 overflow-hidden">
              <span className="relative z-10 font-brand">KZ</span>
              <div className="absolute -right-2 -bottom-2 w-5 h-5 bg-red-600 rounded-full" />
            </div>
            
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-bold tracking-tight text-white font-brand">
                KINETIX <span className="font-light text-blue-500">Functional</span> <span className="font-bold text-red-500">Zone</span>
              </span>
            </div>
          </a>
        </div>

        {/* Zone 2: View Mode Switcher (Web App vs Mobile Simulator vs Tech Spec) */}
        <div className="flex items-center gap-2">
          <nav className="flex items-center bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setViewMode('web')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                viewMode === 'web'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Plataforma Web</span>
            </button>

            <button
              onClick={() => setViewMode('simulator')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                viewMode === 'simulator'
                  ? 'bg-neutral-800 text-white font-semibold shadow-sm border border-neutral-700/50'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-400" />
              <span>Simulador Celular</span>
            </button>

            <button
              onClick={() => setViewMode('spec')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                viewMode === 'spec'
                  ? 'bg-neutral-800 text-white font-semibold shadow-sm border border-neutral-700/50'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-red-400" />
              <span>Especificación</span>
            </button>
          </nav>
        </div>

        {/* Zone 3: Notification Bell & Export Actions */}
        <div className="flex items-center gap-2">
          {/* In-Page Notification Bell with Counter */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition-colors"
            title="Centro de notificaciones en la página"
          >
            <Bell className="w-4 h-4 text-blue-400" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <button
            onClick={onExportMarkdown}
            title="Descargar especificación técnica en Markdown"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>.MD</span>
          </button>

          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-md shadow-blue-500/25 whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};
