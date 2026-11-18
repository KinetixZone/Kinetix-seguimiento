import React, { useState } from 'react';
import { UserProfile, BodyCompositionRecord, PhysicalEvaluationRecord } from '../../types';
import { OFFICIAL_COLORS, NO_CUTOFF_CONFIG, getPaymentGroup } from '../../utils/paymentColorCodes';
import {
  getLocalTodayDateStr,
  isAerobicOmittedEval,
  resolveLatestStrengthPillars,
  getEffectiveStrength1RMKg
} from '../../utils/evaluationHelpers';
import {
  FileSpreadsheet,
  Download,
  X,
  Calendar,
  CheckCircle2,
  Layers,
  Sparkles,
  Table,
  Search,
  KeyRound,
  Check
} from 'lucide-react';

interface ExcelExportModalProps {
  users: UserProfile[];
  bodyCompRecords: BodyCompositionRecord[];
  evaluations: PhysicalEvaluationRecord[];
  onClose: () => void;
}

type CellVal = string | number | undefined | null;

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  users,
  bodyCompRecords,
  evaluations,
  onClose,
}) => {
  const [athleteScope, setAthleteScope] = useState<'all' | 'selected' | 'single' | 'color'>('all');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  const [selectedColorDay, setSelectedColorDay] = useState<number>(15);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [reportType, setReportType] = useState<'consolidated' | 'credentials' | 'body_comp' | 'evaluations'>('consolidated');
  const [exportFormat, setExportFormat] = useState<'xml' | 'csv'>('xml');
  const [dateFilter, setDateFilter] = useState<'all' | 'current_month' | 'specific_month' | 'current_year'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [includePasswords, setIncludePasswords] = useState<boolean>(true);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const athletes = users.filter(u => u.role === 'athlete');
  const staff = users.filter(u => u.role === 'staff');

  const filteredAthletesList = athletes.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Target athletes based on filters
  let targetAthletes = athletes;
  if (athleteScope === 'single' && selectedAthleteId) {
    targetAthletes = athletes.filter(a => a.id === selectedAthleteId);
  } else if (athleteScope === 'selected') {
    const idSet = new Set(selectedAthleteIds);
    targetAthletes = athletes.filter(a => idSet.has(a.id));
  } else if (athleteScope === 'color') {
    targetAthletes = athletes.filter(a => (a.membership.billingDayOfMonth ?? 15) === selectedColorDay);
  }

  const toggleMultiAthlete = (id: string) => {
    setSelectedAthleteIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Safe local YYYY-MM-DD date filtering (immune to UTC midnight day-shift)
  const todayStr = getLocalTodayDateStr();
  const currentYearStr = todayStr.slice(0, 4);
  const currentMonthStr = todayStr.slice(0, 7);
  const targetSpecificYm = `${currentYearStr}-${String(selectedMonth + 1).padStart(2, '0')}`;

  const isDateInFilter = (dateStr: string): boolean => {
    if (dateFilter === 'all') return true;
    if (!dateStr || dateStr.length < 7) return false;
    const ym = dateStr.slice(0, 7);
    if (dateFilter === 'current_month') return ym === currentMonthStr;
    if (dateFilter === 'specific_month') return ym === targetSpecificYm;
    if (dateFilter === 'current_year') return dateStr.slice(0, 4) === currentYearStr;
    return true;
  };

  const formatCooperLabel = (ev?: PhysicalEvaluationRecord): string => {
    if (!ev) return 'Sin evaluar';
    if (isAerobicOmittedEval(ev)) return 'Omitido (Solo Fuerza 1RM)';
    if (ev.cooperTest?.status === 'na') return 'NA';
    if (ev.cooperTest?.status === 'np') return 'NP';
    if (ev.cooperTest?.variant === 'navette') {
      return `Navette Nivel ${ev.cooperTest.navetteLevelNumber || ev.cooperTest.levelNumber || 1}`;
    }
    if (ev.cooperTest?.variant === 'laps' || (ev.cooperTest?.lapsCount || 0) > 0) {
      return `${ev.cooperTest.lapsCount || 0} vueltas`;
    }
    if (ev.cooperTest?.variant === 'both') {
      return `Cooper ${ev.cooperTest.distanceMeters || 0}m + Navette Nv.${ev.cooperTest.navetteLevelNumber || 1}`;
    }
    return `Nivel ${ev.cooperTest?.levelNumber || 1}`;
  };

  const formatEnduranceResult = (ev?: PhysicalEvaluationRecord): string => {
    if (!ev) return 'N/A';
    if (isAerobicOmittedEval(ev) || ev.enduranceTest?.sessionOmitted) return 'Omitido';
    if (ev.enduranceTest?.status === 'na') return 'NA';
    if (ev.enduranceTest?.status === 'np') return 'NP';
    return ev.enduranceTest?.result || 'N/A';
  };

  const avgNumeric = (vals: number[], decimals = 1): number | string => {
    if (vals.length === 0) return '—';
    const sum = vals.reduce((a, b) => a + b, 0);
    return Number((sum / vals.length).toFixed(decimals));
  };

  const buildConsolidatedSheet = (): CellVal[][] => {
    const headers: CellVal[] = [
      'ID Atleta',
      'Nombre Completo',
      'Correo Electrónico',
      'Teléfono',
      'Plan Kinetix',
      'Estado de Acceso',
      'Código de Color Pago',
      'Día de Corte Mensual',
      'Próximo Vencimiento',
      'Último Peso (kg)',
      'IMC',
      'Categoría IMC',
      '% Grasa Corporal',
      '% Masa Muscular',
      'Grasa Visceral',
      'Nivel Cooper / Navette',
      'Sentadilla 1RM (kg)',
      'Peso Muerto 1RM (kg)',
      'Hip Thrust 1RM (kg)',
      'Press Horizontal 1RM (kg)',
      'Remo / Dom. 1RM (kg)',
      'Resistencia Funcional Reto',
      'Tiempo Resistencia',
    ];
    if (includePasswords) headers.push('Clave de Acceso (Password)');

    const rows: CellVal[][] = [headers];

    const weights: number[] = [];
    const bmis: number[] = [];
    const fats: number[] = [];
    const muscles: number[] = [];
    const viscerals: number[] = [];
    const sqs: number[] = [];
    const dls: number[] = [];
    const hts: number[] = [];
    const hps: number[] = [];
    const rws: number[] = [];
    let evaluatedCount = 0;

    targetAthletes.forEach(ath => {
      const athComps = bodyCompRecords
        .filter(b => b.userId === ath.id && isDateInFilter(b.recordedAt))
        .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
      const latestComp = athComps[athComps.length - 1];

      const athEvals = evaluations
        .filter(e => e.userId === ath.id && isDateInFilter(e.evaluationDate))
        .sort((a, b) => a.evaluationDate.localeCompare(b.evaluationDate));

      if (athEvals.length > 0) evaluatedCount++;

      const latestAerobic = [...athEvals].reverse().find(e => !isAerobicOmittedEval(e));
      const resolvedPillars = resolveLatestStrengthPillars(athEvals);

      const getPillarVal = (exId: string, collector: number[]): CellVal => {
        const found = resolvedPillars.find(p => p.record.exerciseId === exId);
        if (!found) return 'N/A';
        if (found.record.status === 'na') return 'NA';
        if (found.record.status === 'np') return 'NP';
        const kg = getEffectiveStrength1RMKg(found.record);
        if (kg > 0) {
          collector.push(kg);
          return kg;
        }
        return 'N/A';
      };

      if (latestComp) {
        weights.push(latestComp.weightKg);
        bmis.push(latestComp.bmi);
        fats.push(latestComp.bodyFatPercent);
        muscles.push(latestComp.muscleMassPercent);
        viscerals.push(latestComp.visceralFatLevel);
      }

      const billDay = ath.membership.billingDayOfMonth ?? 15;
      const pg = getPaymentGroup(billDay);

      const row: CellVal[] = [
        ath.id,
        ath.name,
        ath.email,
        ath.phone,
        ath.membership.planName,
        ath.membership.status === 'active' ? 'Activo' : 'Suspendido/Vencido',
        billDay === 0 ? 'Sin Corte (Cortesía/Familia)' : `${pg.colorName} (Día ${billDay})`,
        billDay === 0 ? 'Sin Corte' : billDay,
        ath.membership.expiryDate,
        latestComp ? latestComp.weightKg : 'Sin mediciones',
        latestComp ? latestComp.bmi : 'N/A',
        latestComp ? latestComp.bmiCategory : 'N/A',
        latestComp ? latestComp.bodyFatPercent : 'N/A',
        latestComp ? latestComp.muscleMassPercent : 'N/A',
        latestComp ? latestComp.visceralFatLevel : 'N/A',
        formatCooperLabel(latestAerobic),
        getPillarVal('squats', sqs),
        getPillarVal('deadlift', dls),
        getPillarVal('hip_thrust', hts),
        getPillarVal('horizontal_press', hps),
        getPillarVal('pullups_or_rows', rws),
        latestAerobic ? (isAerobicOmittedEval(latestAerobic) ? 'Omitido' : latestAerobic.enduranceTest.name) : 'N/A',
        formatEnduranceResult(latestAerobic),
      ];

      if (includePasswords) {
        row.push(ath.password || 'kinetix123');
      }
      rows.push(row);
    });

    // Totals & Box Averages summary row
    const totalRow: CellVal[] = [
      'TOTALES / PROMEDIOS',
      `${targetAthletes.length} atletas`,
      '',
      '',
      `${targetAthletes.filter(a => a.membership.status === 'active').length} activos`,
      `${evaluatedCount} evaluados`,
      '',
      '',
      `${weights.length} con báscula`,
      avgNumeric(weights, 1),
      avgNumeric(bmis, 1),
      'Promedio',
      avgNumeric(fats, 1),
      avgNumeric(muscles, 1),
      avgNumeric(viscerals, 1),
      `${evaluatedCount}/${targetAthletes.length} c/test`,
      avgNumeric(sqs, 0),
      avgNumeric(dls, 0),
      avgNumeric(hts, 0),
      avgNumeric(hps, 0),
      avgNumeric(rws, 0),
      '',
      '',
    ];
    if (includePasswords) totalRow.push('');
    rows.push(totalRow);

    return rows;
  };

  const buildCredentialsSheet = (): CellVal[][] => {
    const rows: CellVal[][] = [[
      'Tipo de Usuario',
      'ID Usuario',
      'Nombre Completo',
      'Correo Electrónico',
      'Clave de Acceso (Password)',
      'Teléfono',
      'Plan Kinetix',
      'Estado Membresía',
      'Día de Corte',
      'Fecha Vencimiento',
      'Fecha Alta / Registro'
    ]];

    if (athleteScope === 'all') {
      staff.forEach(st => {
        rows.push([
          `Staff (${st.staffRole === 'owner' ? 'Dueño/a' : 'Coach'})`,
          st.id,
          st.name,
          st.email,
          st.password || 'kinetix2026',
          st.phone || 'N/A',
          'Acceso Permanente Staff',
          'Permanente (Sin cobro)',
          'N/A',
          'Permanente',
          st.createdAt || '2024-01-01'
        ]);
      });
    }

    targetAthletes.forEach(ath => {
      const billDay = ath.membership.billingDayOfMonth ?? 15;
      rows.push([
        'Atleta',
        ath.id,
        ath.name,
        ath.email,
        ath.password || 'kinetix123',
        ath.phone || 'N/A',
        ath.membership.planName,
        ath.membership.status === 'active' ? 'Activo' : 'Suspendido/Vencido',
        billDay === 0 ? 'Sin Corte' : billDay,
        ath.membership.expiryDate,
        ath.createdAt || '2024-01-01'
      ]);
    });

    rows.push([
      'TOTAL CUENTAS',
      `${rows.length - 1} registros`,
      athleteScope === 'all' ? `${staff.length} staff + ${targetAthletes.length} atletas` : `${targetAthletes.length} atletas`,
      '', '', '', '', '', '', '', ''
    ]);

    return rows;
  };

  const buildBodyCompSheet = (): CellVal[][] => {
    const rows: CellVal[][] = [[
      'ID Medición',
      'ID Atleta',
      'Nombre Atleta',
      'Fecha Medición',
      'Peso (kg)',
      'Masa Muscular (%)',
      'Grasa Corporal (%)',
      'Grasa Visceral (Nivel)',
      'IMC',
      'Categoría IMC',
      'Notas del Entrenador'
    ]];

    const weights: number[] = [];
    const muscles: number[] = [];
    const fats: number[] = [];
    const viscerals: number[] = [];
    const bmis: number[] = [];

    targetAthletes.forEach(ath => {
      const comps = bodyCompRecords
        .filter(b => b.userId === ath.id && isDateInFilter(b.recordedAt))
        .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
      comps.forEach(c => {
        weights.push(c.weightKg);
        muscles.push(c.muscleMassPercent);
        fats.push(c.bodyFatPercent);
        viscerals.push(c.visceralFatLevel);
        bmis.push(c.bmi);
        rows.push([
          c.id,
          ath.id,
          ath.name,
          c.recordedAt,
          c.weightKg,
          c.muscleMassPercent,
          c.bodyFatPercent,
          c.visceralFatLevel,
          c.bmi,
          c.bmiCategory,
          c.notes || ''
        ]);
      });
    });

    rows.push([
      'TOTAL / PROMEDIO',
      `${targetAthletes.length} atletas`,
      `${weights.length} pesajes`,
      '',
      avgNumeric(weights, 1),
      avgNumeric(muscles, 1),
      avgNumeric(fats, 1),
      avgNumeric(viscerals, 1),
      avgNumeric(bmis, 1),
      '',
      ''
    ]);

    return rows;
  };

  const buildEvaluationsSheet = (): CellVal[][] => {
    const rows: CellVal[][] = [[
      'ID Evaluación',
      'ID Atleta',
      'Nombre Atleta',
      'Fecha Evaluación',
      'Coach Responsable',
      'Nivel Cooper / Navette',
      'Distancia Cooper (m)',
      'Reto Resistencia',
      'Tiempo Resistencia',
      'Sentadilla 1RM (kg)',
      'Peso Muerto 1RM (kg)',
      'Hip Thrust 1RM (kg)',
      'Press Horizontal 1RM (kg)',
      'Remo/Dominadas 1RM (kg)',
      'Observaciones Coach'
    ]];

    const sqs: number[] = [];
    const dls: number[] = [];
    const hts: number[] = [];
    const hps: number[] = [];
    const rws: number[] = [];
    let totalEvalCount = 0;

    targetAthletes.forEach(ath => {
      const evals = evaluations
        .filter(e => e.userId === ath.id && isDateInFilter(e.evaluationDate))
        .sort((a, b) => a.evaluationDate.localeCompare(b.evaluationDate));

      evals.forEach(ev => {
        totalEvalCount++;
        const isOmittedAero = isAerobicOmittedEval(ev);
        const formatLift = (id: string, collector: number[]): CellVal => {
          if (!ev.strengthRecords || ev.strengthRecords.length === 0) return 'Omitido (Solo Resistencia)';
          const r = ev.strengthRecords.find(s => s.exerciseId === id);
          if (!r) return 'N/A';
          if (r.status === 'na') return 'NA';
          if (r.status === 'np') return 'NP';
          const kg = getEffectiveStrength1RMKg(r);
          if (kg > 0) {
            collector.push(kg);
            return kg;
          }
          return 'N/A';
        };

        rows.push([
          ev.id,
          ath.id,
          ath.name,
          ev.evaluationDate,
          ev.coachName,
          formatCooperLabel(ev),
          isOmittedAero ? 'N/A' : (ev.cooperTest.distanceMeters || 'N/A'),
          isOmittedAero ? 'Omitido (Solo Fuerza 1RM)' : ev.enduranceTest.name,
          formatEnduranceResult(ev),
          formatLift('squats', sqs),
          formatLift('deadlift', dls),
          formatLift('hip_thrust', hts),
          formatLift('horizontal_press', hps),
          formatLift('pullups_or_rows', rws),
          ev.generalCoachNotes || ''
        ]);
      });
    });

    rows.push([
      'TOTAL / PROMEDIO',
      `${targetAthletes.length} atletas`,
      `${totalEvalCount} evaluaciones`,
      '', '', '', '', '', '',
      avgNumeric(sqs, 0),
      avgNumeric(dls, 0),
      avgNumeric(hts, 0),
      avgNumeric(hps, 0),
      avgNumeric(rws, 0),
      ''
    ]);

    return rows;
  };

  const escapeXml = (val: CellVal): string => {
    if (val === undefined || val === null) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const buildSpreadsheetXml = (sheets: { name: string; rows: CellVal[][] }[]): string => {
    const worksheetsXml = sheets
      .map(sheet => {
        const safeName = escapeXml(sheet.name.slice(0, 31));
        const rowsXml = sheet.rows
          .map((row, rowIdx) => {
            const isHeader = rowIdx === 0;
            const isTotal = rowIdx === sheet.rows.length - 1 && sheet.rows.length > 1;
            const styleAttr = isHeader
              ? ' ss:StyleID="sHeader"'
              : isTotal
              ? ' ss:StyleID="sTotal"'
              : '';
            const cellsXml = row
              .map(cell => {
                const isNum = typeof cell === 'number' && Number.isFinite(cell);
                const type = isNum ? 'Number' : 'String';
                return `<Cell${styleAttr}><Data ss:Type="${type}">${escapeXml(cell)}</Data></Cell>`;
              })
              .join('');
            return `<Row>${cellsXml}</Row>`;
          })
          .join('\n');
        return `<Worksheet ss:Name="${safeName}"><Table>${rowsXml}</Table></Worksheet>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11"/>
  </Style>
  <Style ss:ID="sHeader">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sTotal">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#065F46"/>
   <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 ${worksheetsXml}
</Workbook>`;
  };

  const escapeCsv = (val: CellVal): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const handleDownload = () => {
    const timestamp = getLocalTodayDateStr();
    const baseNameMap: Record<typeof reportType, string> = {
      consolidated: `Kinetix_Consolidado_Totales_${timestamp}`,
      credentials: `Kinetix_Credenciales_Control_${timestamp}`,
      body_comp: `Kinetix_Antropometria_Totales_${timestamp}`,
      evaluations: `Kinetix_Pruebas_Fisicas_Totales_${timestamp}`,
    };

    const primaryRows =
      reportType === 'credentials'
        ? buildCredentialsSheet()
        : reportType === 'body_comp'
        ? buildBodyCompSheet()
        : reportType === 'evaluations'
        ? buildEvaluationsSheet()
        : buildConsolidatedSheet();

    if (exportFormat === 'xml') {
      const sheets: { name: string; rows: CellVal[][] }[] = [];
      if (reportType === 'consolidated') {
        sheets.push({ name: 'Consolidado y Totales', rows: primaryRows });
        sheets.push({ name: 'Bioimpedancia Renpho', rows: buildBodyCompSheet() });
        sheets.push({ name: 'Pruebas Fisicas 1RM', rows: buildEvaluationsSheet() });
        if (includePasswords) {
          sheets.push({ name: 'Claves Acceso', rows: buildCredentialsSheet() });
        }
      } else {
        const titleMap = {
          credentials: 'Credenciales Staff',
          body_comp: 'Bioimpedancia Renpho',
          evaluations: 'Pruebas Fisicas 1RM',
        };
        sheets.push({ name: titleMap[reportType], rows: primaryRows });
      }

      const xmlContent = buildSpreadsheetXml(sheets);
      const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${baseNameMap[reportType]}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const csvContent = '\uFEFF' + primaryRows.map(r => r.map(escapeCsv).join(',')).join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${baseNameMap[reportType]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      onClose();
    }, 1600);
  };

  const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const isDownloadDisabled =
    (athleteScope === 'single' && !selectedAthleteId) ||
    (athleteScope === 'selected' && selectedAthleteIds.length === 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-brand">
                Exportar Excel XML / CSV Kinetix
              </h3>
              <p className="text-xs text-neutral-400">Hojas multi-pestaña con totales, promedios, todos o algunos atletas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {downloadSuccess ? (
          <div className="p-8 text-center space-y-2 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-white">¡Archivo Excel Descargado!</h4>
            <p className="text-xs text-neutral-400">
              El reporte con totales y promedios se ha guardado en tu dispositivo listo para abrir en Excel o Google Sheets.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Format selector: XML SpreadsheetML vs CSV */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-neutral-950 border border-neutral-800">
              <button
                type="button"
                onClick={() => setExportFormat('xml')}
                className={`py-2 px-3 rounded-xl font-bold transition-all text-center ${
                  exportFormat === 'xml'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span className="block">📊 Excel XML (.xls)</span>
                <span className="text-[10px] opacity-85 font-normal">Multi-hoja + Totales Dueños</span>
              </button>
              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`py-2 px-3 rounded-xl font-bold transition-all text-center ${
                  exportFormat === 'csv'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span className="block">📄 CSV Plano (.csv)</span>
                <span className="text-[10px] opacity-85 font-normal">Tabla única universal</span>
              </button>
            </div>

            {/* Report Type */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium block">
                Tipo de Reporte:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReportType('consolidated')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    reportType === 'consolidated'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white ring-1 ring-emerald-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Table className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Consolidado + Totales</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Todas las hojas + 5 pilares 1RM
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('credentials')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    reportType === 'credentials'
                      ? 'bg-amber-600/20 border-amber-500 text-white ring-1 ring-amber-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Claves y Control Staff</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Lista de contraseñas y contactos
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('body_comp')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    reportType === 'body_comp'
                      ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>Bioimpedancia Renpho</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Historial de peso, grasa y músculo
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('evaluations')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    reportType === 'evaluations'
                      ? 'bg-red-600/20 border-red-500 text-white ring-1 ring-red-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-red-400" />
                    <span>Pruebas Físicas (1RM)</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    5 pilares, Cooper, Navette y tiempos
                  </span>
                </button>
              </div>
            </div>

            {/* Athlete Scope Filter */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium block flex items-center justify-between">
                <span>¿De qué atletas exportar?</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  {targetAthletes.length} seleccionados
                </span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => { setAthleteScope('all'); setSelectedAthleteId(''); }}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    athleteScope === 'all'
                      ? 'bg-blue-600/20 border-blue-500 text-white font-bold ring-1 ring-blue-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="block text-[11px]">👥 Todos ({athletes.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAthleteScope('selected')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    athleteScope === 'selected'
                      ? 'bg-amber-600/20 border-amber-500 text-white font-bold ring-1 ring-amber-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="block text-[11px]">☑️ Algunos ({selectedAthleteIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAthleteScope('single')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    athleteScope === 'single'
                      ? 'bg-purple-600/20 border-purple-500 text-white font-bold ring-1 ring-purple-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="block text-[11px]">👤 1 Alumno</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setAthleteScope('color'); setSelectedAthleteId(''); }}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    athleteScope === 'color'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold ring-1 ring-emerald-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="block text-[11px]">📅 Por Corte</span>
                </button>
              </div>
            </div>

            {/* Multi-select "Algunos atletas" */}
            {athleteScope === 'selected' && (
              <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-700/60 flex-1">
                    <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar atleta..."
                      className="w-full bg-transparent text-white text-xs outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedAthleteIds(
                        selectedAthleteIds.length === athletes.length ? [] : athletes.map(a => a.id)
                      )
                    }
                    className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-[10px] font-bold text-neutral-200 shrink-0"
                  >
                    {selectedAthleteIds.length === athletes.length ? 'Limpiar' : 'Todos'}
                  </button>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {filteredAthletesList.map(ath => {
                    const checked = selectedAthleteIds.includes(ath.id);
                    return (
                      <button
                        key={ath.id}
                        type="button"
                        onClick={() => toggleMultiAthlete(ath.id)}
                        className={`w-full p-2 rounded-xl flex items-center justify-between text-left text-xs transition-colors ${
                          checked
                            ? 'bg-amber-600/20 border border-amber-500/60 text-white font-bold'
                            : 'hover:bg-neutral-900 border border-transparent text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                            checked ? 'bg-amber-500 border-amber-400 text-black' : 'border-neutral-600'
                          }`}>
                            {checked && <Check className="w-3 h-3" />}
                          </span>
                          <span className="truncate">{ath.name}</span>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono shrink-0">{ath.email}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* If Single Athlete Selected */}
            {athleteScope === 'single' && (
              <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-700/60">
                  <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar atleta por nombre o correo..."
                    className="w-full bg-transparent text-white text-xs outline-none"
                    autoFocus
                  />
                  {searchTerm && (
                    <button type="button" onClick={() => setSearchTerm('')} className="text-neutral-400 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                  {filteredAthletesList.map(ath => (
                    <button
                      key={ath.id}
                      type="button"
                      onClick={() => setSelectedAthleteId(ath.id)}
                      className={`w-full p-2 rounded-xl flex items-center justify-between text-left text-xs transition-colors ${
                        selectedAthleteId === ath.id
                          ? 'bg-blue-600/30 border border-blue-500 text-white font-bold'
                          : 'hover:bg-neutral-900 border border-transparent text-neutral-300'
                      }`}
                    >
                      <span className="truncate">{ath.name}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">{ath.email}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* If Color Group Selected (including Sin Corte = 0) */}
            {athleteScope === 'color' && (
              <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2 animate-fade-in">
                <div className="grid grid-cols-2 gap-2">
                  {[...OFFICIAL_COLORS, NO_CUTOFF_CONFIG].map(c => {
                    const count = athletes.filter(a => (a.membership.billingDayOfMonth ?? 15) === c.day).length;
                    const isSelected = selectedColorDay === c.day;
                    return (
                      <button
                        key={c.day}
                        type="button"
                        onClick={() => setSelectedColorDay(c.day)}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          isSelected ? c.btnActive : c.btnInactive
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-xs">
                          <span>{c.emoji} {c.colorName}</span>
                          <span className="text-[10px] font-mono">{count}</span>
                        </div>
                        <span className="text-[9px] opacity-80 block">
                          {c.day === 0 ? 'Sin corte (Cortesía / Familia)' : `Corte día ${c.day}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Date / Month Range Filter */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium block flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Rango de Fecha:</span>
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">Filtro Temporal</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setDateFilter('all')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    dateFilter === 'all'
                      ? 'bg-neutral-800 border-neutral-600 text-white font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>Historial Total</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDateFilter('current_month')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    dateFilter === 'current_month'
                      ? 'bg-neutral-800 border-neutral-600 text-white font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>Mes Actual</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDateFilter('specific_month')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    dateFilter === 'specific_month'
                      ? 'bg-neutral-800 border-neutral-600 text-white font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>Elegir Mes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDateFilter('current_year')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    dateFilter === 'current_year'
                      ? 'bg-neutral-800 border-neutral-600 text-white font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>Año {currentYearStr}</span>
                </button>
              </div>

              {dateFilter === 'specific_month' && (
                <div className="pt-2 animate-fade-in">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
                  >
                    {MONTHS.map((m, idx) => (
                      <option key={m} value={idx}>
                        Mes de {m} {currentYearStr}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Checkbox: Include credentials in consolidated */}
            {reportType === 'consolidated' && (
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePasswords}
                  onChange={(e) => setIncludePasswords(e.target.checked)}
                  className="rounded text-red-600 focus:ring-0 w-4 h-4"
                />
                <span className="text-neutral-300 text-xs">
                  Incluir columna/hoja de <strong>Contraseña / Clave de Acceso</strong> (Control exclusivo para Dueños)
                </span>
              </label>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-neutral-800 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloadDisabled}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{exportFormat === 'xml' ? 'Descargar Excel XML' : 'Descargar CSV'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
