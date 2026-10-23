'use client';
import { PATIO_VIDEO_REVIEW } from '@/lib/patio-video';
import { useState } from 'react';
import type { Element } from '@/lib/project';
import { PATIO_CONTROLS, patioControls, patioDimensions, patioDimensionsCsv, patioReferences } from '@/lib/patio';
import { feetLabel } from '@/lib/site-reference';

export default function PatioReview({elements,onSelect,onPlan}:{elements:Element[];onSelect:(id:string)=>void;onPlan:()=>void}) {
  const [reference,setReference]=useState(0),dims=patioDimensions(elements);
  const exportCsv=()=>{const url=URL.createObjectURL(new Blob([patioDimensionsCsv(elements)],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='Keystone-patio-cotas.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
  return <section className="patio-review"><h3>Cotas y comprobaciones</h3><p>Consulta el origen de cada cota o descarga los tramos del modelo. Las cotas estimadas requieren comprobación.</p>
    <details><summary>Fotos y videos de apoyo</summary><select aria-label="Referencia del patio" value={reference} onChange={e=>setReference(Number(e.target.value))}>{patioReferences.map((r,i)=><option key={r.path} value={i}>{r.label}</option>)}</select>
    <a href={patioReferences[reference].path} target="_blank" rel="noreferrer"><img src={patioReferences[reference].path} alt={patioReferences[reference].label}/></a></details>
    <details className="video-evidence"><summary>Revisión de los videos</summary><p>{PATIO_VIDEO_REVIEW.note}</p>{PATIO_VIDEO_REVIEW.observations.map(o=><article key={o.id}><a href={o.frame} target="_blank" rel="noreferrer"><img src={o.frame} alt={`${o.title} · ${o.file} ${o.seconds.toFixed(2)} s`}/></a><div><b>{o.title}</b><strong>{o.file} · {o.seconds.toFixed(2)} s</strong><small>{o.observation}</small><p>{o.model}</p></div></article>)}<a href="/references/patio-video/patio1-contact.jpg" target="_blank" rel="noreferrer">Ver fotogramas de patio1 ↗</a><a href="/references/patio-video/patio2-contact.jpg" target="_blank" rel="noreferrer">Ver fotogramas de patio2 ↗</a></details>
    <details><summary>Cotas del croquis · pies y pulgadas</summary>{patioControls(elements).map(c=><article key={c.label}><b>{c.label}</b><strong>{c.value}</strong><small>{c.source} · {c.use}</small></article>)}</details>
    <details><summary>{dims.length} lados calculados del modelo</summary><p>La lectura en pulgadas describe el modelo; solo «Comprobada» identifica una medida verificada. Las coordenadas completas se exportan sin redondear.</p>{elements.filter(e=>e.zone==='back'&&e.action!=='retirar').map(e=><article key={e.id}><button onClick={()=>{onSelect(e.id);onPlan()}}>{e.name} ↗</button><small>{feetLabel(e.width)} × {feetLabel(e.depth)} · {e.source}</small><div>{dims.filter(d=>d.elementId===e.id).map(d=><span key={d.id}>L{d.edge}: {d.label} · {d.source}</span>)}</div></article>)}</details>
    <button className="button outline full" onClick={exportCsv}>Descargar todas las cotas · CSV</button><p className="patio-accuracy">Ajuste del editor: 1″. Resolución nominal de ortofoto: 3″/píxel. Faltan cierre del contorno, borde del vaso, niveles y apoyos de la madera.</p>
  </section>;
}
