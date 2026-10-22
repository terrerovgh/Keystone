import pc, { type MultiPolygon, type Polygon, type Ring } from 'polygon-clipping';
import type { Element, Point, Proposal, Zone } from './project';
export type { MultiPolygon };
// Round shared intersections to a common sub-millimetre lattice. This avoids
// almost-identical endpoints from rotated grids breaking polygon ring assembly.
const snap=(n:number)=>Math.round(n*1e6)/1e6;
const normalized=(p:MultiPolygon):MultiPolygon=>p.map(poly=>poly.map(r=>r.map(([x,z])=>[snap(x),snap(z)] as Point).filter((p,i,r)=>i===0||p[0]!==r[i-1][0]||p[1]!==r[i-1][1])).filter(r=>r.length>=4)).filter(poly=>poly.length>0);
export function rotate([x,z]:Point, angle:number):Point {const a=angle*Math.PI/180;return [x*Math.cos(a)-z*Math.sin(a),x*Math.sin(a)+z*Math.cos(a)];}
export function ringFor(e:Element):Ring {
  let points:Point[];
  if(e.shape==='ellipse')points=Array.from({length:64},(_,i)=>{const a=i/64*Math.PI*2;return [e.width/2+Math.cos(a)*e.width/2,e.depth/2+Math.sin(a)*e.depth/2]});
  else if(e.shape==='polygon'&&e.points)points=e.points;
  else points=[[0,0],[e.width,0],[e.width,e.depth],[0,e.depth]];
  const r=points.map(p=>{const t=rotate([p[0]-e.width/2,p[1]-e.depth/2],e.rotation);return [e.x+e.width/2+t[0],e.z+e.depth/2+t[1]] as Point});
  return [...r,r[0]];
}
export const polyFor=(e:Element):MultiPolygon=>[[ringFor(e)]];
export const rect=(x:number,z:number,w:number,d:number):MultiPolygon=>[[[[x,z],[x+w,z],[x+w,z+d],[x,z+d],[x,z]]]];
export function union(shapes:MultiPolygon[]):MultiPolygon {const a=shapes.map(normalized).filter(x=>x.length);return a.length?normalized(pc.union(a[0],...a.slice(1))):[];}
export const difference=(a:MultiPolygon,b:MultiPolygon):MultiPolygon=>!a.length?[]:!b.length?a:normalized(pc.difference(normalized(a),normalized(b)));
export const intersection=(a:MultiPolygon,b:MultiPolygon):MultiPolygon=>a.length&&b.length?normalized(pc.intersection(normalized(a),normalized(b))):[];
export function area(p:MultiPolygon):number {return p.reduce((sum,poly)=>sum+poly.reduce((s,ring,i)=>s+(i===0?1:-1)*Math.abs(ring.reduce((t,p,j)=>{const n=ring[(j+1)%ring.length];return t+p[0]*n[1]-n[0]*p[1]},0)/2),0),0);}
export function perimeter(p:MultiPolygon):number {return p.reduce((s,poly)=>s+poly.reduce((n,r)=>n+r.slice(1).reduce((t,v,i)=>t+Math.hypot(v[0]-r[i][0],v[1]-r[i][1]),0),0),0);}
export function bounds(p:MultiPolygon){const pts=p.flat(2);return pts.length?{x:Math.min(...pts.map(p=>p[0])),z:Math.min(...pts.map(p=>p[1])),maxX:Math.max(...pts.map(p=>p[0])),maxZ:Math.max(...pts.map(p=>p[1]))}:{x:0,z:0,maxX:0,maxZ:0};}
export const mapPoly=(p:MultiPolygon,fn:(p:Point)=>Point):MultiPolygon=>p.map(poly=>poly.map(r=>r.map(fn)));
export function pathData(p:MultiPolygon){return p.map(poly=>poly.map(r=>`M${r.map(pt=>pt.map(n=>n.toFixed(4)).join(',')).join('L')}Z`).join('')).join('');}
export interface Tile {id:string; polygon:MultiPolygon; full:boolean; row:number; col:number; x:number; z:number;}
export interface Surface {net:MultiPolygon; paving:MultiPolygon; paths:MultiPolygon; concrete:MultiPolygon; grass:MultiPolygon; gardens:MultiPolygon; tiles:Tile[]; pathTiles:Tile[]; turfCuts:MultiPolygon[]; elevated:MultiPolygon;}
export function footprint(elements:Element[],zone:Zone){
  const active=elements.filter(e=>e.action!=='retirar');
  const hard=union(active.filter(e=>['pool','house','dock','stairs','fixed'].includes(e.kind)).map(polyFor));
  const allPaths=difference(union(active.filter(e=>e.kind==='path').map(polyFor)),hard);
  const allGardens=difference(union(active.filter(e=>e.kind==='garden').map(polyFor)),union([hard,allPaths]));
  const exclusion=union([hard,allGardens]);
  const es=active.filter(e=>e.zone===zone);
  // Front owns any overlap between zones. This keeps material totals deterministic.
  const frontPriority=zone==='back'?union(active.filter(e=>e.zone==='front'&&['paving','path'].includes(e.kind)).map(polyFor)):[];
  const paths=difference(union(es.filter(e=>e.kind==='path').map(polyFor)),union([exclusion,frontPriority]));
  const paving=difference(union(es.filter(e=>e.kind==='paving').map(polyFor)),union([exclusion,allPaths,frontPriority]));
  return {paving,paths,net:union([paving,paths]),gardens:intersection(allGardens,union(es.filter(e=>e.kind==='garden').map(polyFor)))};
}
export function demolitionFor(existing:Element[],proposed:Element[],zone:Zone){return difference(footprint(existing,zone).net,union(proposed.filter(e=>['paving','path'].includes(e.kind)&&e.action==='conservar').map(polyFor)))}
export function visibleFootprint(e:Element,elements:Element[]){
 const hard=union(elements.filter(x=>x.id!==e.id&&x.action!=='retirar'&&['pool','house','dock','stairs','fixed'].includes(x.kind)).map(polyFor));
 return e.kind==='garden'?difference(polyFor(e),union([hard,...elements.filter(x=>x.kind==='path'&&x.action!=='retirar').map(polyFor)])):polyFor(e);
}
export function surface(proposal:Proposal,zone:Zone):Surface {
  const {elements,settings:s}=proposal, {paving,paths,net,gardens}=footprint(elements.map(e=>['paving','path'].includes(e.kind)&&e.action==='conservar'?{...e,kind:'fixed' as const}:e),zone);
  const local=(p:Point)=>{const q=rotate([p[0]-s.gridX,p[1]-s.gridZ],-s.angle);return q};
  const global=(p:Point)=>{const q=rotate(p,s.angle);return [q[0]+s.gridX,q[1]+s.gridZ] as Point};
  const domain=mapPoly(paving,local),b=bounds(domain),pitch=s.tile+s.gap;
  const minC=Math.floor(b.x/pitch)-1,maxC=Math.ceil(b.maxX/pitch),minR=Math.floor(b.z/pitch)-1,maxR=Math.ceil(b.maxZ/pitch);
  if((maxC-minC+1)*(maxR-minR+1)>16000)throw new Error('La cuadrícula supera 16.000 cuadros. Reduce el área o aumenta el tamaño.');
  const tiles:Tile[]=[], turfCuts:MultiPolygon[]=[],concreteShapes:MultiPolygon[]=[paths];
  for(let row=minR;row<=maxR;row++) for(let col=minC;col<=maxC;col++){
    const x=col*pitch,z=row*pitch,id=`${zone}:${col}:${row}`;
    const cell=intersection(domain,rect(x,z,s.tile,s.tile));
    const value=proposal.exceptions[id];
    if(area(cell)>1e-6 && value!=='turf'){
      const polygon=mapPoly(cell,global);
      tiles.push({id,polygon,full:Math.abs(area(cell)-s.tile*s.tile)<0.0001,row,col,x,z});concreteShapes.push(polygon);
    }else if(area(cell)>1e-6)turfCuts.push(mapPoly(cell,global));
    const v=intersection(domain,rect(x+s.tile,z,s.gap,pitch));
    const h=intersection(domain,rect(x,z+s.tile,s.tile,s.gap));
    for(const cut of [v,h])if(area(cut)>1e-6)turfCuts.push(mapPoly(cut,global));
  }
  const concrete=union(concreteShapes),grass=difference(net,concrete);
  const elevated=intersection(net,union(elements.filter(e=>e.zone===zone&&['paving','path'].includes(e.kind)&&e.support!=='terreno'&&e.action!=='retirar').map(polyFor)));
  const pathDomain=mapPoly(paths,local),pb=bounds(pathDomain),pathTiles:Tile[]=[];if((Math.ceil((pb.maxX-pb.x)/s.tile)+2)*(Math.ceil((pb.maxZ-pb.z)/s.tile)+2)>16000)throw new Error('El camino supera 16.000 piezas. Aumenta el formato o reduce el contorno.');
  for(let row=Math.floor(pb.z/s.tile);row<Math.ceil(pb.maxZ/s.tile);row++)for(let col=Math.floor(pb.x/s.tile);col<Math.ceil(pb.maxX/s.tile);col++){const cell=intersection(pathDomain,rect(col*s.tile,row*s.tile,s.tile,s.tile));if(area(cell)>1e-6)pathTiles.push({id:`path:${zone}:${col}:${row}`,polygon:mapPoly(cell,global),full:Math.abs(area(cell)-s.tile*s.tile)<1e-4,row,col,x:col*s.tile,z:row*s.tile})}
  return {net,paving,paths,concrete,grass,gardens,tiles,pathTiles,turfCuts,elevated};
}
export function turfRolls(cuts:MultiPolygon[],rollWidth:number,rollLength:number,waste:number,angle=0){
  // Fixed grain direction. Each clipped strip is cut from its bounding rectangle;
  // offcuts are not assumed reusable. Shelf packing shares roll width between strips.
  const boxes=cuts.flatMap(cut=>cut.map(poly=>{const b=bounds(mapPoly([poly],p=>rotate(p,-angle)));return {w:b.maxX-b.x,l:b.maxZ-b.z}}));
  const pieces:{w:number;l:number}[]=[];
  boxes.forEach(b=>{for(let x=0;x<b.w-1e-8;x+=rollWidth)for(let z=0;z<b.l-1e-8;z+=rollLength)pieces.push({w:Math.min(rollWidth,b.w-x),l:Math.min(rollLength,b.l-z)})});
  pieces.sort((a,b)=>b.l-a.l||b.w-a.w);
  const shelves:{used:number;l:number}[]=[];
  for(const b of pieces){const shelf=shelves.find(s=>s.used+b.w<=rollWidth+1e-8&&s.l+1e-8>=b.l);if(shelf)shelf.used+=b.w;else shelves.push({used:b.w,l:b.l})}
  const cutLinear=shelves.reduce((s,r)=>s+r.l,0),linear=cutLinear*(1+waste/100);
  const bins:number[]=[];for(const shelf of [...shelves].sort((a,b)=>b.l-a.l)){const i=bins.findIndex(b=>b+shelf.l<=rollLength+1e-8);if(i<0)bins.push(shelf.l);else bins[i]+=shelf.l}
  const reserve=cutLinear*waste/100;let left=reserve;for(let i=0;i<bins.length&&left>0;i++){const used=Math.min(rollLength-bins[i],left);bins[i]+=used;left-=used}while(left>1e-8){const use=Math.min(rollLength,left);bins.push(use);left-=use}
  return {linear,area:linear*rollWidth,rolls:bins.length,pieces:pieces.length,cutLinear,wholeRollArea:bins.length*rollWidth*rollLength,packing:bins};
}
