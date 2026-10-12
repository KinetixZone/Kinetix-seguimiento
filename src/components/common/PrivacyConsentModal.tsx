import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  CheckSquare, 
  Square, 
  ExternalLink, 
  AlertTriangle,
  ArrowRight,
  X
} from 'lucide-react';
import { UserProfile, PrivacyConsentRecord } from '../../types';
import { 
  CURRENT_PRIVACY_NOTICE_VERSION, 
  OFFICIAL_PRIVACY_NOTICE_DOCUMENT 
} from '../../data/privacyNoticeContent';

interface PrivacyConsentModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onConsentAccepted: (record: PrivacyConsentRecord) => void;
}

export const PrivacyConsentModal: React.FC<PrivacyConsentModalProps> = ({
  currentUser,
  isOpen,
  onConsentAccepted,
}) => {
  const [acceptedNotice, setAcceptedNotice] = useState(false);
  const [acceptedSensitive, setAcceptedSensitive] = useState(false);
  const [showFullDocument, setShowFullDocument] = useState(false);

  if (!isOpen) return null;

  const canContinue = acceptedNotice && acceptedSensitive;

  const handleAcceptAndContinue = () => {
    if (!canContinue) return;

    const consentRecord: PrivacyConsentRecord = {
      consent_id: `consent-${currentUser.id}-${Date.now()}`,
      user_id: currentUser.id,
      user_email: currentUser.email,
      privacy_notice_version: CURRENT_PRIVACY_NOTICE_VERSION,
      privacy_notice_accepted: true,
      sensitive_data_consent: true,
      accepted_at: new Date().toISOString(),
      consent_method: 'authenticated_user_checkbox',
      platform: 'Kinetix Progress',
    };

    onConsentAccepted(consentRecord);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-950/70 via-neutral-900 to-red-950/50 border-b border-neutral-800 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-md">
            <Lock className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                LFPDPPP · México
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                {CURRENT_PRIVACY_NOTICE_VERSION}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white font-brand mt-1">
              Privacidad y protección de tus datos
            </h2>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs text-neutral-300 leading-relaxed">
          <div className="space-y-3 bg-neutral-950/70 p-4 rounded-2xl border border-neutral-800/80">
            <p className="font-semibold text-white">
              Estimado(a) {currentUser.name}:
            </p>
            <p>
              Para utilizar <strong>Kinetix Progress</strong>, <strong>Kinetix Functional Zone</strong> tratará los datos personales que proporciones con la finalidad de registrar y dar seguimiento a tus avances, rendimiento, composición corporal y evolución física, así como apoyar la planificación y desarrollo de tu entrenamiento.
            </p>
            <p>
              Algunos de los datos que proporciones, particularmente los relacionados con tu <strong>composición corporal</strong>, <strong>condición física</strong> u <strong>observaciones sobre tu salud</strong>, pueden constituir <strong>datos personales sensibles</strong>.
            </p>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30">
            <div className="space-y-0.5 pr-2">
              <span className="text-[11px] font-bold text-white block">
                Aviso de Privacidad Integral
              </span>
              <span className="text-[10px] text-neutral-400 block">
                Conoce las finalidades completas y tus derechos ARCO.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowFullDocument(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] flex items-center gap-1.5 shrink-0 transition-all shadow-md active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Consultar Aviso Integral</span>
            </button>
          </div>

          {/* Legal Checkboxes (Must start unchecked) */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => setAcceptedNotice(!acceptedNotice)}
              className={`w-full text-left flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
                acceptedNotice 
                  ? 'bg-blue-950/30 border-blue-500/50 text-white' 
                  : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300'
              }`}
            >
              <div className="mt-0.5 shrink-0 text-blue-500">
                {acceptedNotice ? (
                  <CheckSquare className="w-5 h-5 text-blue-400 fill-blue-500/20" />
                ) : (
                  <Square className="w-5 h-5 text-neutral-500" />
                )}
              </div>
              <span className="text-xs select-none leading-snug">
                He leído y conozco el <strong>Aviso de Privacidad Integral</strong> de Kinetix Progress.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAcceptedSensitive(!acceptedSensitive)}
              className={`w-full text-left flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
                acceptedSensitive 
                  ? 'bg-red-950/30 border-red-500/50 text-white' 
                  : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300'
              }`}
            >
              <div className="mt-0.5 shrink-0 text-red-500">
                {acceptedSensitive ? (
                  <CheckSquare className="w-5 h-5 text-red-400 fill-red-500/20" />
                ) : (
                  <Square className="w-5 h-5 text-neutral-500" />
                )}
              </div>
              <span className="text-xs select-none leading-snug">
                Otorgo expresamente mi consentimiento para el tratamiento de mis <strong>datos personales sensibles</strong> para las finalidades señaladas en el Aviso de Privacidad Integral.
              </span>
            </button>
          </div>

          {!canContinue && (
            <p className="text-[11px] text-amber-400/90 text-center flex items-center justify-center gap-1.5 pt-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Debes marcar ambas casillas para habilitar el acceso a la plataforma.</span>
            </p>
          )}
        </div>

        {/* Footer Action Button */}
        <div className="p-4 sm:p-5 bg-neutral-950/90 border-t border-neutral-800 flex items-center justify-between gap-3">
          <div className="text-[10px] text-neutral-500 hidden sm:block">
            Cuenta autenticada: <span className="font-mono text-neutral-400">{currentUser.email}</span>
          </div>
          <button
            type="button"
            onClick={handleAcceptAndContinue}
            disabled={!canContinue}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              canContinue
                ? 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-95'
                : 'bg-neutral-800 text-neutral-500 border border-neutral-700/50 cursor-not-allowed opacity-60'
            }`}
          >
            <span>Aceptar y Continuar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Embedded Full Privacy Document Modal (allows reading without leaving flow) */}
      {showFullDocument && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 flex flex-col max-h-[90vh] shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white font-brand">
                  Aviso de Privacidad Integral Completo
                </h3>
              </div>
              <button
                onClick={() => setShowFullDocument(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Cerrar documento"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-neutral-300 leading-relaxed pr-2">
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800/80 space-y-1 font-mono text-[11px]">
                <div className="text-white font-bold">KINETIX FUNCTIONAL ZONE</div>
                <div className="text-neutral-400">{OFFICIAL_PRIVACY_NOTICE_DOCUMENT.responsibleAddress}</div>
                <div className="text-blue-400">Contacto: {OFFICIAL_PRIVACY_NOTICE_DOCUMENT.contactEmail}</div>
                <div className="text-neutral-500">Versión: {OFFICIAL_PRIVACY_NOTICE_DOCUMENT.version} · {OFFICIAL_PRIVACY_NOTICE_DOCUMENT.effectiveDate}</div>
              </div>

              <div className="whitespace-pre-line text-xs font-sans text-neutral-300 space-y-3">
                {OFFICIAL_PRIVACY_NOTICE_DOCUMENT.fullMarkdown}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFullDocument(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
              >
                Entendido / Regresar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
