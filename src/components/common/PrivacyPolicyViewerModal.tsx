import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Printer, 
  CheckCircle2, 
  Calendar, 
  Mail, 
  MapPin, 
  Download,
  ExternalLink,
  Lock,
  X
} from 'lucide-react';
import { UserProfile, PrivacyConsentRecord } from '../../types';
import { 
  OFFICIAL_PRIVACY_NOTICE_DOCUMENT, 
  CURRENT_PRIVACY_NOTICE_VERSION 
} from '../../data/privacyNoticeContent';

interface PrivacyPolicyViewerModalProps {
  currentUser: UserProfile;
  consentRecord?: PrivacyConsentRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyViewerModal: React.FC<PrivacyPolicyViewerModalProps> = ({
  currentUser,
  consentRecord,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrintPhysicalForm = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header (No print header) */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950/70 via-neutral-900 to-red-950/40 border-b border-neutral-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold block">
                Legal y Privacidad · LFPDPPP
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white font-brand">
                Aviso de Privacidad Integral
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPhysicalForm}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 border border-neutral-700 transition-all active:scale-95 shadow-sm"
              title="Imprimir versión con formato físico de firma"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Imprimir / Formato Físico</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-xs text-neutral-300 leading-relaxed print:text-black print:bg-white print:p-0">
          {/* Header Metadata Pill */}
          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800/80 space-y-2 font-mono text-[11px] print:border print:border-black print:bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 print:border-gray-300 pb-2">
              <span className="font-bold text-white print:text-black">KINETIX FUNCTIONAL ZONE</span>
              <span className="text-blue-400 print:text-black">Versión Oficial: {OFFICIAL_PRIVACY_NOTICE_DOCUMENT.version}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-400 print:text-black">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span>{OFFICIAL_PRIVACY_NOTICE_DOCUMENT.responsibleAddress}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span>Ejercicio ARCO: {OFFICIAL_PRIVACY_NOTICE_DOCUMENT.contactEmail}</span>
              </div>
            </div>
            <div className="text-[10px] text-neutral-500 print:text-gray-600">
              Vigencia y última actualización: {OFFICIAL_PRIVACY_NOTICE_DOCUMENT.effectiveDate}
            </div>
          </div>

          {/* Full Markdown Text */}
          <div className="whitespace-pre-line text-xs font-sans text-neutral-200 print:text-black space-y-4">
            {OFFICIAL_PRIVACY_NOTICE_DOCUMENT.fullMarkdown}
          </div>

          {/* SECTION 5: EVIDENCIA DE CONSENTIMIENTO ELECTRÓNICO (Vinculada a cuenta autenticada) */}
          <div className="no-print pt-4 border-t border-neutral-800 space-y-3">
            <h4 className="text-sm font-bold text-white font-brand flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Constancia de Consentimiento Electrónico</span>
            </h4>

            {consentRecord ? (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 space-y-2.5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>✓ Aviso de Privacidad conocido y aceptado</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>✓ Consentimiento otorgado para el tratamiento de datos personales sensibles</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-emerald-900/40 text-[11px] font-mono text-neutral-300">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Fecha y hora de aceptación:</span>
                    <strong className="text-white">
                      {new Date(consentRecord.accepted_at).toLocaleString('es-MX', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Versión aceptada:</span>
                    <strong className="text-blue-400">{consentRecord.privacy_notice_version}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">ID de Consentimiento:</span>
                    <span className="text-neutral-400 truncate block">{consentRecord.consent_id}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Mecanismo de manifestación:</span>
                    <span className="text-neutral-300">{consentRecord.consent_method}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/50 text-amber-200 text-xs">
                Este perfil aún no cuenta con un registro histórico de consentimiento guardado.
              </div>
            )}
          </div>

          {/* PHYSICAL PRINT VERSION SIGNATURE BLOCK (Visible only on print or export) */}
          <div className="hidden print:block pt-8 border-t-2 border-black space-y-6">
            <h4 className="font-bold text-sm uppercase text-black">
              CONSENTIMIENTO POR ESCRITO (FORMATO IMPRESO)
            </h4>
            <p className="text-xs leading-relaxed text-black">
              Manifiesto que he leído y conozco el contenido del presente Aviso de Privacidad Integral y que he sido informado sobre el tratamiento y las finalidades de mis datos personales.
            </p>
            <p className="text-xs leading-relaxed text-black">
              Asimismo, otorgo expresamente mi consentimiento para el tratamiento de mis datos personales sensibles para las finalidades señaladas en el presente Aviso de Privacidad.
            </p>
            <div className="pt-6 space-y-6 text-xs text-black">
              <div>
                <span>Nombre completo del titular: ____________________________________________________</span>
              </div>
              <div>
                <span>Firma autógrafa del titular: _____________________________________________________</span>
              </div>
              <div>
                <span>Fecha: __________________________________________________________________________</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer (No print) */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between no-print">
          <span className="text-[10px] text-neutral-500 font-mono">
            Kinetix Progress · Versión {CURRENT_PRIVACY_NOTICE_VERSION}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
