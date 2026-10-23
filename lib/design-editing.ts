import type { Element, Point, Proposal } from './project';
import { rotate } from './geometry';
/** Shared commit for edits from the plan, 3D drag and inspector. */
export function applyElementPatch(proposal:Proposal,id:string,patch:Partial<Element>):boolean{
 const e=proposal.elements.find(e=>e.id===id);if(!e||e.locked&&patch.locked!==false)return false;
 const next={...patch};
 if(next.width!==undefined&&next.x===undefined&&['front-median','front-axis'].includes(e.style??''))next.x=e.x+(e.width-next.width)/2;
 if(next.width!==undefined&&e.points&&!next.points)next.points=e.points.map(([x,z])=>[x*next.width!/e.width,z]);
 if(next.depth!==undefined&&e.points&&!patch.points){const points=next.points??e.points;next.points=points.map(([x,z])=>[x,z*next.depth!/e.depth]);}
 if((next.width!==undefined||next.depth!==undefined||next.height!==undefined||next.points)&&(e.source!=='Estimada'||e.edgeSources&&Object.values(e.edgeSources).some(v=>v!=='Estimada'))){e.source='Estimada';e.edgeSources=Object.fromEntries(Object.keys(e.edgeSources??{}).map(k=>[k,'Estimada']));e.note=('Dimensiones modificadas; comprobar cotas. '+e.note).slice(0,1000)}
 Object.assign(e,next);
 if(e.shape==='polygon'&&e.points){
  const minX=Math.min(...e.points.map(p=>p[0])),minZ=Math.min(...e.points.map(p=>p[1])),w=Math.max(...e.points.map(p=>p[0]))-minX,d=Math.max(...e.points.map(p=>p[1]))-minZ;
  const delta=rotate([minX+w/2-e.width/2,minZ+d/2-e.depth/2],e.rotation);
  e.x+=e.width/2+delta[0]-w/2;e.z+=e.depth/2+delta[1]-d/2;e.width=w;e.depth=d;e.points=e.points.map(([x,z])=>[x-minX,z-minZ] as Point);
 }
 return true;
}
