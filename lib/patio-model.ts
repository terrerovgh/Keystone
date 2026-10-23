import * as T from 'three';
import type { Element } from './project';
import { bounds, difference, intersection, polyFor, rect, visibleFootprint, type MultiPolygon } from './geometry';
import { block, solid, planting, type Finish } from './scene-models';

/** Visual details follow the editable plan; no photo detail changes quantities. */
export function deckSurface(polys:MultiPolygon,m:Finish,top:number,e?:Element,axis:'x'|'z'='x') {
  const g=new T.Group(),wood=m.wood.clone();wood.color.set('#967b5e');wood.roughness=.78;
  if(typeof document!=='undefined'){
    const c=document.createElement('canvas');c.width=256;c.height=512;const ctx=c.getContext('2d')!;
    ctx.fillStyle='#bba58a';ctx.fillRect(0,0,256,512);let seed=27;
    const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
    for(let i=0;i<5000;i++){const x=random()*256,y=random()*512;ctx.fillStyle=i%3?'rgba(242,229,205,.24)':'rgba(65,46,30,.15)';ctx.fillRect(x,y,1+random()*2,3+random()*70)}
    const map=new T.CanvasTexture(c);map.wrapS=map.wrapT=T.RepeatWrapping;map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
    map.center.set(.5,.5);map.rotation=axis==='x'?Math.PI/2:0;wood.map=map;wood.bumpMap=map;wood.bumpScale=.018;
  }
  g.add(solid(polys,wood,.16,top,e));
  // Board spacing and butt lengths are visual estimates, not measured quantities.
  const board=5.5/12,joint=.018,lines:MultiPolygon=[],b=bounds(polys);
  for(let n=Math.floor((axis==='x'?b.z:b.x)/board)*board;n<(axis==='x'?b.maxZ:b.maxX);n+=board)
    lines.push(...intersection(polys,axis==='x'?rect(b.x-1,n,b.maxX-b.x+2,joint):rect(n,b.z-1,joint,b.maxZ-b.z+2)));
  for(let row=0;row<Math.ceil((axis==='x'?b.maxZ-b.z:b.maxX-b.x)/board);row++){
    const cross=(axis==='x'?b.z:b.x)+row*board;
    for(let n=(axis==='x'?b.x:b.z)+(row%3)*3;n<(axis==='x'?b.maxX:b.maxZ);n+=12)
      lines.push(...intersection(polys,axis==='x'?rect(n,cross,joint,board):rect(cross,n,board,joint)));
  }
  if(lines.length)g.add(solid(lines,m.darkwood,.01,top+.006,e));
  return g;
}
export function poolEntry(width:number,depth:number,edge:number,m:Finish){
  const g=new T.Group(),blue=new T.MeshStandardMaterial({color:'#134d79',roughness:.3});
  const run=Math.min(1.05,(depth-edge*2)/6),clear=width-edge*2;
  for(let i=0;i<3;i++){const step=block(edge,-.5-i*.46,edge+i*run,clear,.13,run,blue);step.name=`video-pool-step-${i}`;g.add(step)}
  const grout=new T.MeshStandardMaterial({color:'#7395a6',roughness:.6});
  for(let i=0;i<3;i++)for(let x=edge+.25;x<width-edge;x+=.25)g.add(block(x,-.365-i*.46,edge+i*run,.008,.006,run,grout));
  g.userData.evidence='patio1.MOV 16.67–18.50 s';return g;
}

