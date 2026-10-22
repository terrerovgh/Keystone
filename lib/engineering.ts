import type { Element, Point } from './project';
import { area, bounds, difference, intersection, polyFor, rotate, union, type MultiPolygon } from './geometry';
export function validRing(points:Point[]){
 const r=points.filter((p,i)=>!i||p[0]!==points[i-1][0]||p[1]!==points[i-1][1]);if(r.length>3&&r[0][0]===r.at(-1)![0]&&r[0][1]===r.at(-1)![1])r.pop();if(r.length<3)return false;
 const cross=(a:Point,b:Point,c:Point)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 for(let i=0;i<r.length;i++)for(let j=i+1;j<r.length;j++){if(j===i+1||(i===0&&j===r.length-1))continue;const a=r[i],b=r[(i+1)%r.length],c=r[j],d=r[(j+1)%r.length];if(cross(a,b,c)*cross(a,b,d)<-1e-10&&cross(c,d,a)*cross(c,d,b)<-1e-10)return false}
 return Math.abs(r.reduce((s,a,i)=>{const b=r[(i+1)%r.length];return s+a[0]*b[1]-b[0]*a[1]},0))>.001;
}
export function finishedLevel(e:Element,x:number,z:number){return e.elevation+(x-e.x-e.width/2)*(e.slopeX??0)/100+(z-e.z-e.depth/2)*(e.slopeZ??0)/100}
export function supportAreas(net:MultiPolygon,elements:Element[]){
 const result={terreno:[] as MultiPolygon,elevado:[] as MultiPolygon,'por verificar':[] as MultiPolygon};let rest=net;
 for(const e of [...elements].reverse().filter(e=>['path','paving'].includes(e.kind)&&e.action!=='retirar')){const part=intersection(rest,polyFor(e));result[e.support]=union([result[e.support],part]);rest=difference(rest,polyFor(e))}result['por verificar']=union([result['por verificar'],rest]);return result;
}
// Integrates a piecewise-linear cut/fill plane exactly over signed polygon rings.
export function earthVolumes(poly:MultiPolygon,e:Element,layersIn:number){
 const b=bounds(poly);if(!poly.length)return {cut:0,fill:0};const h=(p:Point)=>(e.groundElevation??0)-(finishedLevel(e,...p)-layersIn/12);
 const corners:Point[]=[[b.x-1,b.z-1],[b.maxX+1,b.z-1],[b.maxX+1,b.maxZ+1],[b.x-1,b.maxZ+1]];
 const clip=(positive:boolean)=>{const out:Point[]=[];for(let i=0;i<corners.length;i++){const a=corners[i],c=corners[(i+1)%corners.length],ha=h(a)*(positive?1:-1),hc=h(c)*(positive?1:-1);if(ha>=0)out.push(a);if((ha>=0)!==(hc>=0)){const t=ha/(ha-hc);out.push([a[0]+(c[0]-a[0])*t,a[1]+(c[1]-a[1])*t])}}return out.length>=3?intersection(poly,[[[...out,out[0]]]]):[]};
 const integrate=(p:MultiPolygon)=>Math.abs(p.reduce((sum,pg)=>sum+pg.reduce((sum,r,k)=>{let twice=0,mx=0,mz=0;for(let i=0;i<r.length-1;i++){const a=r[i],b=r[i+1],v=a[0]*b[1]-b[0]*a[1];twice+=v;mx+=(a[0]+b[0])*v;mz+=(a[1]+b[1])*v}if(Math.abs(twice)<1e-9)return sum;const centroid:Point=[mx/(3*twice),mz/(3*twice)];return sum+(k? -1:1)*Math.abs(twice)/2*Math.abs(h(centroid))},0),0))/27;
 return {cut:integrate(clip(true)),fill:integrate(clip(false))};
}
export function edgeDimensions(e:Element){let pts:Point[];if(e.shape==='ellipse')return [];
 pts=e.shape==='polygon'&&e.points?e.points:[[0,0],[e.width,0],[e.width,e.depth],[0,e.depth]];
 if(pts.length>3&&pts[0][0]===pts.at(-1)![0]&&pts[0][1]===pts.at(-1)![1])pts=pts.slice(0,-1);
 return pts.map((a,i)=>{const b=pts[(i+1)%pts.length],world=(p:Point)=>{const q=rotate([p[0]-e.width/2,p[1]-e.depth/2],e.rotation);return [e.x+e.width/2+q[0],e.z+e.depth/2+q[1]] as Point};return {a:world(a),b:world(b),length:Math.hypot(b[0]-a[0],b[1]-a[1])}})
}
