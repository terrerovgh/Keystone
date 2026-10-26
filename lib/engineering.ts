import type { Element, Point } from './project';
import { area, bounds, difference, intersection, polyFor, ringFor, rotate, union, type MultiPolygon } from './geometry';
/** Un anillo simple no admite cruces, contactos no adyacentes ni retrocesos. */
export function validRing(points:Point[]){
 if(!Array.isArray(points)||points.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)))return false;
 // Los archivos históricos incluyen vértices consecutivos repetidos; se ignoran sin reescribirlos.
 const r=points.filter((p,i)=>!i||p[0]!==points[i-1][0]||p[1]!==points[i-1][1]);
 if(r.length>3&&Math.hypot(r[0][0]-r.at(-1)![0],r[0][1]-r.at(-1)![1])<1e-9)r.pop();
 if(r.length<3)return false;
 const eps=1e-9,cross=(a:Point,b:Point,c:Point)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const on=(a:Point,b:Point,p:Point)=>Math.abs(cross(a,b,p))<=eps&&p[0]>=Math.min(a[0],b[0])-eps&&p[0]<=Math.max(a[0],b[0])+eps&&p[1]>=Math.min(a[1],b[1])-eps&&p[1]<=Math.max(a[1],b[1])+eps;
 for(let i=0;i<r.length;i++){
  const a=r[i],b=r[(i+1)%r.length],c=r[(i+2)%r.length];
  if(Math.hypot(a[0]-b[0],a[1]-b[1])<=eps)return false;
  if(Math.abs(cross(a,b,c))<=eps&&(b[0]-a[0])*(c[0]-b[0])+(b[1]-a[1])*(c[1]-b[1])<0)return false;
  for(let j=i+1;j<r.length;j++){
   if(j===i+1||(i===0&&j===r.length-1))continue;
   const c=r[j],d=r[(j+1)%r.length],abC=cross(a,b,c),abD=cross(a,b,d),cdA=cross(c,d,a),cdB=cross(c,d,b);
   if(((abC>eps&&abD< -eps)||(abC< -eps&&abD>eps))&&((cdA>eps&&cdB< -eps)||(cdA< -eps&&cdB>eps))||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b))return false;
  }
 }
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
 pts=ringFor({...e,x:0,z:0,rotation:0}) as Point[];
 if(pts.length>3&&pts[0][0]===pts.at(-1)![0]&&pts[0][1]===pts.at(-1)![1])pts=pts.slice(0,-1);
 return pts.map((a,i)=>{const b=pts[(i+1)%pts.length],world=(p:Point)=>{const q=rotate([p[0]-e.width/2,p[1]-e.depth/2],e.rotation);return [e.x+e.width/2+q[0],e.z+e.depth/2+q[1]] as Point};return {a:world(a),b:world(b),length:Math.hypot(b[0]-a[0],b[1]-a[1]),source:e.edgeSources?.[String(i)]??e.source}})
}
