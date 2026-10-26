import type { Element, Point, Proposal } from './project';
import { rotate } from './geometry';
import { lineOutline } from './line-geometry';
import { validRing } from './engineering';
/** Confirmación compartida de cambios del plano, arrastre 3D e inspector. */
export function applyElementPatch(proposal:Proposal,id:string,patch:Partial<Element>):boolean{
 const original=proposal.elements.find(e=>e.id===id);if(!original||original.locked&&patch.locked!==false)return false;
 const e=structuredClone(original);
 const next={...patch};
 if(next.width!==undefined&&next.x===undefined&&['front-median','front-axis'].includes(e.style??''))next.x=e.x+(e.width-next.width)/2;
 if(next.width!==undefined&&e.points&&!next.points)next.points=e.points.map(([x,z])=>[x*next.width!/e.width,z]);
 if(next.depth!==undefined&&e.points&&!patch.points){const points=next.points??e.points;next.points=points.map(([x,z])=>[x,z*next.depth!/e.depth]);}
 if((next.width!==undefined||next.depth!==undefined||next.height!==undefined||next.lineWidth!==undefined||next.shape!==undefined&&next.shape!==e.shape||next.points)&&(e.source!=='Estimada'||e.edgeSources&&Object.values(e.edgeSources).some(v=>v!=='Estimada'))){e.source='Estimada';e.edgeSources=Object.fromEntries(Object.keys(e.edgeSources??{}).map(k=>[k,'Estimada']));e.note=('Dimensiones modificadas; comprobar cotas. '+e.note).slice(0,1000)}
 Object.assign(e,next);
 if([e.x,e.z,e.width,e.depth,e.height,e.elevation,e.rotation].some(v=>!Number.isFinite(v))||e.width<(e.shape==='polyline'?.01:.1)||e.depth<(e.shape==='polyline'?.01:.1)||e.width>300||e.depth>300||e.shape==='polygon'&&(!e.points||!validRing(e.points))||e.shape==='polyline'&&(!e.points||!validRing(lineOutline(e.points,e.lineWidth??0))))return false;
 if((e.shape==='polygon'||e.shape==='polyline')&&e.points){
  const outline=e.shape==='polyline'?lineOutline(e.points,e.lineWidth??0):e.points;if(!validRing(outline))return false;
  const minX=Math.min(...outline.map(p=>p[0])),minZ=Math.min(...outline.map(p=>p[1])),w=Math.max(...outline.map(p=>p[0]))-minX,d=Math.max(...outline.map(p=>p[1]))-minZ;
  const delta=rotate([minX+w/2-e.width/2,minZ+d/2-e.depth/2],e.rotation);
  e.x+=e.width/2+delta[0]-w/2;e.z+=e.depth/2+delta[1]-d/2;e.width=w;e.depth=d;e.points=e.points.map(([x,z])=>[x-minX,z-minZ] as Point);
 }
 if(e.width<(e.shape==='polyline'?.01:.1)||e.depth<(e.shape==='polyline'?.01:.1)||e.width>300||e.depth>300)return false;
 Object.assign(original,e);
 return true;
}
