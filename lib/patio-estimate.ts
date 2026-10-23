import type { Element, Point, Project } from './project';

/** Working interpretation, not a measured survey. Absolute placement is tied to GIS;
 * sketch lengths control local closure, while the public floor plan controls topology. */
export const PATIO_ESTIMATE={
  version:1 as const,left:7+10/12,right:73+10/12,shore:112,
  leftFace:75,rightFace:85,centerWall:65+4/12,landingFront:84+4/12,
  houseLevel:28/12,patioLevel:0,dockLevel:-14/12,waterLevel:-34/12,
  houseRisers:4,dockRisers:2,
  publicPlan:'https://images1.apartments.com/i2/Gcy48gMsWJHgN3T1huE40Hfo9rT8de-fSBiJjZsEpiw/111/2331-keystone-blvd-north-miami-fl-building-photo.jpg?p=1',
  listing:'https://www.apartments.com/2331-keystone-blvd-north-miami-fl/fer33vt/',
};
function patchContour(e:Element,world:Point[],extra:Partial<Element>={}):Element{
  const x=Math.min(...world.map(p=>p[0])),z=Math.min(...world.map(p=>p[1])),width=Math.max(...world.map(p=>p[0]))-x,depth=Math.max(...world.map(p=>p[1]))-z;
  return {...e,x,z,width,depth,shape:'polygon',points:world.map(p=>[p[0]-x,p[1]-z]),...extra};
}
function detail(id:string,name:string,kind:Element['kind'],x:number,z:number,width:number,depth:number,extra:Partial<Element>={}):Element{
  return {id,name,kind,zone:'back',x,z,width,depth,height:.15,elevation:0,rotation:0,shape:'rect',color:'#95765d',locked:true,action:'conservar',source:'Estimada',support:'elevado',note:'Estimación conjunta de croquis, plano público, fotos y videos. No comprobada en sitio.',...extra};
}
export function estimatePatioElements(input:Element[]):Element[]{
  const es=structuredClone(input),r=PATIO_ESTIMATE,L=r.left,R=r.right;
  const replace=(id:string,fn:(e:Element)=>Element)=>{const i=es.findIndex(e=>e.id===id);if(i>=0)es[i]=fn(es[i])};
  replace('back-floor',e=>patchContour(e,[[L,75],[33.98,75],[33.98,r.centerWall],[55.3,r.centerWall],[55.3,85],[R,85],[R,112],[L,112]],{
    name:'Patio · cierre 37 / 27 / 16 + 50 ft',elevation:0,source:'Estimada',edgeSources:{'5':'Croquis','7':'Croquis'},
    note:'37 ft de fondo izquierdo y 27 ft derecho aplicados. Ancho interpretado como 16 + 50 = 66 ft. Posición absoluta inferida de GIS. Terraza cubierta y escaleras se excluyen por sus contornos propios.',
  }));
  replace('pool',e=>({...e,x:L+3.5,z:79.5,width:13,depth:28,height:4.5,elevation:0,style:'croquis-pool',
    name:'Piscina · vaso estimado 12 × 27 ft',source:'Estimada',note:'Exterior aproximado 13 × 28 ft con coronación nominal de 6 in; agua 12 × 27 ft. Cierre interpretado: banda 16 = 4 de margen al agua + 12 de vaso; fondo 37 = 5 de margen a casa + 27 de agua + 5 hacia canal. Márgenes del croquis; vaso, coronación y margen a casa derivados, no medidos.'}));
  replace('steps',e=>({...e,x:34.5,z:r.landingFront,width:20.5,depth:5,height:r.houseLevel,elevation:0,style:'house-descent',
    name:'Bajada central · casa a patio',source:'Estimada',note:'Escalera amplia de bordes achaflanados, situada por el plano público y vista aérea. Hipótesis de 4 contrahuellas de 7 in = 28 in; huella total 5 ft. Ancho 20 ft 6 in estimado. Cuenta y alturas por comprobar.'}));
  replace('dock',e=>({...e,x:1.5,z:112,width:75,depth:5,elevation:r.dockLevel,style:'lower-dock',source:'Estimada',
    name:'Muelle inferior · −14 in estimadas',note:'Nivel inferior confirmado por el propietario. Descenso de trabajo 14 in, representado con 2 contrahuellas de 7 in. Longitud 75 ft apoyada en listado público, no levantamiento. Profundidad 5 ft estimada.'}));
  replace('dock-projection',e=>({...e,x:33.5,z:117,width:15,depth:5,elevation:r.dockLevel,source:'Croquis',style:'lower-dock',note:'15 × 5 ft del croquis aplicados al saliente central. Identificación y posición elegidas por correspondencia con el plano publicado; nivel igual al muelle inferior.'}));
  replace('back-garden',e=>({...e,x:L,z:75,width:2.8,depth:34.5,elevation:0}));
  replace('back-garden-right',e=>({...e,x:60.5,z:108,width:12.5,depth:4,elevation:0}));
  replace('table',e=>({...e,x:53,z:99,width:10,depth:4,height:3.3,elevation:0,style:'dining'}));
  replace('outdoor-kitchen',e=>({...e,x:64,z:104,width:9.5,depth:3,height:3,elevation:0,style:'kitchen'}));
  replace('chair-1',e=>({...e,x:27,z:96,elevation:0}));replace('chair-2',e=>({...e,x:31,z:96,elevation:0}));
  replace('back-palm',e=>({...e,x:57.5,z:108.5,elevation:0}));replace('back-palm-left',e=>({...e,x:8,z:108,elevation:0}));
  const covered=detail('rear-covered-terrace','Terraza cubierta elevada · centro y ala izquierda','fixed',15.52,r.centerWall,39.78,19,{elevation:r.houseLevel,style:'covered-terrace',color:'#b78568',note:'Planta en L del plano público: porche izquierdo hasta 75 ft y terraza central hasta 84 ft 4 in. Plataforma a +28 in de trabajo. No es un muro macizo ni pavimento nuevo.'});
  es.push(patchContour(covered,[[15.52,r.centerWall],[55.3,r.centerWall],[55.3,r.landingFront],[33.98,r.landingFront],[33.98,75],[15.52,75]]));
  es.push(detail('dock-stairs','Bajada de patio a muelle · 2 contrahuellas estimadas','stairs',38.5,110,6,2,{height:14/12,elevation:r.dockLevel,style:'dock-descent',note:'El propietario confirma escalones hacia un muelle inferior. Posición central estimada por plano y continuidad de circulación. Hipótesis: dos contrahuellas de 7 in y dos huellas de 12 in.'}));
  return es;
}
/** Preserve all prior alternatives and their baselines; add one calibrated proposal. */
export function withPatioEstimate(input:Project):Project{
  if(input.proposals.some(v=>v.patioCalibration===1))return input;
  const p=structuredClone(input),selected=p.proposals.find(v=>v.id===p.activeId),base=selected?.referenceEdition===2?selected:p.proposals.find(v=>v.referenceEdition===2);
  if(!base||p.proposals.length>=30)return input;
  const baseline=estimatePatioElements(base.baseline??p.existing),elements=estimatePatioElements(base.elements),id='patio-estimate-croquis-v1';
  p.proposals.push({...structuredClone(base),id,patioCalibration:1,name:`${String(p.proposals.length+1).padStart(2,'0')} · Patio · croquis y niveles`,description:'Croquis aplicado, terraza cubierta en L, escalera central y muelle inferior. Planta y cotas verticales estimadas con fuentes cruzadas.',baseline,elements,exceptions:Object.fromEntries(Object.entries(base.exceptions).filter(([k])=>k.startsWith('front:')))});
  p.activeId=id;p.updatedAt=new Date().toISOString();
  p.measures.push({id:'patio-closure-v1',label:'Patio · cierre interpretado del croquis',value:'66′ = 16′ + 50′ · fondos 37′ / 27′',source:'Croquis',note:'Lecturas aplicadas mediante una interpretación de extremos: 16 y 50 contiguos. Posición y correspondencia inferidas, no verificadas.'},
    {id:'patio-levels-v1',label:'Niveles relativos · hipótesis de trabajo',value:'Casa +28″ · patio 0″ · muelle −14″',source:'Estimada',note:'Muelle inferior confirmado por propietario. Valores elegidos: casa 4 × 7 in y muelle 2 × 7 in. Rango visual orientativo casa 24–32 in y muelle 10–18 in; no es un intervalo estadístico ni una cota topográfica.'});
  return p;
}
