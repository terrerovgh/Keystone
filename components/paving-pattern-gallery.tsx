'use client';
import { useId, useMemo, useState } from 'react';
import { Check, PenLine, RotateCcw } from 'lucide-react';
import type { Proposal, Zone } from '@/lib/project';
import { area, bounds, pathData } from '@/lib/geometry';
import { defaultPavingPattern, proposePavingPattern, patternDomain, patternGrass } from '@/lib/paving-patterns';
import { worldLinePoints } from '@/lib/line-geometry';
import { PATTERN_FAMILIES, PAVING_PATTERNS, validPavingPattern, type PavingPatternConfig, type PavingPatternFamily } from '@/lib/paving-pattern-config';

function PatternNumber({ label, value, min, max, step = 1, unit, onCommit }: {
  label: string; value: number; min: number; max: number; step?: number; unit: string; onCommit: (n: number) => boolean;
}) {
  const [draft, setDraft] = useState(String(Math.round(value * 1000) / 1000));
  const [invalid, setInvalid] = useState(false);
  function commit() {
    const n = draft.trim() ? Number(draft) : NaN;
    if (!Number.isFinite(n) || n < min || n > max) { setInvalid(true); return; }
    setInvalid(false);
    if (Math.abs(n - value) > 1e-5 && !onCommit(n)) setDraft(String(Math.round(value * 1000) / 1000));
  }
  return <label className="pattern-number"><span>{label}</span><div><input aria-label={label} aria-invalid={invalid}
    type="number" value={draft} min={min} max={max} step={step} onChange={e => { setDraft(e.target.value); setInvalid(false); }}
    onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setDraft(String(value)); setInvalid(false); e.stopPropagation(); } }}/><small>{unit}</small></div>
    {invalid && <em>Entre {min} y {max} {unit}.</em>}</label>;
}

