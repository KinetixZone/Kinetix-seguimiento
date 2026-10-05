import React, { useState } from 'react';
import { TECHNICAL_SPEC_SECTIONS, SpecSection } from '../../data/technicalSpecContent';
import { 
  Database, 
  Server, 
  Terminal, 
  ShieldCheck, 
  Calculator, 
  Calendar, 
  WifiOff, 
  FileCode, 
  CheckCircle2, 
  Copy, 
  Play, 
  Layers
} from 'lucide-react';

interface TechnicalSpecViewerProps {
  onOpenSimulator: () => void;
}

export const TechnicalSpecViewer: React.FC<TechnicalSpecViewerProps> = ({ onOpenSimulator }) => {
  const [activeSectionId, setActiveSectionId] = useState<string>('resumen-alcance');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Interactive API Sandbox state
  const [selectedApiEndpoint, setSelectedApiEndpoint] = useState<string>('POST_BODY_COMP');
  const [apiResponseMock, setApiResponseMock] = useState<string | null>(null);

  const activeSection = TECHNICAL_SPEC_SECTIONS.find(s => s.id === activeSectionId) || TECHNICAL_SPEC_SECTIONS[0];

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const executeApiSimulation = (endpointKey: string) => {
    if (endpointKey === 'POST_BODY_COMP') {
      setApiResponseMock(JSON.stringify({
        status: "success",
        statusCode: 201,
        message: "Registro mensual de composición corporal guardado exitosamente.",
        data: {
          id: "bc-" + Math.floor(1000 + Math.random() * 9000),
          userId: "user-001",
          recordedAt: "2024-04-15",
          weightKg: 74.8,
          muscleMassPercent: 45.2,
          bodyFatPercent: 11.8,
          visceralFatLevel: 3,
          bmi: 22.1,
          bmiCategory: "Normal",
          deltaFromLastMonth: {
            weightKg: -0.2,
            muscleMassPercent: "+0.2%",
            bodyFatPercent: "-0.2%"
          },
          createdAt: new Date().toISOString()
        }
      }, null, 2));
    } else if (endpointKey === 'POST_STAFF_EVAL') {
      setApiResponseMock(JSON.stringify({
        status: "success",
        statusCode: 201,
        message: "Evaluación física registrada por Coach Staff.",
        data: {
          evaluationId: "eval-" + Math.floor(1000 + Math.random() * 9000),
          athlete: "Juan Pérez",
          evaluationDate: "2024-03-20",
          cooperDistanceMeters: 2800,
          estimatedVo2Max: 51.3,
          cooperRating: "Excelente",
          strengthSummary: {
            squats1RM: "120 kg",
            deadlift1RM: "140 kg",
            hipThrust1RM: "150 kg",
            horizontalPress1RM: "90 kg",
            netGainThisMonth: "+5 kg ganancia de fuerza neta"
          }
        }
      }, null, 2));
    } else if (endpointKey === 'CRON_SUSPENSION') {
      setApiResponseMock(JSON.stringify({
        status: "completed",
        timestamp: new Date().toISOString(),
        audit: {
          membershipsChecked: 342,
          gracePeriodDaysAllowed: 5,
          activeRemindersDispatched: 14,
          membershipsAutoSuspended: 3,
          suspendedUserIds: ["usr_8819", "usr_9921", "usr_1002"],
          accessTurnstilesRevoked: true,
          pushAlertsDispatched: 3
        }
      }, null, 2));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10">
      {/* Hero Banner with Executive Summary */}
      <section className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 md:p-10 backdrop-blur-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-[#ff5500]">
            <span>DOCUMENTO DE CONSULTORÍA TÉCNICA OFICIAL</span>
            <span>·</span>
            <span>VERSIÓN 1.0.5</span>
            <span>·</span>
            <span>KINETIX FUNCTIONAL ZONE</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white font-brand">
            Especificación Técnica y Arquitectura de Sistema
          </h1>

          <p className="text-neutral-300 text-sm md:text-base leading-relaxed">
            Plataforma integral para <strong className="text-white">Kinetix Functional Zone</strong>.
            Cubre seguimiento antropométrico mensual con bioimpedancia, batería de evaluaciones físicas 
            (Test de Cooper con asignación directa de niveles 1 al 5 por el staff, 1RM de fuerza en 5 ejercicios y ratios de fuerza relativa), 
            y motor automatizado de membresías con suspensión inteligente por falta de pago y notificaciones directas en la misma página o app.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenSimulator}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs md:text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
            >
              <Terminal className="w-4 h-4" />
              Probar Plataforma Web Kinetix
            </button>
            <div className="flex items-center gap-3 text-xs text-neutral-400 px-3 py-2 bg-neutral-950/60 rounded-xl border border-neutral-800">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span>Portal Web Oficial · Cooper Niveles 1-5 · Pagos por Color</span>
            </div>
          </div>
        </div>

        {/* Subtle background glow */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Main Content Layout: Section Nav + Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Sections Navigation */}
        <aside className="lg:col-span-4 sticky top-20 space-y-3">
          <div className="text-xs font-semibold tracking-wider text-neutral-400 px-2 uppercase">
            Índice de la Especificación
          </div>
          <nav className="space-y-1.5 bg-neutral-900/40 p-2 rounded-2xl border border-neutral-800/80">
            {TECHNICAL_SPEC_SECTIONS.map((section, idx) => {
              const isActive = activeSectionId === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1 ${
                    isActive
                      ? 'bg-neutral-800 text-white border border-neutral-700/80 shadow-md'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className={isActive ? 'text-blue-400 font-semibold' : 'text-neutral-400'}>
                      {section.title}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">Pág {idx + 1}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-1">
                    {section.summary}
                  </p>
                </button>
              );
            })}
          </nav>

          {/* Quick Technical Highlights Card */}
          <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-3">
            <h4 className="text-xs font-semibold text-neutral-300 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Aspectos Críticos Validados
            </h4>
            <ul className="text-xs text-neutral-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">✓</span>
                <span><strong>Fórmula IMC OMS:</strong> Cálculo reactivo con categorización clínica.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">✓</span>
                <span><strong>Cooper (Niveles 1 al 5):</strong> Staff asigna nivel directo; usuario ve diagnóstico.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">✓</span>
                <span><strong>1RM Brzycki:</strong> 5 ejercicios de fuerza máxima funcional.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">✓</span>
                <span><strong>Portal Web Oficial & Pagos por Color:</strong> Códigos Azul (5), Rojo (15), Rosa (20) y Verde (30) con control manual de acceso.</span>
              </li>
            </ul>
          </div>
        </aside>

        {/* Right Column: Active Section Reader */}
        <main className="lg:col-span-8 space-y-8">
          <article className="p-6 md:p-8 rounded-3xl bg-neutral-900/40 border border-neutral-800 text-neutral-200 space-y-6 leading-relaxed">
            <div className="border-b border-neutral-800 pb-4">
              <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">
                Capítulo Técnico Seleccionado
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-white font-brand mt-1">
                {activeSection.title}
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                {activeSection.summary}
              </p>
            </div>

            {/* Markdown body rendering */}
            <div className="prose prose-invert max-w-none text-sm space-y-4">
              {activeSection.contentMarkdown.split('\n\n').map((paragraph, index) => {
                if (paragraph.startsWith('### ')) {
                  return (
                    <h3 key={index} className="text-lg font-bold text-white pt-4 pb-1 border-b border-neutral-800/60 font-brand">
                      {paragraph.replace('### ', '')}
                    </h3>
                  );
                } else if (paragraph.startsWith('#### ')) {
                  return (
                    <h4 key={index} className="text-base font-semibold text-emerald-400 pt-3">
                      {paragraph.replace('#### ', '')}
                    </h4>
                  );
                } else if (paragraph.startsWith('```')) {
                  const cleanedCode = paragraph.replace(/```[a-z]*\n?/g, '').trim();
                  return (
                    <div key={index} className="relative group my-4 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 font-mono text-xs">
                      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/90 border-b border-neutral-800 text-[11px] text-neutral-400">
                        <span>Código / Diagrama Técnico</span>
                        <button
                          onClick={() => handleCopyCode(cleanedCode, `block-${index}`)}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedCode === `block-${index}` ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                      <pre className="p-4 overflow-x-auto text-emerald-300/90 leading-relaxed font-mono">
                        {cleanedCode}
                      </pre>
                    </div>
                  );
                } else if (paragraph.startsWith('|')) {
                  // Basic table support
                  const rows = paragraph.split('\n').filter(r => r.trim().length > 0);
                  return (
                    <div key={index} className="overflow-x-auto my-4 rounded-xl border border-neutral-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <tbody>
                          {rows.map((row, rIdx) => {
                            if (row.includes('---')) return null;
                            const cells = row.split('|').filter(c => c.trim() !== '');
                            return (
                              <tr key={rIdx} className={rIdx === 0 ? 'bg-neutral-800/80 font-semibold text-white' : 'border-t border-neutral-800/60 text-neutral-300'}>
                                {cells.map((cell, cIdx) => (
                                  <td key={cIdx} className="p-2.5">
                                    {cell.trim()}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                } else if (paragraph.startsWith('* ') || paragraph.startsWith('- ')) {
                  const items = paragraph.split('\n').filter(i => i.trim());
                  return (
                    <ul key={index} className="space-y-1.5 list-disc list-inside text-neutral-300 text-xs md:text-sm pl-2">
                      {items.map((it, iIdx) => (
                        <li key={iIdx} className="leading-relaxed">
                          <span dangerouslySetInnerHTML={{ __html: it.replace(/^[*-]\s+/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code class="bg-neutral-800 px-1 py-0.5 rounded text-emerald-300 text-xs">$1</code>') }} />
                        </li>
                      ))}
                    </ul>
                  );
                } else {
                  return (
                    <p key={index} className="text-neutral-300 text-xs md:text-sm leading-relaxed"
                       dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/`([^`]+)`/g, '<code class="bg-neutral-800 px-1.5 py-0.5 rounded text-emerald-300 font-mono text-xs">$1</code>') }}
                    />
                  );
                }
              })}
            </div>
          </article>

          {/* Interactive API Sandbox / Test Bed */}
          <div className="p-6 md:p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Playground Interactivo</span>
                <h3 className="text-lg font-bold text-white font-brand">Sandbox de Endpoints de la API Kinetix</h3>
              </div>
              <span className="text-[11px] text-neutral-400 bg-neutral-800 px-2.5 py-1 rounded-full">
                Simulación en tiempo real
              </span>
            </div>

            <p className="text-xs text-neutral-400">
              Prueba los contratos de solicitud y respuesta de los endpoints clave especificados en el documento:
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => { setSelectedApiEndpoint('POST_BODY_COMP'); executeApiSimulation('POST_BODY_COMP'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedApiEndpoint === 'POST_BODY_COMP'
                    ? 'bg-cyan-500 text-black font-semibold'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                POST /users/:id/body-composition
              </button>
              <button
                onClick={() => { setSelectedApiEndpoint('POST_STAFF_EVAL'); executeApiSimulation('POST_STAFF_EVAL'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedApiEndpoint === 'POST_STAFF_EVAL'
                    ? 'bg-cyan-500 text-black font-semibold'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                POST /staff/evaluations (Cooper + 1RM)
              </button>
              <button
                onClick={() => { setSelectedApiEndpoint('CRON_SUSPENSION'); executeApiSimulation('CRON_SUSPENSION'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedApiEndpoint === 'CRON_SUSPENSION'
                    ? 'bg-cyan-500 text-black font-semibold'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                POST /cron/membership-suspension
              </button>
            </div>

            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/80 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-neutral-400">
                <span className="text-cyan-400 font-bold">200 OK / 201 Created</span>
                <button
                  onClick={() => executeApiSimulation(selectedApiEndpoint)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
                >
                  <Play className="w-3 h-3 text-cyan-400" />
                  <span>Re-ejecutar</span>
                </button>
              </div>
              <pre className="pt-3 text-neutral-300 overflow-x-auto max-h-64">
                {apiResponseMock || '// Presiona un endpoint para simular la respuesta HTTP'}
              </pre>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