export function photoPool(e:Element,m:Finish,woodCoping:boolean) {
  const g=new T.Group(),w=e.width,d=e.depth,edge=e.style==='croquis-pool'?.5:Math.min(.65,w*.1,d*.1),bottom=-Math.max(1,e.height),inner=rect(edge,edge,w-edge*2,d-edge*2);
  const tile=new T.MeshStandardMaterial({color:'#83c4c6',roughness:.55});
  // The excavation hides the land under the open basin in the scene.
  g.add(solid(difference(rect(0,0,w,d),inner),woodCoping?m.darkwood:m.pool,.28,.13));
  for(const [x,z,ww,dd] of [[edge,edge,w-edge*2,.12],[edge,d-edge-.12,w-edge*2,.12],[edge,edge,.12,d-edge*2],[w-edge-.12,edge,.12,d-edge*2]])g.add(block(x,bottom,z,ww,-bottom,dd,tile));
  g.add(block(edge,bottom,edge,w-edge*2,.08,d-edge*2,tile));
  const water=m.water.clone();water.color.set('#55a8b5');water.opacity=.48;water.roughness=.09;water.envMapIntensity=1.5;
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle='#8080ff';ctx.fillRect(0,0,256,256);
  for(let i=0;i<90;i++){ctx.strokeStyle=`rgba(${110+i%40},${120+i%25},255,.25)`;ctx.beginPath();for(let x=0;x<=256;x+=4){const y=(i*19+Math.sin(x*.06+i)*4)%256;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}
  const normal=new T.CanvasTexture(c);normal.wrapS=normal.wrapT=T.RepeatWrapping;normal.repeat.set(3,6);water.normalMap=normal;water.normalScale.set(.12,.12);
  const sheet=new T.Mesh(new T.PlaneGeometry(w-edge*2,d-edge*2,12,24),water);sheet.rotation.x=-Math.PI/2;sheet.position.set(w/2,-.2,d/2);sheet.receiveShadow=true;g.add(sheet);
  const band=new T.MeshStandardMaterial({color:'#276c86',roughness:.25});
  for(const [x,z,ww,dd] of [[edge,edge,w-edge*2,.035],[edge,d-edge-.035,w-edge*2,.035],[edge,edge,.035,d-edge*2],[w-edge-.035,edge,.035,d-edge*2]])g.add(block(x,-.35,z,ww,.2,dd,band));
  // Entry steps sit below the water surface; depth is still provisional.
  g.add(poolEntry(w,d,edge,m));
  const root=new T.Group();g.position.set(-w/2,0,-d/2);root.add(g);root.position.set(e.x+w/2,e.elevation,e.z+d/2);root.rotation.y=-e.rotation*Math.PI/180;return root;
}

export function photoSteps(e:Element,m:Finish) {
  const g=new T.Group(),dock=e.style==='dock-descent',count=dock?2:e.style==='house-descent'?4:3,tile=(dock?m.wood:m.paver).clone();if(!dock)tile.color.set('#c28b70');
  for(let i=0;i<count;i++){const inset=dock?0:i*.35,z=e.z,w=e.width-inset*2,depth=e.depth*(count-i)/count,bevel=dock?0:Math.min(e.style==='house-descent'?1.6:1.1,w*.12,depth*.8),x=e.x+inset;
    const ring:[number,number][] = bevel?[[x,z],[x+w,z],[x+w,z+depth-bevel],[x+w-bevel,z+depth],[x+bevel,z+depth],[x,z+depth-bevel]]:[[x,z],[x+w,z],[x+w,z+depth],[x,z+depth]];
    const stair=solid([[ring]],tile,e.height*(i+1)/count,e.elevation+e.height*(i+1)/count);stair.name=`${dock?'dock':'house'}-tread-${i+1}`;g.add(stair);
  }return g;
}

export function photoFurniture(e:Element,m:Finish,blueChair=false) {
  const g=new T.Group(),w=e.width,d=e.depth,h=e.height,steel=new T.MeshStandardMaterial({color:'#a9aeaa',metalness:.8,roughness:.28}),slat=new T.MeshStandardMaterial({color:blueChair?'#235f85':'#524c42',roughness:.55});
  if(blueChair){
    const scale=Math.min(w/2.5,d/3.2);g.scale.set(scale,scale,scale);
    for(let i=0;i<6;i++){g.add(block(i*.36,.95,.4,.3,.13,1.55,slat));const back=block(i*.36,1,1.8,.3,2.25,.12,slat);back.rotation.x=.2;g.add(back)}
    for(const x of [.06,2.0]){g.add(block(x,0,.45,.14,1.65,.16,slat));g.add(block(x,1.5,.2,.4,.16,2,slat));g.add(block(x,.05,1.8,.14,1.3,.16,slat))}
  }else if(e.style==='kitchen'){
    const stone=new T.MeshStandardMaterial({color:'#aaa493',roughness:.98}),grout=new T.MeshStandardMaterial({color:'#736f62',roughness:1});
    const support=(x:number,ww:number)=>{
      g.add(block(x,0,0,ww,h,d,grout));
      for(let row=0;row<Math.ceil(h/.55);row++)for(let col=0;col<Math.ceil(ww/.72);col++){
        const xx=x+col*.72,yy=row*.55,piece=block(xx+.025,yy+.025,-.07,Math.min(.67,x+ww-xx-.02),Math.min(.49,h-yy-.02),.18,stone);
        piece.rotation.z=Math.sin(row*8+col)*.035;g.add(piece);
      }
    };
    support(0,w*.15);support(w*.78,w*.22);
    const counter=new T.MeshStandardMaterial({color:'#849f98',roughness:.25,metalness:.15});
    g.add(block(-.08,h,-.08,w+.16,.2,d+.16,counter));
    const grillW=w*.54;g.add(block(w*.18,h+.2,.1,grillW,.16,d*.8,steel));
    const hood=block(w*.18,h+.36,.2,grillW,1,d*.65,steel);g.add(hood);g.add(block(w*.25,h+.7,.1,grillW*.7,.07,.08,m.dark));
    for(let i=0;i<6;i++){const knob=new T.Mesh(new T.CylinderGeometry(.08,.08,.06,12),steel);knob.rotation.x=Math.PI/2;knob.position.set(w*.24+i*grillW*.14,h+.14,-.1);g.add(knob)}
    g.add(block(w*.82,h+.2,.2,w*.15,.16,d*.7,steel));
    g.userData.evidence='patio1.MOV 1.97 s';
  }else{
    const glass=new T.MeshPhysicalMaterial({color:'#b2d3d0',roughness:.08,metalness:.08,transmission:.38,thickness:.09,transparent:true,opacity:.8});
    g.add(block(0,h,0,w,.09,d,glass));for(const x of [.08,w-.17])for(const z of [.08,d-.17])g.add(block(x,0,z,.09,h,.09,steel));
    g.add(block(0,h-.2,0,w,.1,.08,steel));g.add(block(0,h-.2,d-.08,w,.1,.08,steel));
    const count=Math.max(2,Math.floor(w/2.2)),seat=h*.61;
    for(let i=0;i<count;i++)for(const side of [-1,1]){const x=.35+i*(w-1.8)/Math.max(1,count-1),z=side<0?-1.7:d+.3;
      for(const xx of [x,x+1.35])for(const zz of [z,z+1.2])g.add(block(xx,0,zz,.065,seat,.065,steel));
      g.add(block(x,seat,z,1.45,.1,1.3,slat));for(let j=0;j<4;j++)g.add(block(x,seat+.2+j*.28,side<0?z:z+1.25,1.45,.22,.07,slat));
      g.add(block(x,.7,z,1.45,.04,.04,steel));
    }
  }
  const root=new T.Group();g.position.set(-w/2,0,-d/2);root.add(g);root.position.set(e.x+w/2,e.elevation,e.z+d/2);root.rotation.y=-e.rotation*Math.PI/180;return root;
}

/** Canal fittings stay attached to the existing dock and palm, without changing saved contours. */
export function videoDockDetails(e:Element,elements:Element[],m:Finish){
  const g=deckSurface(polyFor(e),m,e.elevation+.08,e,'z');
  if(e.id!=='dock')return g;
  const palm=elements.find(p=>p.id==='back-palm'),anchor=palm?palm.x+palm.width/2:e.x+e.width*.74;
  const x=Math.max(e.x,Math.min(anchor-5,e.x+e.width-7)),z=e.z-1.8,benchLevel=elements.find(p=>p.id==='back-floor')?.elevation??e.elevation,wood=m.darkwood.clone();wood.color.set('#6b4b34');
  const bench=(xx:number,zz:number,w:number,d:number)=>{
    g.add(block(xx,benchLevel,zz,w,1.35,d,wood));
    g.add(block(xx-.04,benchLevel+1.35,zz-.04,w+.08,.16,d+.08,m.wood));
    for(let n=xx+.5;n<xx+w;n+=.5)g.add(block(n,benchLevel,zz-.015,.014,1.3,.025,m.darkwood));
  };
  bench(x,z,4.5,1.5);bench(x+4.5,z,1.5,4.2);
  // Only sparse full-size mooring piles, not a regular fence of small posts.
  for(const xx of [e.x+e.width*.38,e.x+e.width*.76]){
    const pile=new T.Mesh(new T.CylinderGeometry(.25,.3,5.5,12),m.trunk);pile.position.set(xx,e.elevation+1.5,e.z+e.depth-.2);pile.castShadow=true;g.add(pile);
  }
  g.add(block(e.x,e.elevation+.065,e.z,e.width,.045,.48,wood));
  g.userData.evidence='patio2.mov 2.13–4.13 s';return g;
}
export function videoPlantingPocket(elements:Element[],m:Finish){
  const g=new T.Group(),p=elements.find(e=>e.id==='back-palm'),deck=elements.find(e=>e.id==='back-floor');if(!p||!deck)return g;
  const x=p.x-.65,z=p.z-.4,w=p.width+1.3,d=p.depth+1.6,y=deck.elevation+.018;
  g.add(block(x,y,z,w,.025,d,m.soil));
  for(const [xx,zz,ww,dd] of [[x,z,w,.16],[x,z+d-.16,w,.16],[x,z,.16,d],[x+w-.16,z,.16,d]])g.add(block(xx,y+.01,zz,ww,.1,dd,m.darkwood));
  g.userData.evidence='patio2.mov 2.13 / 7.13 s';return g;
}

export function videoPlanting(e:Element,elements:Element[],m:Finish){
  const footprint=visibleFootprint(e,elements),g=planting(e,elements,m),b=bounds(footprint),vertices:number[]=[],colors:number[]=[];
  const inside=(x:number,z:number)=>footprint.some(pg=>{
    const contains=(ring:number[][])=>{let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++)if((ring[i][1]>z)!==(ring[j][1]>z)&&x<(ring[j][0]-ring[i][0])*(z-ring[i][1])/(ring[j][1]-ring[i][1])+ring[i][0])hit=!hit;return hit};
    return contains(pg[0])&&!pg.slice(1).some(contains);
  });
  let seed=0;
  for(let x=b.x+.6;x<b.maxX;x+=1.8)for(let z=b.z+.6;z<b.maxZ;z+=1.8){if(!inside(x,z))continue;const tall=e.id==='back-garden',height=(tall?5.3:2.8)*(.75+(seed%7)/24);
    for(let f=0;f<9;f++){
      const angle=f*2.399+seed*.4,dir=new T.Vector3(Math.cos(angle),0,Math.sin(angle)),side=new T.Vector3(-dir.z,0,dir.x),reach=tall?2.5:1.7;
      const stemPoints=Array.from({length:9},(_,j)=>{const t=j/8;return new T.Vector3(x+dir.x*reach*t,e.elevation+.15+height*Math.sin(t*Math.PI*.67),z+dir.z*reach*t)});
      const stem=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(stemPoints),8,.018,4,false),m.leaf);stem.castShadow=true;g.add(stem);
      for(let i=1;i<22;i++){
        const t=i/22,point=new T.Vector3(x+dir.x*reach*t,e.elevation+.15+height*Math.sin(t*Math.PI*.67),z+dir.z*reach*t),length=Math.sin(t*Math.PI)*.6;
        for(const sign of [-1,1]){
          const a=point.clone().addScaledVector(dir,-.045),c=point.clone().addScaledVector(dir,.045),tip=point.clone().addScaledVector(side,sign*length).addScaledVector(dir,-.23);tip.y-=.2+t*.2;
          vertices.push(...a.toArray(),...tip.toArray(),...c.toArray());
          const shade=.72+((seed+f+i)%5)*.065;for(let n=0;n<3;n++)colors.push(.25*shade,.43*shade,.11*shade);
        }
      }
    }seed++;
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  const leaves=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.87}));leaves.castShadow=true;leaves.receiveShadow=true;g.add(leaves);return g;
}