export default function PavingPatternGallery({ proposal, zone, onApply, onEdit }: {
  proposal: Proposal; zone: Zone; onApply: (config: PavingPatternConfig) => boolean; onEdit: () => void;
}) {
  const current = proposal.pavingPatterns?.[zone];
  const [options, setOptions] = useState(() => current ?? defaultPavingPattern(proposal, zone, 'greca'));
  const [family, setFamily] = useState<PavingPatternFamily>(() => PAVING_PATTERNS.find(p => p.id === current?.id)?.family ?? 'grecas');
  const [showWholeArea, setShowWholeArea] = useState(false);
  const [previewMode, setPreviewMode] = useState<'lines' | 'floor'>('floor');
  const [error, setError] = useState('');
  const svgId = useId().replace(/:/g, '');
  const domain = useMemo(() => patternDomain(proposal, zone), [proposal, zone]);
  const b = bounds(domain), padding = Math.max(b.maxX - b.x, b.maxZ - b.z) * .05;
  const frame = `${b.x - padding} ${b.z - padding} ${Math.max(1, b.maxX - b.x + padding * 2)} ${Math.max(1, b.maxZ - b.z + padding * 2)}`;
  const previews = useMemo(() => PAVING_PATTERNS.filter(p => p.family === family).map(pattern => {
    try {
      const { config,design,suggested } = proposePavingPattern(proposal,zone,{ ...options,id: pattern.id }), lines = design.lines;
      const grass = patternGrass(proposal, zone, lines);
      return { ...pattern, config, grass, lines, design, suggested, error: '' };
    } catch (e) { return { ...pattern, config: { ...options,id: pattern.id }, grass: [], lines: [], design: null, suggested: false, error: (e as Error).message }; }
  }), [options, proposal, zone, family]);
  const commonFocus = bounds(previews.flatMap(pattern => pattern.design?.bays.flat() ?? []));
  const savedLines = proposal.elements.filter(e => e.id.startsWith(`preset-${zone}-`));
  const applied = previews.find(p => p.id === current?.id);
  const fitsSaved = (pattern: typeof previews[number]) => current?.layoutVersion === 2 && pattern.id === current.id &&
    JSON.stringify(pattern.lines.map(e => worldLinePoints(e))) === JSON.stringify(savedLines.map(e => worldLinePoints(e)));
  const report = applied?.design ? applied : previews.find(p => p.design);
  function apply(config: PavingPatternConfig) {
    if (onApply(config)) { setOptions(config); setError(''); return true; }
    setError('No se aplicó el cambio. Se conservan los valores anteriores.'); return false;
  }
  function update(patch: Partial<PavingPatternConfig>) {
    const next = { ...options, ...patch };
    try {
      if (!validPavingPattern(next)) throw new Error('La separación debe ser al menos tres veces el ancho del césped.');
      if (current) return apply(next);
      setOptions(next); setError(''); return true;
    } catch (e) { setError((e as Error).message); return false; }
  }
  return <div className="paving-pattern-gallery">
    <p className="eyebrow">DISEÑO DEL PAVIMENTO · {zone === 'front' ? 'DRIVEWAY' : 'PATIO'}</p>
    <h2>Diseños para tu área de concreto</h2>
    <p className="pattern-intro">Cada opción calcula los paños libres, equilibra márgenes y ajusta el número y tamaño de los motivos. El diseño sigue los ejes del acceso y respeta la piscina y los jardines.</p>
    <div className="pattern-browse-controls">
      <div className="pattern-family-tabs" role="group" aria-label="Familias de patrones">{PATTERN_FAMILIES.map(item => <button key={item.id} className={family === item.id ? 'active' : ''}
        aria-pressed={family === item.id} onClick={() => setFamily(item.id)}>{item.name}<span>{PAVING_PATTERNS.filter(p => p.family === item.id).length}</span></button>)}</div>
      <div className="pattern-preview-toggle" role="group" aria-label="Vista previa del patrón">
        <button aria-pressed={previewMode === 'lines'} className={previewMode === 'lines' ? 'active' : ''} onClick={() => setPreviewMode('lines')}>Solo líneas</button>
        <button aria-pressed={previewMode === 'floor'} className={previewMode === 'floor' ? 'active' : ''} onClick={() => setPreviewMode('floor')}>Sobre el plano</button>
      </div>
      <label className="pattern-whole-area"><input type="checkbox" checked={showWholeArea} onChange={e => setShowWholeArea(e.target.checked)}/>Mostrar toda el área</label>
    </div>
    <p className="pattern-preview-note">Acercamiento a los paños diseñados sobre tu plano. Los motivos principales quedan completos; los paños secundarios usan acentos lineales y los pasos estrechos se conservan lisos. Activa Mostrar toda el área para ver el conjunto.</p>
    <div className="pattern-layout"><div className="pattern-cards" role="group" aria-label="Patrones de líneas de césped">
      {previews.map((pattern, i) => {
        const focus = !showWholeArea && commonFocus.maxX > commonFocus.x ? commonFocus : b;
        const gap = Math.max(focus.maxX - focus.x,focus.maxZ - focus.z) * .13;
        const previewFrame = showWholeArea || !pattern.design ? frame : `${focus.x - gap} ${focus.z - gap} ${focus.maxX - focus.x + gap * 2} ${focus.maxZ - focus.z + gap * 2}`;
        return <button key={pattern.id} className={`pattern-card ${fitsSaved(pattern) ? 'selected' : ''}`}
        aria-pressed={fitsSaved(pattern)} aria-label={`Aplicar ${pattern.name}`} disabled={!!pattern.error} title={pattern.error || pattern.description}
        onClick={() => apply(pattern.config)}>
        <div className={`pattern-thumbnail ${previewMode === 'lines' ? 'pattern-lines-only' : ''}`}><svg viewBox={previewFrame} aria-hidden="true">
          <defs><pattern id={`${svgId}-${i}`} width=".35" height=".35" patternUnits="userSpaceOnUse"><rect width=".35" height=".35" fill={proposal.settings.concreteColor}/><circle cx=".1" cy=".1" r=".013" fill="#99988e"/></pattern></defs>
          {previewMode === 'floor' ? <><path d={pathData(domain)} fill={`url(#${svgId}-${i})`} fillRule="evenodd"/>
            <path d={pathData(pattern.grass)} fill={proposal.settings.turf === 'natural' ? '#78935c' : '#647e49'} fillRule="evenodd"/></>
            : <><path d={pathData(domain)} fill="none" stroke="#c9d2bf" strokeWidth=".15"/>{pattern.lines.map(line => <path key={line.id} d={`M${worldLinePoints(line).map(p => p.join(',')).join('L')}`} fill="none" stroke="#526d43" strokeWidth={line.lineWidth} strokeLinejoin="miter"/>)}</> }
        </svg><span className="pattern-number-tag">{String(i + 1).padStart(2,'0')}</span>{pattern.id.startsWith('greca-mix-') && <span className="pattern-combined-tag">Combinado</span>}{fitsSaved(pattern) && <span className="pattern-selected"><Check size={13}/>Aplicado</span>}</div>
        <strong>{pattern.name}</strong><span>{pattern.error || pattern.description}</span>{pattern.design && <span className="pattern-fit-summary">{pattern.design.bays.length} paños · {pattern.design.accents ? <>{pattern.design.motifs} motivos · {pattern.design.accents} acentos lineales</> : <>{pattern.design.compositions} composiciones completas</>}{pattern.suggested && <> · Ancho propuesto {(pattern.config.width * 12).toFixed(0)} in</>}</span>}
      </button>; })}
    </div><aside className="pattern-adjustments" aria-label="Ajustes del patrón">
      <span className="eyebrow">AJUSTA EL DISEÑO</span><h3>{current ? PAVING_PATTERNS.find(p => p.id === current.id)?.name : 'Proporciones iniciales'}</h3>
      <p>El tamaño y la repetición se ajustan a cada paño. Si hace falta una línea más fina para equilibrar el diseño, la tarjeta muestra el ancho propuesto.</p>
      <div className="pattern-fields">
        <PatternNumber key={`width-${options.width}`} label="Ancho del césped" value={options.width * 12} min={1} max={24} unit="in" onCommit={n => update({ width: n / 12 })}/>
        <PatternNumber key={`spacing-${options.spacing}`} label="Escala deseada" value={options.spacing} min={3} max={20} step={.5} unit="ft" onCommit={n => update({ spacing: n })}/>
        <PatternNumber key={`angle-${options.angle}`} label="Giro del patrón" value={options.angle} min={-90} max={90} step={5} unit="°" onCommit={n => update({ angle: n })}/>
        <PatternNumber key={`x-${options.offsetX}`} label="Desplazamiento X" value={options.offsetX} min={-20} max={20} step={.5} unit="ft" onCommit={n => update({ offsetX: n })}/>
        <PatternNumber key={`z-${options.offsetZ}`} label="Desplazamiento Y" value={options.offsetZ} min={-20} max={20} step={.5} unit="ft" onCommit={n => update({ offsetZ: n })}/>
      </div>
      <button className="text-button" onClick={() => {
        const next = defaultPavingPattern(proposal, zone, options.id);
        if (current) apply(next); else setOptions(next);
      }}><RotateCcw size={13}/>Restablecer proporciones</button>
      {current && <button className="button outline full pattern-recalculate" onClick={() => apply(applied?.design ? applied.config : { ...options,layoutVersion: 2 })}>Recalcular para mi área</button>}
      {error && <p className="pattern-error" role="alert">{error}</p>}
      <div className="pattern-area"><span>Pavimento disponible</span><b>{area(domain).toLocaleString('es-US', { maximumFractionDigits: 1 })} <small>ft²</small></b></div>
      {report?.design && <section className="pattern-fit-report" aria-label="Distribución calculada">
        <h4>Distribución calculada</h4><p>{report.name}</p>
        <dl><div><dt>Paños diseñados</dt><dd>{report.design.bays.length}</dd></div><div><dt>Composiciones enteras</dt><dd>{report.design.compositions}</dd></div>{report.design.accents > 0 && <div><dt>Acentos lineales</dt><dd>{report.design.accents}</dd></div>}<div><dt>Ancho de la propuesta</dt><dd>{Math.round(report.config.width * 12)} in</dd></div><div><dt>Borde libre mínimo</dt><dd>{Math.round(report.design.border * 12)} in</dd></div></dl>
        <ol>{report.design.bays.map((polygon,i) => { const ring = polygon[0][0], w = Math.hypot(ring[1][0] - ring[0][0],ring[1][1] - ring[0][1]), h = Math.hypot(ring[2][0] - ring[1][0],ring[2][1] - ring[1][1]); return <li key={i}>Paño {i + 1}: {w.toFixed(1)} × {h.toFixed(1)} ft</li>; })}</ol>
        <small>Dimensiones calculadas del plano de estudio. Verificar sus medidas en sitio.</small>
      </section>}
      {current && <button className="button dark full" onClick={onEdit}><PenLine size={14}/>Editar líneas en el plano</button>}
      <p className="pattern-save-note" role="status">{current ? applied && fitsSaved(applied) ? 'Composición aplicada. Puedes deshacer cada cambio.' : 'Selecciona la tarjeta o recalcula para ajustar el diseño guardado al área actual.' : proposal.pavingPatterns?.front || proposal.pavingPatterns?.back ? 'El patrón se aplicará a esta zona de la alternativa activa.' : 'La primera selección crea una alternativa y conserva tu propuesta anterior.'}</p>
      <p className="pattern-save-note">Al regenerar se sustituyen las líneas del patrón; las líneas manuales añadidas después se conservan.</p>
    </aside></div>
  </div>;
}
