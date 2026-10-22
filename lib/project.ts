export type Point = [number, number];
export type Zone = 'front' | 'back';
export type Kind = 'paving' | 'garden' | 'path' | 'pool' | 'house' | 'palm' | 'furniture' | 'dock' | 'stairs';
export type Source = 'Comprobada' | 'Croquis' | 'Estimada';
export interface Element {
  id: string; name: string; zone: Zone; kind: Kind; x: number; z: number;
  width: number; depth: number; rotation: number; elevation: number; height: number;
  shape: 'rect' | 'ellipse' | 'polygon'; points?: Point[]; color: string;
  locked: boolean; action: 'conservar' | 'retirar' | 'nuevo' | 'trasladar';
  source: Source; note: string; support: 'terreno' | 'elevado' | 'por verificar';
}
export interface Settings {
  tile: number; gap: number; angle: number; gridX: number; gridZ: number;
  thickness: number; backThickness: number; base: number; excavation: number;
  demolitionFront: number; demolitionBack: number; waste: number; looseFactor: number;
  turf: 'artificial' | 'natural'; method: 'vaciado' | 'prefabricado'; concreteColor: string;
  rollWidth: number; rollLength: number; soil: number; crew: number; hours: number;
  productivity: number; curingDays: number; overhead: number; contingency: number; tax: number;
}
export interface Rate { value: number | null; source: string; date: string; url?: string }
export interface Measure { id: string; label: string; value: string; source: Source; note: string }
export interface Proposal { id: string; name: string; description: string; elements: Element[]; settings: Settings; exceptions: Record<string, 'turf' | 'concrete'> }
export interface Project {
  schemaVersion: 1; title: string; address: string; activeId: string; proposals: Proposal[];
  existing: Element[];
  rates: Record<string, Rate>; measures: Measure[]; checklist: Record<string, boolean>; updatedAt: string;
}
export const SOURCES = [
  { title: 'North Miami · Requisitos de entrada vehicular', url: 'https://www.northmiamifl.gov/DocumentCenter/View/22254/Driveway-Permit-Checklist-PDF', note: 'Levantamiento firmado, dimensiones y revisión municipal.' },
  { title: 'North Miami · Detalles y restricciones', url: 'https://www.northmiamifl.gov/DocumentCenter/View/22054', note: 'Confirmar clasificación de la cuadrícula; el documento excluye «concrete strips». Contiene detalles que deben conciliarse con la solución final.' },
  { title: 'Miami-Dade · Superficies y drenaje', url: 'https://www.miamidade.gov/global/economy/environment/impervious-surface.page', note: 'North Miami gestiona la revisión de pavimentación residencial indicada en esta página.' },
];
const baseSettings: Settings = {
  tile: 4, gap: 0.5, angle: 0, gridX: 0, gridZ: 0,
  thickness: 6, backThickness: 4, base: 6, excavation: 10,
  demolitionFront: 2.5, demolitionBack: 1, waste: 10, looseFactor: 1.2,
  turf: 'artificial', method: 'vaciado', concreteColor: '#d8d4ca',
  rollWidth: 15, rollLength: 100, soil: 4, crew: 3, hours: 8,
  productivity: 100, curingDays: 7, overhead: 0, contingency: 10, tax: 0,
};
function el(id: string, name: string, kind: Kind, zone: Zone, x: number, z: number, width: number, depth: number, extra: Partial<Element> = {}): Element {
  return { id, name, kind, zone, x, z, width, depth, rotation: 0, elevation: 0,
    height: kind === 'palm' ? 24 : 0.15, shape: 'rect', color: '#80906c',
    locked: false, action: 'nuevo', source: 'Estimada', note: 'Posición y medidas aproximadas; comprobar en sitio.', support: 'terreno', ...extra };
}
export function createProject(): Project {
  const elements: Element[] = [
    el('front-floor', 'Entrada y medialuna', 'paving', 'front', 4, 8, 64, 29, {
      shape: 'polygon', points: [[0,0],[64,0],[64,17],[44,17],[44,23],[33,23],[33,17],[14.333,17],[14.333,29],[0,29]],
      source: 'Croquis', note: 'Ancho parcial 14′ 4″ y tramo 37′ del croquis. Contorno general reconstruido; falta cierre de medidas.' }),
    el('entry-left','Acceso izquierdo','paving','front',4,-2,12,10,{source:'Croquis',note:'12′ y 10′ leídos en el croquis. Límite público y transiciones por comprobar.'}),
    el('entry-right','Acceso derecho','paving','front',56,-2,12,10,{source:'Croquis',note:'12′ y 10′ leídos en el croquis. Límite público y transiciones por comprobar.'}),
    el('garden-left','Jardinera central · izquierda','garden','front',23,8,11,12,{shape:'polygon',points:[[0,0],[11,0],...Array.from({length:25},(_,i)=>{const x=11-i*11/24;return [x,12*Math.sqrt(Math.max(0,1-((x-13)/13)**2))] as Point})],color:'#829775'}),
    el('garden-right','Jardinera central · derecha','garden','front',38,8,11,12,{shape:'polygon',points:[[0,0],[11,0],...Array.from({length:25},(_,i)=>{const x=11-i*11/24;return [x,12*Math.sqrt(Math.max(0,1-((x+2)/13)**2))] as Point})],color:'#829775'}),
    el('central-path','Camino a la entrada','path','front',34,8,4,29,{color:'#d8d4ca',note:'Camino propuesto de 4′, conectado al frente de la casa; ajustar al acceso real.'}),
    el('palm-left','Palma conservada · izquierda','palm','front',25,13,2,2,{action:'trasladar',color:'#627a52'}),
    el('palm-right','Palma conservada · derecha','palm','front',45,13,2,2,{action:'trasladar',color:'#627a52'}),
    el('palm-remove','Palma sin hojas','palm','front',28,16,1.5,1.5,{action:'retirar',color:'#937e68'}),
    el('side-garden-left','Jardinera lateral izquierda','garden','front',0,20,4,17),
    el('side-garden-right','Jardinera lateral derecha','garden','front',68,12,5,24),
    el('house','Casa existente','house','front',6,37,63,43,{locked:true,action:'conservar',height:25,color:'#ded3bf',note:'Volumen visual basado en fotos; huella y alturas estimadas.'}),
    el('back-floor','Patio y contorno de piscina','paving','back',4,82,66,37,{
      shape:'polygon',points:[[0,0],[24,0],[24,10],[66,10],[66,37],[0,37]],support:'por verificar',source:'Estimada',
      note:'Reconstrucción provisional. Lecturas 37′, 27′, 16′ y 50′ no cierran por sí solas el perímetro.'}),
    el('pool','Piscina existente','pool','back',9,85,13,26,{locked:true,action:'conservar',height:0.3,color:'#75b5b5',note:'13′ × 26′ estimados de fotos; 4′ y 5′ del croquis parecen separaciones, no dimensiones de piscina.'}),
    el('back-garden','Jardinera junto a piscina','garden','back',4,82,3,33),
    el('back-garden-right','Jardinera del canal','garden','back',55,115,15,4),
    el('steps','Escalones existentes','stairs','back',29,87,14,5,{locked:true,action:'conservar',height:1.5,color:'#b18c70',support:'elevado'}),
    el('dock','Muelle conservado','dock','back',28,119,15,5,{locked:true,action:'conservar',source:'Croquis',color:'#89705a',support:'elevado',note:'15′ × 5′ del croquis: identificación como muelle pendiente de confirmar.'}),
    el('table','Mesa exterior','furniture','back',43,99,9,3.5,{action:'conservar',height:3,color:'#8b8272'}),
    el('chair-1','Tumbona 01','furniture','back',25,99,2.5,6,{action:'conservar',height:1.5,color:'#e5dfd1'}),
    el('chair-2','Tumbona 02','furniture','back',29,99,2.5,6,{action:'conservar',height:1.5,color:'#e5dfd1'}),
    el('back-palm','Palma del patio','palm','back',55,114,2,2,{action:'conservar'}),
  ];
  const straight = structuredClone(elements);
  straight.filter(e=>e.id==='garden-left'||e.id==='garden-right').forEach(e=>{e.shape='rect';e.depth=9;e.width=10;e.z=10});
  const rates: Record<string, Rate> = {};
  for (const key of ['demo-paver','demo-wood','excavate','base','concrete','precast','turf-artificial','turf-natural','soil','edging','forms','fixings','irrigation','labor','equipment','transport','disposal','permits','palm-remove','palm-move','survey','drainage','reinforcement','support']) rates[key]={value:null,source:'Pendiente de cotización',date:'2026-10-22'};
  rates.concrete={value:192.5,source:'Referencia regional: punto medio de $165–220/yd³; mezcla y recargos por confirmar.',url:'https://bedrockcig.com/articles/concrete-mix-design-florida-psi-slump-admixtures',date:'2026-10-22'};
  rates['turf-artificial']={value:2.29,source:'Referencia minorista fuera de Florida: Colorado 95 oz, $2.29/ft² de material. Entrega, impuestos y aptitud para este proyecto por confirmar.',url:'https://affordableturf.us/',date:'2026-10-22'};
  rates['turf-natural']={value:.29,source:'Referencia de oferta Attila Sod: $145 por pallet de 500 ft² ($0.29/ft²). Sujeto a vigencia, variedad, transporte y compra por pallet; no incluye instalación.',url:'https://www.attilasod.com/offers/',date:'2026-10-22'};
  const existing=structuredClone(elements).filter(e=>!['central-path','garden-left','garden-right'].includes(e.id));
  existing.push(el('old-center','Jardinera central existente','garden','front',23,8,25,12,{shape:'ellipse',action:'conservar'}));
  existing.forEach(e=>{e.action='conservar';if(e.id==='palm-left'){e.x=34;e.z=14;}if(e.id==='palm-right'){e.x=44;e.z=15;}if(e.kind==='paving')e.color=e.zone==='front'?'#ba9d89':'#89705a'});
  return {schemaVersion:1,title:'Keystone Residence',address:'2331 Keystone Blvd · North Miami, FL',activeId:'curves',existing,
    proposals:[{id:'curves',name:'01 · Curvas suaves',description:'La medialuna se abre a un camino central.',elements,settings:{...baseSettings},exceptions:{}},
      {id:'lines',name:'02 · Líneas puras',description:'Jardineras rectas y una entrada más geométrica.',elements:straight,settings:{...baseSettings},exceptions:{}}],rates,
    measures:[
      {id:'m1',label:'Frente · tramo izquierdo',value:'37′',source:'Croquis',note:'Confirmar extremos del tramo.'},
      {id:'m2',label:'Frente · ancho de acceso interior izquierdo',value:'14′ 4″',source:'Croquis',note:'Lectura clara; ubicar sus extremos en sitio.'},
      {id:'m3',label:'Accesos desde calle',value:'12′ × 10′ cada uno',source:'Croquis',note:'Verificar apertura, curvas y separación de acera.'},
      {id:'m4',label:'Jardinera central',value:'25′',source:'Croquis',note:'Confirmar ancho, profundidad y ancho del nuevo camino.'},
      {id:'m5',label:'Lateral derecho',value:'4′ 8″ / 35′ / 25′ 7″',source:'Croquis',note:'Lecturas provisionales; confirmar 35′ y ubicación.'},
      {id:'m6',label:'Patio · contorno',value:'37′ / 27′ / 16′ / 50′',source:'Croquis',note:'Determinar a qué tramo corresponde cada número; falta cerrar el contorno.'},
      {id:'m7',label:'Piscina · dimensiones',value:'13′ × 26′ aprox.',source:'Estimada',note:'Medir largo y ancho exterior incluyendo borde. No confundir con márgenes 4′ y 5′.'},
      {id:'m8',label:'Patio · saliente',value:'15′ × 5′',source:'Croquis',note:'Confirmar si corresponde al muelle o a otra plataforma.'},
      {id:'m9',label:'Niveles y apoyos',value:'Pendiente',source:'Estimada',note:'Alturas de puertas, piscina, acera, plataforma, terreno y puntos de salida de agua.'},
      {id:'m10',label:'Límites de propiedad',value:'Pendiente de survey',source:'Estimada',note:'El marco del modelo es visual; no define linderos legales.'},
    ],checklist:{},updatedAt:new Date().toISOString()};
}
export const activeProposal=(p:Project)=>p.proposals.find(x=>x.id===p.activeId)??p.proposals[0];
export const fmt=(n:number,d=1)=>new Intl.NumberFormat('es-US',{maximumFractionDigits:d}).format(n);
export const usd=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
export function validProject(raw: unknown): raw is Project {
  if(!raw || typeof raw!=='object')return false;
  const p=raw as Project;
  const str=(s:unknown,max=250)=>typeof s==='string'&&s.length<=max;
  const finite=(n:unknown,min=-1000,max=1000)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
  const obj=(o:unknown)=>!!o&&typeof o==='object'&&!Array.isArray(o);
  const validElement=(e:Element)=>obj(e)&&str(e.id,120)&&str(e.name,120)&&str(e.note,1000)&&['paving','garden','path','pool','house','palm','furniture','dock','stairs'].includes(e.kind)&&['front','back'].includes(e.zone)&&['rect','ellipse','polygon'].includes(e.shape)&&['Comprobada','Croquis','Estimada'].includes(e.source)&&['terreno','elevado','por verificar'].includes(e.support)&&['conservar','retirar','nuevo','trasladar'].includes(e.action)&&typeof e.locked==='boolean'&&/^#[0-9a-fA-F]{6}$/.test(e.color)&&['x','z','rotation','elevation'].every(k=>finite((e as any)[k]))&&finite(e.height,0,100)&&finite(e.width,.1,300)&&finite(e.depth,.1,300)&&(e.shape!=='polygon'||Array.isArray(e.points)&&e.points.length>=3)&&(!e.points||e.points.length<=100&&e.points.every(a=>Array.isArray(a)&&a.length===2&&a.every(n=>finite(n))));
  const validElements=(es:Element[])=>Array.isArray(es)&&es.length>0&&es.length<=250&&es.every(validElement)&&new Set(es.map(e=>e.id)).size===es.length;
  if(p.schemaVersion!==1||!str(p.title,120)||!str(p.address,250)||!validElements(p.existing)||!Array.isArray(p.proposals)||p.proposals.length<1||p.proposals.length>30||!obj(p.rates)||!Array.isArray(p.measures)||p.measures.length>100||!obj(p.checklist)||!Object.values(p.checklist).every(b=>typeof b==='boolean')||!str(p.activeId,120)||!p.proposals.some(v=>v.id===p.activeId)||!str(p.updatedAt)||!Number.isFinite(Date.parse(p.updatedAt)))return false;
  if(!p.measures.every(m=>obj(m)&&str(m.id,120)&&str(m.label,150)&&str(m.value,150)&&str(m.note,1000)&&['Comprobada','Croquis','Estimada'].includes(m.source)))return false;
  if(new Set(p.proposals.map(v=>v.id)).size!==p.proposals.length)return false;
  return p.proposals.every(v=>{
    if(!obj(v)||!str(v.id,120)||!str(v.name,120)||!str(v.description,400)||!obj(v.settings)||!obj(v.exceptions)||Object.keys(v.exceptions).length>16000||!Object.entries(v.exceptions).every(([id,state])=>/^(front|back):-?\d+:-?\d+$/.test(id)&&['turf','concrete'].includes(state))||!validElements(v.elements))return false;
    const s=v.settings;
    if(!Object.keys(baseSettings).every(k=>k in s)||!Object.entries(s).every(([k,value])=>typeof (baseSettings as any)[k]==='number'?finite(value,-1000,10000):typeof value==='string'))return false;
    return finite(s.tile,1,12)&&finite(s.gap,.1,2)&&finite(s.angle,-90,90)&&finite(s.gridX,-20,20)&&finite(s.gridZ,-20,20)&&finite(s.thickness,1,12)&&finite(s.backThickness,1,12)&&finite(s.base,0,24)&&finite(s.excavation,0,36)&&finite(s.waste,0,50)&&finite(s.looseFactor,1,2)&&finite(s.rollWidth,1,30)&&finite(s.rollLength,1,200)&&finite(s.crew,1,30)&&finite(s.productivity,1,1000)&&finite(s.hours,1,16)&&['artificial','natural'].includes(s.turf)&&['vaciado','prefabricado'].includes(s.method)&&/^#[0-9a-fA-F]{6}$/.test(s.concreteColor);
  })&&Object.keys(createProject().rates).every(k=>k in p.rates)&&Object.values(p.rates).every(r=>obj(r)&&(r.value===null||finite(r.value,0,10000000))&&str(r.source,1000)&&str(r.date,50)&&(!r.url||str(r.url,2000)&&/^https?:\/\//.test(r.url)));
}
