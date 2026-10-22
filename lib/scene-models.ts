import * as T from 'three';
import type { Element, Point } from './project';
import { difference, polyFor, rect, visibleFootprint, type MultiPolygon } from './geometry';
import { finishedLevel } from './engineering';
import { SITE } from './site-reference';
export type Finish=ReturnType<typeof makeFinishes>;
function texture(kind:string){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!;let seed=48;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 ctx.fillStyle=kind==='grass'?'#668244':kind==='roof'?'#b66d49':kind==='wood'?'#9c8165':kind==='trunk'?'#a79b87':'#d5d2c8';ctx.fillRect(0,0,256,256);
 for(let i=0;i<9000;i++){const x=rand()*256,y=rand()*256,v=rand();ctx.fillStyle=`rgba(${v>.5?'255,255,235':'20,28,10'},${kind==='grass'?.15:.07})`;ctx.fillRect(x,y,kind==='grass'?1:2,kind==='wood'?20:kind==='grass'?4:2)}
 if(kind==='roof')for(let y=0;y<256;y+=32)for(let x=-8;x<256;x+=24){ctx.strokeStyle='rgba(70,29,16,.4)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+8,y+16,x,y+31);ctx.stroke();ctx.fillStyle='rgba(255,195,125,.28)';ctx.fillRect(x+5,y+1,3,28);ctx.fillStyle='rgba(78,35,18,.35)';ctx.fillRect(x,y,24,2)}
 if(kind==='trunk')for(let y=0;y<256;y+=12){ctx.fillStyle='rgba(65,48,30,.25)';ctx.fillRect(0,y,256,2)}
 if(kind==='wood')for(let x=0;x<256;x+=32){ctx.fillStyle='rgba(45,34,25,.4)';ctx.fillRect(x,0,1,256)}
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;
}
export function makeFinishes(color:string,technical=false){
 const mat=(color:string,roughness=.8,map?:T.Texture)=>new T.MeshStandardMaterial({color,roughness,map});
 return {wall:mat(technical?'#eeeae0':'#e0d5c0'),trim:mat('#f5eee0'),concrete:mat(color,.88,texture('concrete')),grass:mat('#b5c39a',1,texture('grass')),roof:mat('#ffffff',.9,texture('roof')),wood:mat('#cfb391',.82,texture('wood')),darkwood:mat('#64503e'),trunk:mat('#d0c1a6',.95,texture('trunk')),soil:mat('#665642'),leaf:mat('#567237'),leafLight:mat('#75934b'),metal:mat('#ddd8c9',.45),glass:new T.MeshPhysicalMaterial({side:T.DoubleSide,color:'#477875',roughness:.2,metalness:.22,clearcoat:1}),water:new T.MeshPhysicalMaterial({color:'#389fba',roughness:.12,metalness:.12,transparent:true,opacity:.83,clearcoat:1}),pool:mat('#e8e0c9'),dark:mat('#3d493e'),road:mat('#8f9390'),sided:mat('#d3d2c5')};
}
export function block(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),m);mesh.position.set(x+w/2,y+h/2,z+d/2);mesh.castShadow=true;mesh.receiveShadow=true;return mesh}
export function solid(polys:MultiPolygon,mat:T.Material,depth=.15,top=.05,e?:Element){const g=new T.Group();for(const poly of polys){const shape=new T.Shape(poly[0].map(([x,z])=>new T.Vector2(x,-z)));poly.slice(1).forEach(r=>shape.holes.push(new T.Path(r.map(([x,z])=>new T.Vector2(x,-z)))));const geo=new T.ExtrudeGeometry(shape,{depth:Math.max(.025,depth),bevelEnabled:false,curveSegments:24});geo.rotateX(-Math.PI/2);const pos=geo.attributes.position,uv=geo.attributes.uv;for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,pos.getY(i)+top-depth+(e?finishedLevel(e,x,z)-e.elevation:0));uv.setXY(i,x/5,z/5)}geo.computeVertexNormals();const mesh=new T.Mesh(geo,mat);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh)}return g}
function line(points:T.Vector3[],mat:T.Material,radius=.05){return new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),Math.max(6,points.length*3),radius,5,false),mat)}
function hip(x:number,z:number,w:number,d:number,eave:number,rise:number,m:Finish,g:T.Group){
 const ridge=Math.min(w,d)*.4,alongX=w>d,vs=alongX?[[x,eave,z],[x+w,eave,z],[x+w,eave,z+d],[x,eave,z+d],[x+ridge,eave+rise,z+d/2],[x+w-ridge,eave+rise,z+d/2]]:[[x,eave,z],[x+w,eave,z],[x+w,eave,z+d],[x,eave,z+d],[x+w/2,eave+rise,z+ridge],[x+w/2,eave+rise,z+d-ridge]];
 const ix=alongX?[0,4,1,1,4,5,1,5,2,2,5,3,3,5,4,3,4,0]:[0,4,1,1,4,5,1,5,2,2,5,3,3,5,4,3,4,0];const geo=new T.BufferGeometry();const pts:number[]=[],uv:number[]=[];ix.forEach(i=>{pts.push(...vs[i]);uv.push(vs[i][0]/7,(vs[i][2]+vs[i][1]*.5)/7)});geo.setAttribute('position',new T.Float32BufferAttribute(pts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();const roof=new T.Mesh(geo,m.roof);roof.material.side=T.DoubleSide;roof.castShadow=true;roof.receiveShadow=true;roof.userData.roof=true;g.add(roof);
 const a=vs[4],b=vs[5];const ridgeMesh=line([new T.Vector3(...a as [number,number,number]),new T.Vector3(...b as [number,number,number])],m.roof,.16);ridgeMesh.userData.roof=true;g.add(ridgeMesh);
 g.add(block(x,eave-.4,z,w,.35,d,m.trim));
}
function gable(x:number,z:number,w:number,d:number,eave:number,rise:number,m:Finish,g:T.Group){
 const ridge=x+w/2,vertices=[x,eave,z,ridge,eave+rise,z,x+w,eave,z,x,eave,z+d,ridge,eave+rise,z+d,x+w,eave,z+d];
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex([0,3,1,1,3,4,1,4,2,2,4,5]);geo.setAttribute('uv',new T.Float32BufferAttribute([0,0,1.5,1,3,0,0,d/7,1.5,d/7+1,3,d/7],2));geo.computeVertexNormals();const mesh=new T.Mesh(geo,m.roof);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.roof=true;g.add(mesh);
 for(const zz of [z+.05,z+d-.05]){const shape=new T.Shape();shape.moveTo(x,eave);shape.lineTo(x+w,eave);shape.lineTo(ridge,eave+rise);shape.closePath();const cap=new T.Mesh(new T.ShapeGeometry(shape),m.wall);cap.material.side=T.DoubleSide;cap.position.z=zz;g.add(cap)}
 const ridgeMesh=line([new T.Vector3(ridge,eave+rise,z),new T.Vector3(ridge,eave+rise,z+d)],m.roof,.16);ridgeMesh.userData.roof=true;g.add(ridgeMesh);
}
function windowAt(g:T.Group,x:number,y:number,z:number,w:number,h:number,m:Finish,arched=false,side=0){const win=new T.Group();
 const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(w,0);if(arched){shape.lineTo(w,h-w/2);shape.absarc(w/2,h-w/2,w/2,0,Math.PI,false)}else{shape.lineTo(w,h);shape.lineTo(0,h)}shape.closePath();const glass=new T.Mesh(new T.ShapeGeometry(shape),m.glass);win.add(glass);
 const outline=new T.Line(new T.BufferGeometry().setFromPoints(shape.getPoints(36).map(p=>new T.Vector3(p.x,p.y,-.08))),new T.LineBasicMaterial({color:'#eee9da',linewidth:2}));win.add(outline);
 win.add(block(-.18,-.18,-.18,w+.36,.2,.35,m.trim));for(let i=0;i<=Math.round(w/2);i++)win.add(block(i*w/Math.round(w/2)-.05,0,-.16,.1,arched?h-w/2:h,.2,m.trim));for(let y=2.5;y<h-1;y+=2.5)win.add(block(0,y,-.14,w,.08,.15,m.trim));
 if(arched){win.add(line(shape.getPoints(32).slice(2,-1).map(p=>new T.Vector3(p.x,p.y,-.2)),m.trim,.16));for(let i=1;i<5;i++){const a=i*Math.PI/5;win.add(line([new T.Vector3(w/2,h-w/2,-.18),new T.Vector3(w/2+Math.cos(a)*w/2,h-w/2+Math.sin(a)*w/2,-.18)],m.trim,.045))}}
 win.position.set(x,y,z);win.rotation.y=side;g.add(win);
}
function canopy(g:T.Group,x:number,z:number,w:number,d:number,m:Finish){
 for(const xx of [x+.25,x+w-.6]){g.add(block(xx,0,z,.4,9.4,.4,m.darkwood));g.add(block(xx,0,z+d-.6,.4,9.4,.4,m.darkwood))}g.add(block(x,9,z,w,.5,.45,m.darkwood));g.add(block(x,9,z+d-.5,w,.5,.45,m.darkwood));
 for(let xx=x;xx<x+w;xx+=1.8)g.add(block(xx,9.3,z,.15,.2,d,m.darkwood));const roof=block(x,9.6,z,w,.1,d,new T.MeshPhysicalMaterial({color:'#cad3c4',transparent:true,opacity:.45,roughness:.45}));roof.userData.roof=true;g.add(roof);
}
export function residence(e:Element,m:Finish,roofs:boolean,reference:boolean){const g=new T.Group();
 // Lower walls follow the public 2015 footprint. Heights and facade details are photo-based estimates.

 const wings=[[15.2,58.5,19,16.5],[33.8,50,22,15.5],[55.5,14.6,18.2,15.4],[55.5,53.5,18.2,31.9]];
 wings.forEach(([x,z,w,d])=>hip(x-.65,z-.6,w+1.3,d+1.2,11.5,3.8,m,g));
 // Central upper volume and gabled street face.
 g.add(block(23.6,0,17.85,26.2,22.2,33,m.wall));g.add(block(9.33,0,28.8,14.32,20.3,31.76,m.wall));gable(8.7,28.2,15.6,32.96,20.6,6,m,g);
 g.add(block(49.8,11.2,30,24,11,23.5,m.wall));hip(49.2,29.4,25.2,24.7,22.6,5.2,m,g);
 windowAt(g,65.5,16,29.85,2.5,3.5,m);windowAt(g,73.94,15.2,37,3,4,m,false,-Math.PI/2);
 g.add(block(49.8,0,22.08,6.6,21.6,17,m.wall));windowAt(g,56.48,18.4,25,4,.7,{...m,glass:m.dark as T.MeshPhysicalMaterial},false,-Math.PI/2);hip(49.1,21.4,8,18.2,21.9,2.5,m,g);
 const shape=new T.Shape();shape.moveTo(23.6,22.2);shape.lineTo(49.8,22.2);shape.lineTo(36.7,29.4);shape.closePath();const face=new T.Mesh(new T.ShapeGeometry(shape),m.wall);face.rotation.y=Math.PI;face.scale.x=-1;face.position.z=17.84;g.add(face);
 const roofGeo=new T.BufferGeometry();const rv=[22.8,22.5,17.2,50.6,22.5,17.2,36.7,30,17.2,22.8,22.5,51.8,50.6,22.5,51.8,36.7,30,51.8];roofGeo.setAttribute('position',new T.Float32BufferAttribute(rv,3));roofGeo.setIndex([0,3,2,2,3,5,2,5,1,1,5,4]);roofGeo.setAttribute('uv',new T.Float32BufferAttribute([0,0,4,0,2,1,0,5,4,5,2,6],2));roofGeo.computeVertexNormals();const roof=new T.Mesh(roofGeo,m.roof);roof.castShadow=true;roof.material.side=T.DoubleSide;roof.userData.roof=true;g.add(roof);
 // Photo references: arched upper glass, circular window, projecting lower bays and recessed front door.
 windowAt(g,12.5,11.7,28.67,8.3,8.3,m,true);windowAt(g,32.6,18.1,17.75,7,4.8,m,true);
 const circle=new T.Mesh(new T.CircleGeometry(1.15,40),m.glass);circle.position.set(53,16.4,21.98);g.add(circle);const rim=new T.Mesh(new T.TorusGeometry(1.32,.13,8,48),m.trim);rim.position.set(53,16.4,21.91);g.add(rim);
 
 g.add(block(25.4,0,16.6,14.3,10,2,m.wall));hip(24.8,15.9,15.4,4,10.2,1.5,m,g);windowAt(g,26.1,2.4,16.49,12.8,6.2,m);
 windowAt(g,59,2.5,14.48,11.8,6.4,m);windowAt(g,11.5,2.5,28.65,10,6.5,m);windowAt(g,42,2.2,17.7,5,6.4,m);
 g.add(block(50.2,0,22,5.8,10,.35,m.darkwood));windowAt(g,50.4,1.25,21.8,5.2,8.7,{...m,glass:m.darkwood as T.MeshPhysicalMaterial},true);
 for(const [x,z,w] of [[23.6,17.4,.65],[49.2,17.4,.65],[56,14.2,.65],[73.1,14.2,.65]])g.add(block(x,0,z,w,10.6,.65,m.trim));
 for(const [x,z,w] of [[9.3,28.4,14.4],[23.6,17.4,26.2],[56.4,14.3,17]])g.add(block(x,10.1,z,w,.45,.5,m.trim));
 canopy(g,9.8,12.9,13.5,15.8,m);canopy(g,56.8,5.5,16.4,9,m);
 // Rear doors, bays and side windows placed on the traced wings.
 windowAt(g,18.4,2.1,75.11,12.7,7.5,m,false,Math.PI);windowAt(g,40,1,65.5,12,8.5,m,false,Math.PI);windowAt(g,60,2.2,85.5,11.8,7.2,m,false,Math.PI);
 for(const z of [37,51,67])windowAt(g,73.94,2.8,z,8,6,m,false,-Math.PI/2);
 for(const z of [39,52]){windowAt(g,9.2,2.7,z+8,8,6,m,false,Math.PI/2);windowAt(g,9.2,13,z+7,6,5,m,false,Math.PI/2)}
 g.traverse(o=>{if(o.userData.roof)o.visible=roofs});
 const b={x:9.33,z:14.565,w:64.503,d:70.83};const root=new T.Group();g.position.set(-b.x,0,-b.z);root.add(g);root.scale.set(e.width/b.w,e.height/30,e.depth/b.d);root.rotation.y=-e.rotation*Math.PI/180;root.position.set(e.x,e.elevation,e.z);
 // Rotate around the same element center as the plan.
 if(e.rotation){root.position.set(e.x+e.width/2,e.elevation,e.z+e.depth/2);g.position.set(-b.x-b.w/2,0,-b.z-b.d/2)}
 const actual=new T.Group();actual.add(solid(polyFor(e),m.wall,11.2*e.height/30,e.elevation+11.2*e.height/30));actual.add(root);return actual;
}
export function palm(e:Element,m:Finish,bare=false){const g=new T.Group(),x=e.x+e.width/2,z=e.z+e.depth/2,h=e.height;
 const trunk=new T.Mesh(new T.CylinderGeometry(.28,.58,h,12,10),m.trunk);trunk.position.set(x,h/2+e.elevation,z);trunk.castShadow=true;g.add(trunk);
 if(!bare){const verts:number[]=[],colors:number[]=[];const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 for(let f=0;f<22;f++){const angle=f*2.39996,len=f<5?3.5+f*.25:7.1+(f%4)*.7,rise=f<5?5:1.7;const dir=new T.Vector3(Math.cos(angle),0,Math.sin(angle)),side=new T.Vector3(-dir.z,0,dir.x);const curve=new T.CatmullRomCurve3([new T.Vector3(x,h+e.elevation,z),new T.Vector3(x+dir.x*len*.5,h+rise+e.elevation,z+dir.z*len*.5),new T.Vector3(x+dir.x*len,h+(f<5?3:-3-(f%3))+e.elevation,z+dir.z*len)]);g.add(new T.Mesh(new T.TubeGeometry(curve,12,.035,3,false),m.leaf));
 for(let i=1;i<38;i++){const t=i/38,p=curve.getPoint(t),w=Math.sin(t*Math.PI)*1.4;for(const sign of [-1,1]){const tangent=curve.getTangent(t);a.copy(p).addScaledVector(tangent,-.065);b.copy(p).addScaledVector(side,w*sign).addScaledVector(dir,-.6);b.y-=.6+t*.5;c.copy(p).addScaledVector(tangent,.065);verts.push(...a.toArray(),...b.toArray(),...c.toArray());const shade=.72+(f%4)*.05;for(let k=0;k<3;k++)colors.push(.25*shade,.45*shade,.14*shade)}}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const leaf=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.9}));leaf.castShadow=true;g.add(leaf)}return g}
