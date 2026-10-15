import React from 'react';
import { 
  ShieldCheck, 
  Printer, 
  CheckCircle2, 
  MapPin, 
  Mail, 
  X,
  FileText
} from 'lucide-react';
import { UserProfile, PrivacyConsentRecord } from '../../types';
import { 
  OFFICIAL_PRIVACY_NOTICE_DOCUMENT, 
  CURRENT_PRIVACY_NOTICE_VERSION 
} from '../../data/privacyNoticeContent';

interface PrivacyPolicyViewerModalProps {
  currentUser: UserProfile;
  consentRecord?: PrivacyConsentRecord | null;
  gymLogoUrl?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyViewerModal: React.FC<PrivacyPolicyViewerModalProps> = ({
  currentUser,
  consentRecord,
  gymLogoUrl,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="privacy-policy-overlay fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in print:p-0 print:bg-white print:static print:inset-auto print:block print:overflow-visible">
      {/* Print styles injection to guarantee the whole document prints multi-page without getting cropped or abruptly cut */}
      <style>{`
        @media print {
          @page {
            margin: 12mm 15mm;
            size: letter portrait;
          }
          html, body {
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #111827 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .privacy-policy-overlay {
            display: block !important;
            position: static !important;
            inset: auto !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
          }
          #kinetix-printable-privacy {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #111827 !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .no-print-area {
            display: none !important;
          }
          .print-scroll-container {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            display: block !important;
            padding: 0 !important;
          }
          .print-section {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 12pt !important;
          }
          p, li {
            orphans: 3 !important;
            widows: 3 !important;
          }
          h1, h2, h3, h4 {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }
        }
      `}</style>

      <div 
        id="kinetix-printable-privacy"
        className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden print:max-h-none print:overflow-visible print:border-none print:shadow-none print:bg-white print:block"
      >
        {/* Header (Hidden when printing) */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950/70 via-neutral-900 to-red-950/40 border-b border-neutral-800 flex items-center justify-between no-print-area">
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
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-blue-600/30"
              title="Imprimir versión completa y formato físico de firma"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Formato Físico</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="print-scroll-container flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-xs text-neutral-300 leading-relaxed print:overflow-visible print:h-auto print:max-h-none print:text-black print:bg-white print:p-0 print:space-y-4">
          
          {/* Header Metadata Sheet Banner */}
          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800/80 space-y-2 font-mono text-[11px] print:border print:border-black print:bg-white print:p-3 print:rounded-none">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 print:border-black pb-2">
              <div className="flex items-center gap-2">
                {gymLogoUrl ? (
                  <img
                    src={gymLogoUrl}
                    alt="Logo Kinetix"
                    className="w-6 h-6 object-contain rounded print:filter-none"
                  />
                ) : (
                  <span className="w-5 h-5 rounded bg-blue-600 print:bg-black text-white font-bold flex items-center justify-center text-[10px]">KZ</span>
                )}
                <span className="font-bold text-white print:text-black text-xs">KINETIX FUNCTIONAL ZONE</span>
              </div>
              <span className="text-blue-400 print:text-black font-semibold">
                Versión Oficial: {OFFICIAL_PRIVACY_NOTICE_DOCUMENT.version}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-400 print:text-black pt-1">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-500 print:text-black shrink-0 mt-0.5" />
                <span className="text-[10px] leading-tight">{OFFICIAL_PRIVACY_NOTICE_DOCUMENT.responsibleAddress}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-neutral-500 print:text-black shrink-0" />
                <span className="text-[10px]">Ejercicio de Derechos ARCO: <strong>{OFFICIAL_PRIVACY_NOTICE_DOCUMENT.contactEmail}</strong></span>
              </div>
            </div>
            <div className="text-[10px] text-neutral-500 print:text-black border-t border-neutral-800/60 print:border-black pt-1">
              Vigencia y última actualización: {OFFICIAL_PRIVACY_NOTICE_DOCUMENT.effectiveDate} · Plataforma: Kinetix Progress
            </div>
          </div>

          {/* Title on document print */}
          <div className="text-center space-y-1 print:border-b print:border-black print:pb-2">
            <h1 className="text-base sm:text-lg font-bold text-white print:text-black uppercase tracking-tight">
              Aviso de Privacidad Integral
            </h1>
            <p className="text-[11px] text-neutral-400 print:text-black font-medium">
              Kinetix Progress · Kinetix Functional Zone
            </p>
          </div>

          {/* Render Structured Sections Without Any '###' */}
          <div className="space-y-6 print:space-y-4">
            {OFFICIAL_PRIVACY_NOTICE_DOCUMENT.sections.map((section) => (
              <div 
                key={section.id} 
                className="print-section space-y-2.5 p-3.5 rounded-2xl bg-neutral-950/40 border border-neutral-800/50 print:border-none print:p-0 print:bg-transparent"
              >
                <div className="flex items-center gap-2 border-b border-neutral-800/80 print:border-black pb-1.5">
                  {section.number && (
                    <span className="w-5 h-5 rounded-lg bg-blue-600/20 text-blue-400 print:bg-black print:text-white font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                      {section.number}
                    </span>
                  )}
                  <h3 className="text-xs sm:text-sm font-bold text-white print:text-black uppercase tracking-wide">
                    {section.title}
                  </h3>
                </div>

                {/* Paragraphs */}
                {section.paragraphs?.map((p, idx) => (
                  <p key={idx} className="text-xs text-neutral-300 print:text-black leading-relaxed">
                    {p}
                  </p>
                ))}

                {/* Subsections (e.g. a, b, c, d) */}
                {section.subsections?.map((sub, sIdx) => (
                  <div key={sIdx} className="pl-2 sm:pl-3 border-l-2 border-blue-500/40 print:border-black space-y-1.5 my-2">
                    <h4 className="text-xs font-semibold text-blue-300 print:text-black">
                      {sub.letter ? `${sub.letter}) ` : ''}{sub.title}
                    </h4>
                    {sub.items && (
                      <ul className="list-disc pl-4 space-y-1 text-[11px] text-neutral-300 print:text-black">
                        {sub.items.map((item, iIdx) => (
                          <li key={iIdx} className="leading-snug">{item}</li>
                        ))}
                      </ul>
                    )}
                    {sub.note && (
                      <p className="text-[10px] text-neutral-400 print:text-black italic pl-1">
                        {sub.note}
                      </p>
                    )}
                  </div>
                ))}

                {/* Numbered List */}
                {section.numberedList && (
                  <ol className="list-decimal pl-5 space-y-1 text-xs text-neutral-300 print:text-black">
                    {section.numberedList.map((item, nIdx) => (
                      <li key={nIdx} className="leading-snug">{item}</li>
                    ))}
                  </ol>
                )}

                {/* Highlight banner */}
                {section.highlight && (
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 print:border print:border-black text-[11px] text-neutral-200 print:text-black font-medium leading-relaxed">
                    {section.highlight}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ELECTRONIC CONSENT RECORD (Visible on screen and print if accepted) */}
          <div className="pt-4 border-t border-neutral-800 print:border-black space-y-3 print-section">
            <h4 className="text-xs sm:text-sm font-bold text-white print:text-black font-brand flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 print:text-black" />
              <span>Constancia de Consentimiento Electrónico</span>
            </h4>

            {consentRecord ? (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 print:border print:border-black print:bg-white space-y-2.5">
                <div className="space-y-1 text-xs font-semibold text-emerald-400 print:text-black">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 print:text-black" />
                    <span>✓ Aviso de Privacidad conocido y aceptado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 print:text-black" />
                    <span>✓ Consentimiento otorgado para el tratamiento de datos personales sensibles</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-emerald-900/40 print:border-black text-[11px] font-mono text-neutral-300 print:text-black">
                  <div>
                    <span className="text-neutral-500 print:text-black block text-[10px]">Usuario y correo:</span>
                    <strong className="text-white print:text-black">{currentUser.name} ({currentUser.email})</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 print:text-black block text-[10px]">Fecha y hora de manifestación:</span>
                    <strong className="text-white print:text-black">
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
                    <span className="text-neutral-500 print:text-black block text-[10px]">Versión del aviso aceptado:</span>
                    <strong className="text-blue-400 print:text-black">{consentRecord.privacy_notice_version}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 print:text-black block text-[10px]">Mecanismo y plataforma:</span>
                    <span className="text-neutral-300 print:text-black">
                      {consentRecord.consent_method} · {consentRecord.platform || 'Kinetix Progress'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/50 print:border print:border-black text-amber-200 print:text-black text-xs">
                Este perfil cuenta con acceso regular. Al registrar tu consentimiento mediante el mecanismo inicial quedará aquí la constancia inalterable.
              </div>
            )}
          </div>

          {/* PHYSICAL WRITTEN CONSENT SIGNATURE FORMAT (Always printed for paper archive) */}
          <div className="pt-6 border-t-2 border-black space-y-4 text-black print-section">
            <div className="bg-gray-100 p-3 rounded-lg border border-gray-300 print:border-black print:bg-white space-y-1">
              <h4 className="font-bold text-xs uppercase text-neutral-900 print:text-black">
                CONSENTIMIENTO EXPRESO POR ESCRITO (FORMATO PARA EXPEDIENTE FÍSICO)
              </h4>
              <p className="text-[11px] leading-relaxed text-neutral-800 print:text-black">
                Manifiesto que he leído y conozco el presente Aviso de Privacidad Integral de Kinetix Functional Zone. Asimismo, otorgo expresamente mi consentimiento por escrito para el tratamiento de mis datos personales y datos personales sensibles (composición corporal, condición física y salud) para las finalidades señaladas en el presente documento.
              </p>
            </div>

            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-6 text-[11px] text-neutral-900 print:text-black">
              <div className="border-t border-black pt-1">
                <span className="block font-semibold">Nombre del Titular:</span>
                <span className="text-neutral-600 print:text-black">{currentUser.name || '__________________________'}</span>
              </div>
              <div className="border-t border-black pt-1">
                <span className="block font-semibold">Firma Autógrafa del Titular:</span>
                <span className="text-neutral-400 print:text-black italic">Firma aquí</span>
              </div>
              <div className="border-t border-black pt-1">
                <span className="block font-semibold">Fecha:</span>
                <span className="text-neutral-600 print:text-black">____ de ______________ de {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer (Hidden when printing) */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between no-print-area">
          <span className="text-[10px] text-neutral-500 font-mono">
            Kinetix Progress · Versión Oficial {CURRENT_PRIVACY_NOTICE_VERSION}
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
