import { PATIO_VIDEO_REVIEW } from './patio-video';
import type { Element } from './project';
import { edgeDimensions } from './engineering';
import { feetLabel } from './site-reference';

export const patioReferences = [
  {path:'/photos/patio.jpg',label:'Propietario · terraza hacia el canal'},
  {path:'/photos/piscina.jpg',label:'Propietario · piscina y borde de madera'},
  {path:'/photos/comedor.jpg',label:'Propietario · comedor alto y cocina'},
  {path:'/photos/croquis-patio.jpg',label:'Croquis original · cotas del patio'},
  {path:'/references/ortofoto-oficial.png',label:'Ortofoto oficial · distribución general'},
  {path:'/photos/aerea-patio.png',label:'Vista aérea oblicua · cubiertas y terraza'},
  ...PATIO_VIDEO_REVIEW.observations.map(o=>({path:o.frame,label:`${o.file} · ${o.seconds.toFixed(2)} s · ${o.title}`})),
];
export const PATIO_CONTROLS = [
  {label:'Lado del croquis junto a piscina',value:'37′ = 444″',source:'Croquis',use:'Cota legible. Orientación y extremos sobre la huella actual pendientes; no se fuerza el perímetro GIS a esta longitud.'},
  {label:'Retorno del croquis',value:'16′ = 192″',source:'Croquis',use:'Lectura junto al margen de 5′. Falta identificar ambos extremos en campo.'},
  {label:'Lado opuesto del croquis',value:'27′ = 324″',source:'Croquis',use:'Cota legible, pendiente de correspondencia con el extremo derecho del patio.'},
  {label:'Tramo hacia el canal',value:'50′ = 600″',source:'Croquis',use:'La imagen no establece inequívocamente el inicio de la cota; no se suma al tramo de 16′ sin confirmación.'},
  {label:'Márgenes junto a piscina',value:'4′ = 48″ · 5′ = 60″',source:'Croquis',use:'Son separaciones dibujadas, no el ancho ni el largo del vaso. Pendiente confirmar si parten del agua o del borde exterior.'},
  {label:'Saliente posterior',value:'15′ × 5′ = 180″ × 60″',source:'Croquis',use:'Lectura conservada. Identificación como muelle y posición exacta pendientes.'},
  {label:'Piscina en el modelo',value:'13′ × 26′ = 156″ × 312″',source:'Estimada',use:'Estimación previa de fotos y ortofoto. Borde de madera visible; ancho de coronación y profundidad sin medir.'},
  {label:'Ortofoto y huella de casa',value:'Píxel nominal 3″ · huella 2015',source:'Referencia GIS',use:'Permiten contrastar piscina, alas, deck y canal. Resolución de imagen no equivale a exactitud topográfica.'},
];
export function patioDimensions(elements:Element[]) {
  return elements.filter(e=>e.zone==='back'&&e.action!=='retirar').flatMap(e=>edgeDimensions(e).map((edge,i)=>({
    id:`${e.id}:${i}`,elementId:e.id,name:e.name,edge:i+1,...edge,label:feetLabel(edge.length),inches:edge.length*12,
  })));
}
export function patioDimensionsCsv(elements:Element[]) {
  const cell=(v:unknown)=>`"${String(v).replaceAll('"','""')}"`;
  return '\uFEFF'+[['Elemento','Lado','Longitud ft','Longitud in (calculada)','Pies y pulgadas (redondeado)','Origen','X inicial ft','Y inicial ft','X final ft','Y final ft','Estado'],
    ...patioDimensions(elements).map(d=>[d.name,d.edge,d.length,d.inches,d.label,d.source,...d.a,...d.b,d.source==='Comprobada'?'Medida comprobada':'Pendiente de comprobación en sitio'])].map(r=>r.map(cell).join(',')).join('\n');
}
