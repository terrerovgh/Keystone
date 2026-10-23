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
  {path:'/references/listing/plano-publicado.png',label:'Plano público · terraza en L y escalera central'},
  {path:'/references/listing/piscina-publicada.png',label:'Foto pública · piscina, porche y canal'},
  {path:'/references/listing/escalera-central-publicada.png',label:'Foto pública · centro, dos alas y escalera'},
  {path:'/references/listing/muelle-lateral-publicado.png',label:'Foto pública · muelle inferior y transiciones'},
  {path:'/references/listing/patio-hacia-canal.png',label:'Foto pública · deck hacia el canal'},
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

export function patioControls(elements:Element[]){
 if(!elements.some(e=>e.style==='covered-terrace'))return PATIO_CONTROLS;
 return [
  {label:'Fondo izquierdo',value:'37′ = 444″',source:'Croquis',use:'Aplicado al lado de piscina entre frente del ala izquierda y límite superior del muelle.'},
  {label:'Fondo derecho',value:'27′ = 324″',source:'Croquis',use:'Aplicado entre frente posterior del ala derecha y límite superior del muelle. Diferencia de alas: 10 ft.'},
  {label:'Ancho interpretado',value:'16′ + 50′ = 66′',source:'Croquis',use:'Se toman como segmentos contiguos a lo ancho. El corte de 16 ft pasa por el borde derecho del agua. Esta asignación de extremos es una hipótesis.'},
  {label:'Márgenes de piscina',value:'4′ lateral / 5′ al canal',source:'Croquis',use:'Situados hasta el agua, no hasta el exterior de la coronación. Ancho de coronación 6 in estimado.'},
  {label:'Vaso / borde exterior',value:'12′ × 27′ / 13′ × 28′',source:'Estimada',use:'Derivados del cierre y de la proporción en el plano publicado y la ortofoto. El margen de 5 ft a la casa es inferido.'},
  {label:'Saliente del muelle',value:'15′ × 5′',source:'Croquis',use:'Aplicado en la plataforma inferior. Ubicación central inferida del plano público.'},
  {label:'Casa a patio',value:'+28″ → 0″ · 4 × 7″',source:'Estimada',use:'Cuatro contrahuellas de trabajo; plataforma y escalones de terracota. Cuenta y niveles por medir.'},
  {label:'Patio a muelle',value:'0″ → −14″ · 2 × 7″',source:'Estimada',use:'Muelle inferior confirmado por el propietario; descenso y dos contrahuellas estimados.'},
 ];
}
