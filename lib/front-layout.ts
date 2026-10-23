import type { Element, Point, Project } from './project';
import { resolveFacade } from './facade';
import { rotate } from './geometry';

/** A single semicircle is cut by the path in both plan and model. Feet. */
export function frontMedianPoints(width:number,depth:number):Point[]{
 return [[0,0],[width,0],...Array.from({length:48},(_,i)=>{const a=(i+1)*Math.PI/48;return [width/2+Math.cos(a)*width/2,Math.sin(a)*depth] as Point})];
}
export function entranceSteps(project:Project,elements:Element[]):Element|undefined{
 const house=elements.find(e=>e.kind==='house'),old=elements.find(e=>e.id==='front-steps'),portal=resolveFacade(project.facade).parts.find(p=>p.kind==='portal'&&p.visible);
 if(!house||!old||!portal)return old;
 const sx=house.width/64.503,sz=house.depth/70.83,sy=house.height/30;
 const localCenter:Point=[(portal.x+portal.width/2-9.33)*sx-house.width/2,(portal.z-3.2+3.28/2-14.565)*sz-house.depth/2],delta=rotate(localCenter,house.rotation);
 const width=(portal.width+.24)*sx,depth=3.28*sz,x=house.x+house.width/2+delta[0]-width/2,z=house.z+house.depth/2+delta[1]-depth/2;
 const curve:Point[]=[[0,depth],[width,depth],[width,.28*sz],...Array.from({length:25},(_,j)=>{const t=(j+1)/25;return [width*(1-t),.28*sz-.28*sz*Math.sin(Math.PI*t)] as Point})];
 return {...old,x,z,width,depth,height:portal.y*sy,elevation:house.elevation,rotation:house.rotation,shape:'polygon',points:curve,style:'front-entry',source:'Estimada',note:'Escalones alineados con el portal del modelo. Contorno compartido entre plano y 3D; dimensiones visuales por comprobar.'};
}
export function withFrontAlignment(input:Project):Project{
 if(input.proposals.some(v=>v.frontAlignment===1)||input.proposals.length>=30)return input;
 const p=structuredClone(input),active=p.proposals.find(v=>v.id===p.activeId),base=(active?.frontCalibration===3?active:[...p.proposals].reverse().find(v=>v.frontCalibration===3))??p.proposals[0],facade=resolveFacade(p.facade),portal=facade.parts.find(v=>v.kind==='portal'&&v.visible);
 if(!portal)return input;
 const elements=structuredClone(base.elements),stairs=entranceSteps(p,elements),house=elements.find(e=>e.kind==='house');
 if(!stairs||!house)return input;
 const center=stairs.x+stairs.width/2,sidewalk=elements.find(e=>e.id==='sidewalk'),start=sidewalk?sidewalk.z+sidewalk.depth:-8.2,width=25,depth=9.5;
 const oldCenter=(16.5+69)/2,shift=center-oldCenter;
 for(const e of elements){
  if(e.id==='entry-left'||e.id==='entry-right')e.x+=shift;
  if(e.id==='front-steps')Object.assign(e,stairs);
  if(e.id==='palm-left'){e.x=center-8.5-e.width/2;e.z=start+3.5-e.depth/2;e.action='trasladar'}
  if(e.id==='palm-right'){e.x=center+8.5-e.width/2;e.z=start+3.5-e.depth/2;e.action='trasladar'}
  if(e.id==='central-path')Object.assign(e,{x:center-2,z:start,width:4,depth:stairs.z-start,rotation:0,shape:'rect',points:undefined,style:'front-axis',name:'Camino central · acera a puerta',source:'Estimada',note:'Camino de 4 ft sobre el eje de la puerta. Divide la medialuna en dos y termina en los escalones. Ancho de diseño, no medición de campo.'});
 }
 const template=elements.find(e=>e.id==='garden-left')??elements.find(e=>e.kind==='garden'&&e.zone==='front');
 if(!template)return input;
 const median:Element={...template,id:'front-median',name:'Medialuna de palmas · 25 ft',x:center-width/2,z:start,width,depth,rotation:0,shape:'polygon',points:frontMedianPoints(width,depth),style:'front-median',action:'nuevo',source:'Estimada',note:'Una única media elipse de 25 ft, centrada entre los accesos y sobre la puerta. El camino se resta del contorno en ambas vistas; profundidad 9 ft 6 in de diseño.'};
 const proposed=elements.filter(e=>!['garden-left','garden-right','old-center'].includes(e.id));proposed.push(median);
 const baseline=structuredClone(base.baseline??p.existing),baselineSteps=entranceSteps(p,baseline);if(baselineSteps){const i=baseline.findIndex(e=>e.id==='front-steps');if(i>=0)baseline[i]=baselineSteps}
 const id='front-aligned-median-v1';p.proposals.push({...structuredClone(base),id,frontAlignment:1,name:`${String(p.proposals.length+1).padStart(2,'0')} · Frente · medialuna central`,description:'Accesos simétricos, medialuna dividida por el camino y puerta sobre un mismo eje. Plano y modelo editan los mismos elementos.',elements:proposed,baseline,exceptions:Object.fromEntries(Object.entries(base.exceptions).filter(([k])=>k.startsWith('back:')))});
 p.activeId=id;p.updatedAt=new Date().toISOString();return p;
}
