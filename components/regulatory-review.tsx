'use client';
import { useState } from 'react';
import { Download, ExternalLink, Search, ShieldCheck } from 'lucide-react';
import { LEGAL_CATALOG, regulatoryFindings, regulatorySource } from '@/lib/regulations';
import type { Project, Proposal } from '@/lib/project';

export default function RegulatoryReview({ project, proposal, onCheck }: { project: Project; proposal: Proposal; onCheck: (id: string, value: boolean) => void }) {
  const [search, setSearch] = useState(''), [category, setCategory] = useState('Todos');
  const findings = regulatoryFindings(project, proposal);
  const documents = LEGAL_CATALOG.documents.filter(d => (category === 'Todos' || d.category === category) && `${d.title} ${d.scope} ${d.authority}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es')));
  return <section className="work-section regulatory-review" id="normativa">
    <div className="content-section-title"><h3><ShieldCheck size={19}/> Normativa y expediente oficial</h3><span>North Miami · revisión {LEGAL_CATALOG.reviewedAt}</span></div>
    <p className="muted">Revisión preliminar del diseño activo. Los documentos preparados y las alertas se mantienen separados de la aprobación municipal.</p>
    <div className="regulatory-summary"><b>{findings.filter(f => f.status === 'alert').length} alertas de diseño</b><span>{findings.filter(f => f.status === 'pending').length} comprobaciones pendientes</span><a className="button outline" href="/legal/expediente-oficial.zip" download><Download size={14}/>Descargar documentos oficiales</a></div>
    <div className="regulatory-findings">{findings.map(f => <article key={f.id} className={`regulatory-finding ${f.status}`}>
      <span className="source-badge">{f.status === 'alert' ? 'Alerta de diseño' : f.status === 'pending' ? 'Pendiente de evidencia' : 'Revisión técnica'}</span>
      <h4>{f.title}</h4><p>{f.detail}</p><div className="regulatory-links">{f.sources.map(id => { const src = regulatorySource(id); return src && <a key={id} href={src.url} target="_blank" rel="noreferrer">{src.title}<ExternalLink size={11}/></a>; })}</div>
      <label className="evidence-check"><input type="checkbox" checked={!!project.checklist[`legal:${f.id}`]} onChange={e => onCheck(`legal:${f.id}`, e.target.checked)}/> Documentación preparada para revisión</label>
    </article>)}</div>
    <details className="legal-library" open><summary>Biblioteca oficial · {LEGAL_CATALOG.documents.length} referencias</summary>
      <div className="legal-filters"><label><Search size={15}/><input aria-label="Buscar documentación oficial" value={search} placeholder="Buscar leyes, formas o instrucciones…" onChange={e => setSearch(e.target.value)}/></label><select aria-label="Tipo de documento legal" value={category} onChange={e => setCategory(e.target.value)}>{['Todos', 'Leyes', 'Formularios', 'Instrucciones'].map(c => <option key={c}>{c}</option>)}</select><a href="/legal/catalog.json" download>Índice y huellas SHA-256</a></div>
      <div className="legal-documents">{documents.map(d => {
        const archive = d as typeof d & { localPath?: string; archiveStatus?: string; sha256?: string };
        return <article key={d.id}><div><span className="source-badge">{d.category}</span><small>{d.authority}</small></div><h4>{d.title}</h4><p>{d.scope}</p><details><summary>Aplicación y versión</summary><p>{d.note}</p><small>Consultado: {d.reviewedAt}</small>{archive.sha256 && <code>SHA-256 {archive.sha256}</code>}</details><footer><a href={d.url} target="_blank" rel="noreferrer">Fuente oficial <ExternalLink size={12}/></a>{archive.archiveStatus === 'archived' && archive.localPath && <a href={archive.localPath} download><Download size={12}/>PDF archivado</a>}</footer></article>;
      })}</div>{!documents.length && <p>No hay documentos que coincidan con la búsqueda.</p>}
    </details>
    <p className="muted">{LEGAL_CATALOG.coverage} Las copias PDF conservan el original. Los códigos completos y sus enmiendas se consultan en las fuentes enlazadas; el archivo descargable contiene los formularios y paquetes disponibles.</p>
  </section>;
}