export function planting(e:Element,es:Element[],m:Finish){const g=solid(visibleFootprint(e,es),m.soil,.12,e.elevation+.01);const footprint=visibleFootprint(e,es);const inside=(x:number,z:number)=>{let yes=false;for(const pg of footprint){let local=false;for(const ring of pg){let h=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])h=!h}local=local!==h}yes ||=local}return yes};
 const positions:T.Vector3[]=[];for(let x=e.x+.6;x<e.x+e.width;x+=1.45)for(let z=e.z+.5;z<e.z+e.depth;z+=1.5)if(inside(x,z))positions.push(new T.Vector3(x,e.elevation+.5,z));
 const geo=new T.IcosahedronGeometry(.55,1),mesh=new T.InstancedMesh(geo,m.leaf,positions.length*5),dummy=new T.Object3D();let i=0;positions.forEach((p,j)=>{for(let k=0;k<5;k++){dummy.position.copy(p).add(new T.Vector3(Math.sin(j+k)*.52,(k%3)*.23,Math.cos(j+k)*.52));dummy.scale.set(.7+(j%4)*.13,.6+(j%3)*.16,.8+(j%5)*.08);dummy.rotation.set(j*.5,k,j*.3);dummy.updateMatrix();mesh.setMatrixAt(i++,dummy.matrix)}});mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return g;
}
export function furniture(e:Element,m:Finish){const g=new T.Group(),w=e.width,d=e.depth,h=e.height;
 if(e.style==='lounger'){g.add(block(0,.5,0,w,.28,d*.68,m.darkwood));const back=block(0,.5,d*.65,w,.25,d*.38,m.wood);back.rotation.x=-.45;g.add(back);g.add(block(.12,.8,.15,w-.24,.18,d*.56,m.trim));for(const z of [.2,d-.5])g.add(block(.2,0,z,w-.4,.65,.15,m.metal))}
 else if(e.style==='kitchen'){g.add(block(0,0,0,w,h,d,m.wall));g.add(block(-.1,h,0,w+.2,.22,d+.15,m.dark));g.add(block(w*.45,h+.2,.2,w*.4,.4,d*.65,m.metal));for(let x=.4;x<w;x+=2)g.add(block(x,.3,-.03,1.7,h-.5,.08,m.darkwood))}
 else {g.add(block(0,h,0,w,.18,d,m.wood));for(const x of [.4,w-.6])for(const z of [.3,d-.5])g.add(block(x,0,z,.15,h,.15,m.darkwood));const chairs=Math.max(2,Math.floor(w/2.5));for(let i=0;i<chairs;i++)for(const side of [-1,1]){const x=.7+i*(w-1.8)/Math.max(1,chairs-1),z=side<0?-1.6:d+.3;g.add(block(x,1.4,z,1.5,.16,1.4,m.trim));g.add(block(x,1.5,side<0?z:z+1.25,1.5,1.4,.15,m.darkwood));for(const dx of [0,1.35])g.add(block(x+dx,0,z,.1,1.5,1.3,m.darkwood))}}
 const root=new T.Group();g.position.set(-w/2,0,-d/2);root.add(g);root.position.set(e.x+w/2,e.elevation,e.z+d/2);root.rotation.y=-e.rotation*Math.PI/180;return root;
}
export function dock(e:Element,m:Finish){const g=solid(polyFor(e),m.wood,.35,e.elevation+.08);for(let x=e.x;x<e.x+e.width;x+=5)for(const z of [e.z+.2,e.z+e.depth-.3]){g.add(block(x,e.elevation-2,z,.3,2.7,.3,m.darkwood))}return g}
