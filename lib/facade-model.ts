import * as T from 'three';
import { block, solid, type Finish } from './scene-models';
import { difference, rect } from './geometry';
import { SITE } from './site-reference';
import { createFacade, type FacadeModel, type FacadePart } from './facade';
import type { Element } from './project';

const material=(color:string,roughness=.85)=>new T.MeshStandardMaterial({color,roughness});
function tube(points:T.Vector3[],mat:T.Material,r=.04){const path=new T.CurvePath<T.Vector3>();for(let i=1;i<points.length;i++)path.add(new T.LineCurve3(points[i-1],points[i]));const o=new T.Mesh(new T.TubeGeometry(path,Math.max(24,points.length*2),r,8,false),mat);o.castShadow=true;return o}
function shapeFor(w:number,h:number,arch:FacadePart['arch']){const s=new T.Shape();s.moveTo(0,0);s.lineTo(w,0);if(arch!=='rect'){const r=w/2,base=arch==='fan'?0:Math.max(0,h-r);s.lineTo(w,base);s.absellipse(r,base,r,Math.max(.05,h-base),0,Math.PI,false)}else{s.lineTo(w,h);s.lineTo(0,h)}s.closePath();return s}
function face(shape:T.Shape,m:T.Material,depth=.03){const mesh=new T.Mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:40}),m);mesh.castShadow=true;mesh.receiveShadow=true;return mesh}
function windowMesh(p:FacadePart,m:Finish){m={...m,glass:m.glass.clone()};m.glass.color.set(p.color);const g=new T.Group(),w=p.width,h=p.height,arch=p.arch,shape=shapeFor(w,h,arch),frame=m.trim,frameWidth=.075;
 const dark=new T.Mesh(new T.ShapeGeometry(shape),material('#203633',.5));dark.position.z=.08;g.add(dark);
 const glass=face(shape,m.glass,.035);glass.position.z=-.055;glass.castShadow=false;g.add(glass);
 // Continuous masonry surround, recessed sash and physical glazing bars.
 g.add(tube(shape.getPoints(64).map(q=>new T.Vector3(q.x,q.y,-.075)),frame,.125));
 if(arch!=='fan'){
  g.add(block(-.22,-.21,-.26,w+.44,.19,.55,frame));
  const straight=arch==='arch'?Math.max(0,h-w/2):h;
  for(let i=1;i<p.columns;i++)g.add(block(i*w/p.columns-frameWidth/2,0,-.16,frameWidth,straight,.14,frame));
  for(let j=1;j<p.rows;j++){const y=j*straight/p.rows;g.add(block(0,y,-.16,w,.065,.14,frame))}
  if(arch==='arch')g.add(block(0,straight-.045,-.16,w,.09,.14,frame));
  // Shutter returns visible on the rectangular lower windows.
  if(arch==='rect')for(const x of [-.42,w+.14]){g.add(block(x,0,-.02,.28,h,.13,material('#c4c7b4')));for(let i=1;i<h/.16;i++)g.add(block(x,i*.16,-.09,.28,.025,.16,frame))}
 }
 if(arch!=='rect'){const base=arch==='fan'?0:Math.max(0,h-w/2);for(let i=1;i<5;i++){const a=i*Math.PI/5;g.add(tube([new T.Vector3(w/2,base,-.15),new T.Vector3(w/2+Math.cos(a)*w/2,base+Math.sin(a)*(h-base),-.15)],frame,.035))}}
 // Soft vertical highlights are geometry, with environment reflections from real glass.
 const reflection=new T.Mesh(new T.PlaneGeometry(w*.075,Math.max(.2,h*.7)),new T.MeshBasicMaterial({color:'#dfeceb',transparent:true,opacity:.13,depthWrite:false,side:T.DoubleSide}));reflection.position.set(w*.19,h*.43,-.1);g.add(reflection);g.scale.z=p.depth/.35;
 return g;
}
function bayMesh(p:FacadePart,m:Finish){const g=new T.Group(),w=p.width,d=p.depth,bevel=Math.min(w*.17,1.15),points:[[number,number],...Array<[number,number]>]=[[0,0],[bevel,-d],[w-bevel,-d],[w,0],[w,.1],[0,.1]];
 g.add(solid([[points]],m.wall,p.y,p.y));g.add(solid([[points]],m.trim,.14,p.y-.04));
 const faces=[[0,0,bevel,-d],[bevel,-d,w-bevel,-d],[w-bevel,-d,w,0]];
 for(const [a,b,c,dz] of faces){const width=Math.hypot(c-a,dz-b),f={...p,width:Math.max(.15,width-.08),columns:width>2?p.columns:1,depth:.24,arch:'rect' as const},win=windowMesh(f,m);win.position.set(a+.02,p.y,b-.035);win.rotation.y=-Math.atan2(dz-b,c-a);g.add(win)}
 const band=solid([[points]],m.trim,.2,p.y+p.height+.22);g.add(band);return g;
}
type RoofFace=[T.Vector3,T.Vector3,T.Vector3,T.Vector3?];
function tiledRoof(faces:RoofFace[],p:FacadePart,m:Finish,detail:boolean){const g=new T.Group(),verts:number[]=[],uvs:number[]=[];
 const triangles:RoofFace[]=[];for(const f of faces){const idx=f[3]?[0,1,2,0,2,3]:[0,1,2];for(const i of idx){const v=f[i]!;verts.push(v.x,v.y,v.z);uvs.push(v.x/5,v.z/5+v.y/8)}triangles.push([f[0],f[1],f[2]]);if(f[3])triangles.push([f[0],f[2],f[3]])}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.computeVertexNormals();const roof=new T.Mesh(geo,m.roof);roof.material.side=T.DoubleSide;roof.castShadow=true;roof.receiveShadow=true;g.add(roof);
 if(detail){
  const tileGeo=new T.BufferGeometry(),v:number[]=[],n:number[]=[],idx:number[]=[];
  for(let row=0;row<=1;row++)for(let j=0;j<=8;j++){const a=j/8*Math.PI;v.push(Math.cos(a)*.24,Math.sin(a)*.13,row*.94);n.push(Math.cos(a),Math.sin(a),0)}
  for(let j=0;j<8;j++){idx.push(j,j+1,j+9,j+1,j+10,j+9)}tileGeo.setAttribute('position',new T.Float32BufferAttribute(v,3));tileGeo.setAttribute('normal',new T.Float32BufferAttribute(n,3));tileGeo.setIndex(idx);
  const transforms:T.Matrix4[]=[],colors:T.Color[]=[];
  for(const [a,b,c] of triangles){const normal=new T.Vector3().crossVectors(b.clone().sub(a),c.clone().sub(a)).normalize();if(normal.y<0)normal.negate();if(Math.abs(normal.y)<.1)continue;
   const uphill=new T.Vector3(-normal.x,0,-normal.z);if(uphill.length()<.01)uphill.set(0,0,1);uphill.normalize();uphill.y=-(normal.x*uphill.x+normal.z*uphill.z)/normal.y;uphill.normalize();const across=new T.Vector3().crossVectors(normal,uphill).normalize();const to2=(v:T.Vector3)=>new T.Vector2(v.dot(across),v.dot(uphill));const aa=to2(a),bb=to2(b),cc=to2(c),den=(bb.y-cc.y)*(aa.x-cc.x)+(cc.x-bb.x)*(aa.y-cc.y);
   const minX=Math.min(aa.x,bb.x,cc.x),maxX=Math.max(aa.x,bb.x,cc.x),minY=Math.min(aa.y,bb.y,cc.y),maxY=Math.max(aa.y,bb.y,cc.y);
   for(let y=Math.ceil(minY/.9)*.9;y<maxY-.25;y+=.9)for(let x=Math.ceil(minX/.48)*.48;x<maxX;x+=.48){const l1=((bb.y-cc.y)*(x-cc.x)+(cc.x-bb.x)*(y-cc.y))/den,l2=((cc.y-aa.y)*(x-cc.x)+(aa.x-cc.x)*(y-cc.y))/den,l3=1-l1-l2;if(Math.min(l1,l2,l3)<.015)continue;const pos=a.clone().multiplyScalar(l1).addScaledVector(b,l2).addScaledVector(c,l3).addScaledVector(normal,.03);const matrix=new T.Matrix4().makeBasis(across,normal,uphill);matrix.setPosition(pos);transforms.push(matrix);const shade=.86+.22*((Math.sin(x*4.3+y*7.1)*435.4)%1+1)/2;colors.push(new T.Color(m.roof.color).multiplyScalar(shade))}
  }
  const mat=new T.MeshStandardMaterial({color:'#ffffff',roughness:.95,side:T.DoubleSide}),tiles=new T.InstancedMesh(tileGeo,mat,transforms.length);transforms.forEach((v,i)=>{tiles.setMatrixAt(i,v);tiles.setColorAt(i,colors[i])});tiles.castShadow=true;tiles.receiveShadow=true;g.add(tiles);
 }
 for(const f of faces){g.add(tube([f[0],f[1]],m.roof,.13))}g.userData.roof=true;return g;
}
function roofMesh(p:FacadePart,m:Finish,detail:boolean){const g=new T.Group(),w=p.width,d=p.depth,h=p.rise,vec=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
 let fs:RoofFace[];
 if(p.kind==='gable'){fs=[[vec(0,0,0),vec(w/2,h,0),vec(w/2,h,d),vec(0,0,d)],[vec(w/2,h,0),vec(w,0,0),vec(w,0,d),vec(w/2,h,d)]];const cap=new T.Shape();cap.moveTo(.35,-.1);cap.lineTo(w-.35,-.1);cap.lineTo(w/2,h-.1);cap.closePath();const mesh=face(cap,m.wall,.18);mesh.position.z=.25;g.add(mesh);g.add(tube([vec(0,-.15,0),vec(w/2,h-.15,0),vec(w,-.15,0)],m.trim,.1));}
 else{const inset=Math.min(w,d)*.43;if(w>=d){const a=vec(inset,h,d/2),b=vec(w-inset,h,d/2);fs=[[vec(0,0,0),vec(w,0,0),b,a],[vec(w,0,0),vec(w,0,d),b],[vec(w,0,d),vec(0,0,d),a,b],[vec(0,0,d),vec(0,0,0),a]]}else{const a=vec(w/2,h,inset),b=vec(w/2,h,d-inset);fs=[[vec(0,0,0),vec(w,0,0),a],[vec(w,0,0),vec(w,0,d),b,a],[vec(w,0,d),vec(0,0,d),b],[vec(0,0,d),vec(0,0,0),a,b]]}}
 g.add(tiledRoof(fs,p,m,detail));
 // Layered cornice: fascia, projecting white moulding and shadow line.
 for(const [offset,y,thick] of [[0,-.25,.16],[.08,-.45,.18],[.18,-.62,.13]])g.add(block(offset,y*p.height/.3,offset,w-2*offset,thick*p.height/.3,d-2*offset,m.trim));return g;
}
function canopyMesh(p:FacadePart,m:Finish){const g=new T.Group(),w=p.width,d=p.depth,drop=d*p.slope/100,wood=material(p.id.includes('cart')?'#71452d':'#574432'),fascia=material('#484c43');
 const v=[0,-drop,0,w,-drop,0,w,0,d,0,0,d],geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setIndex([0,2,1,0,3,2]);geo.computeVertexNormals();const top=new T.Mesh(geo,new T.MeshPhysicalMaterial({color:p.color,roughness:.42,metalness:.3,side:T.DoubleSide,clearcoat:.3}));top.castShadow=true;top.receiveShadow=true;top.userData.roof=true;g.add(top);
 for(const z of [0,d-.14]){const y=-drop*(1-z/d);g.add(block(0,y-p.height,z,w,p.height,.18,wood));g.add(block(-.05,y,z-.02,w+.1,.12,.19,fascia))}
 for(const x of [0,w-.18]){const beam=block(x,-.25-drop/2,0,.18,.28,d,wood);beam.rotation.x=-Math.atan(drop/d);g.add(beam)}
 for(let x=.4;x<w;x+=1.6){const rafter=block(x,-.13-drop/2,0,.085,.12,d,wood);rafter.rotation.x=-Math.atan(drop/d);g.add(rafter)}
 const positions=[[.12,0],[w-.45,0],[.12,d-.4],[w-.45,d-.4]];positions.forEach(([x,z],i)=>{if(p.posts&(1<<i)){const h=p.y-drop*(1-z/d);g.add(block(x,-p.y,z,.32,h,.32,wood));g.add(block(x-.05,-p.y,z-.05,.42,.3,.42,m.trim))}});return g;
}
function portalMesh(p:FacadePart,m:Finish){const g=new T.Group(),w=p.width,h=p.height,d=p.depth,opening=w-.9,rise=Math.min(p.rise,opening/2),spring=h-rise-.4,shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(w,0);shape.lineTo(w,h);shape.lineTo(0,h);shape.closePath();const hole=new T.Path();hole.moveTo(.45,.02);hole.lineTo(.45,spring);hole.absellipse(w/2,spring,opening/2,rise,Math.PI,0,true);hole.lineTo(w-.45,.02);hole.closePath();shape.holes.push(hole);g.add(face(shape,material(p.color),.38));
 const archPoints=Array.from({length:41},(_,i)=>{const a=Math.PI-i*Math.PI/40;return new T.Vector3(w/2+Math.cos(a)*opening/2,spring+Math.sin(a)*rise,-.11)});g.add(tube([new T.Vector3(.45,0,-.11),...archPoints,new T.Vector3(w-.45,0,-.11)],m.trim,.14));
 g.add(block(.15,0,0,.3,h-.3,d,m.wall));g.add(block(w-.45,0,0,.3,h-.3,d,m.wall));g.add(block(.45,0,d-.16,w-.9,h-.2,.14,material('#181d1a')));
 const doorW=w-1.15,doorH=Math.min(7.65,h-1.3);g.add(block(.58,0,d-.24,doorW,doorH,.16,material('#202723',.3)));g.add(block(w/2-.04,0,d-.34,.08,doorH,.12,material('#0e1310')));
 for(const x of [.8,w/2+.15])for(const y of [.35,3.85]){const panel=block(x,y,d-.35,doorW/2-.42,3.2,.04,material('#111a15',.35));g.add(panel)}
 for(const x of [w/2-.25,w/2+.2]){g.add(block(x,3.35,d-.47,.055,.65,.08,m.metal))}
 g.add(block(.42,-.06,d-.4,w-.84,.12,.55,m.trim));
 return g;
}
function gateMesh(p:FacadePart,m:Finish){const g=new T.Group(),mat=material(p.color,.4),w=p.width,h=p.height;for(const x of [0,w-.14])g.add(block(x,0,0,.14,h,.16,mat));for(const y of [0,h-.13])g.add(block(0,y,0,w,.13,.16,mat));for(let i=1;i<p.columns;i++)g.add(block(i*w/p.columns,0,.04,.055,h,.055,mat));for(let i=1;i<p.rows;i++)g.add(block(0,i*h/p.rows,0,w,.085,.13,mat));g.add(block(w-.35,h*.48,-.1,.2,.08,.22,m.dark));g.scale.z=p.depth/.18;return g}
export function photoResidence(e:Element,m:Finish,roofs:boolean,model:FacadeModel=createFacade(),selected?:string|null,roofDetail=true){
 const g=new T.Group(),wall=m.wall.clone(),trim=m.trim.clone(),roof=m.roof.clone();wall.color.set(model.wallColor);trim.color.set(model.trimColor);roof.color.set(model.roofColor);const local={...m,wall,trim,roof};
 const entrance=model.parts.find(p=>p.kind==='portal'&&p.visible),canonical=[[SITE.building]];
 const footprint=entrance?difference(canonical,rect(entrance.x-.08,entrance.z-.12,entrance.width+.16,entrance.depth+.4)):canonical;
 g.add(solid(footprint,wall,11.15,11.15));
 // Rear masses stay tied to the original GIS trace; facade edits do not change paving quantities.
 for(const [x,z,w,d] of [[15.2,58.5,19,16.5],[33.8,50,22,15.5],[55.5,53.5,18.2,31.9]]){const p={...model.parts[0],kind:'hip' as const,width:w+1.3,depth:d+1.2,rise:3.8};const r=roofMesh(p,local,model.roofDetail&&roofDetail);r.position.set(x-.65,11.5,z-.6);r.userData.roof=true;g.add(r)}
 for(const p of model.parts){if(!p.visible)continue;const node=new T.Group(),partMaterial=material(p.color);let visual:T.Object3D;
  if(p.kind==='volume')visual=block(0,0,0,p.width,p.height,p.depth,partMaterial);
  else if(p.kind==='gable'||p.kind==='hip'){const partRoof=local.roof.clone();partRoof.color.set(p.color);visual=roofMesh(p,{...local,roof:partRoof},model.roofDetail&&roofDetail);visual.userData.roof=true}
  else if(p.kind==='window')visual=windowMesh(p,local);
  else if(p.kind==='bay'){visual=bayMesh(p,local);visual.position.y=-p.y}
  else if(p.kind==='portal')visual=portalMesh(p,local);
  else if(p.kind==='canopy')visual=canopyMesh(p,local);
  else if(p.kind==='gate')visual=gateMesh(p,local);
  else if(p.kind==='oculus'){const o=new T.Group(),glass=new T.Mesh(new T.CircleGeometry(1,48),local.glass);glass.scale.set(p.width/2-.12,p.height/2-.12,1);glass.position.set(p.width/2,p.height/2,-.04);o.add(glass);const ring=new T.Mesh(new T.TorusGeometry(1,.1,10,64),trim);ring.scale.set(p.width/2,p.height/2,p.depth/.2);ring.position.set(p.width/2,p.height/2,-.13);ring.castShadow=true;o.add(ring);visual=o}
  else if(p.kind==='vent'){const o=new T.Group();o.add(block(0,0,0,p.width,p.height,p.depth,partMaterial));for(let y=.08;y<p.height;y+=.15)o.add(block(0,y,-.06,p.width,.035,.08,local.dark));visual=o}
  else visual=block(0,0,0,p.width,p.height,p.depth,partMaterial);
  node.add(visual);node.position.set(p.x,p.y,p.z);node.rotation.y=p.rotation*Math.PI/180;node.userData.facadeId=p.id;g.add(node);
  if(p.id===selected){const box=new T.BoxHelper(visual,'#d19e4f');box.material.depthTest=false;box.renderOrder=9;node.add(box)}
 }
 // Skirting, horizontal string course, address numerals, drains and rear glazing.
 for(const [x,z,w] of [[9.33,28.74,14.3],[23.65,17.78,26.1],[56.4,14.5,17]]){g.add(block(x,2.2,z-.09,w,.16,.16,trim));g.add(block(x,10.1,z-.18,w,.2,.25,trim))}
 if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d')!;ctx.fillStyle='#665f51';ctx.font='70px Georgia';ctx.fillText('2331',8,90);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;const numbers=new T.Mesh(new T.PlaneGeometry(2.15,.54),new T.MeshBasicMaterial({map:t,transparent:true,side:T.DoubleSide}));numbers.position.set(31.4,1.8,16.38);g.add(numbers)}
 for(const [x,z,w] of [[18.4,75.11,12.7],[40,65.5,12],[60,85.5,11.8]]){const p={...model.parts[0],width:w,height:7.2,columns:4,rows:3,arch:'rect' as const};const o=windowMesh(p,local);o.position.set(x+w,2,z);o.rotation.y=Math.PI;g.add(o)}
 g.traverse(o=>{if(o.userData.roof)o.visible=roofs});
 const root=new T.Group();g.position.set(-9.33,0,-14.565);root.add(g);root.scale.set(e.width/64.503,e.height/30,e.depth/70.83);root.position.set(e.x,e.elevation,e.z);root.rotation.y=-e.rotation*Math.PI/180;
 if(e.rotation){root.position.set(e.x+e.width/2,e.elevation,e.z+e.depth/2);g.position.set(-9.33-64.503/2,0,-14.565-70.83/2)}return root;
}
