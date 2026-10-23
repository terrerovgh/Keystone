import * as T from 'three';
import type { Element } from './project';
import { difference, intersection, polyFor, rect, type MultiPolygon } from './geometry';
import { block, solid, type Finish } from './scene-models';

/** Visual details follow the editable plan; no photo detail changes quantities. */
export function deckSurface(polys:MultiPolygon,m:Finish,top:number,e?:Element) {
  const g=new T.Group(),wood=m.wood.clone();wood.color.set('#725741');wood.roughness=.34;
  const map=wood.map?.clone();if(map){map.repeat.set(1,1);map.center.set(.5,.5);map.rotation=Math.PI/2;wood.map=map;wood.bumpMap=map;wood.bumpScale=.025}
  g.add(solid(polys,wood,.16,top,e));
  // Joints every 5.5 inches are a rendering assumption, not a measured board schedule.
  const board=5.5/12,joint=.018,lines:MultiPolygon=[];
  for(let z=60;z<130;z+=board)lines.push(...intersection(polys,rect(-10,z,110,joint)));
  if(lines.length)g.add(solid(lines,m.darkwood,.012,top+.008,e));
  return g;
}

export function photoPool(e:Element,m:Finish,woodCoping:boolean) {
  const g=new T.Group(),w=e.width,d=e.depth,edge=Math.min(.65,w*.1,d*.1),bottom=-Math.max(1,e.height),inner=rect(edge,edge,w-edge*2,d-edge*2);
  const tile=new T.MeshStandardMaterial({color:'#83c4c6',roughness:.55});
  // The excavation hides the land under the open basin in the scene.
  g.add(solid(difference(rect(0,0,w,d),inner),woodCoping?m.darkwood:m.pool,.28,.13));
  for(const [x,z,ww,dd] of [[edge,edge,w-edge*2,.12],[edge,d-edge-.12,w-edge*2,.12],[edge,edge,.12,d-edge*2],[w-edge-.12,edge,.12,d-edge*2]])g.add(block(x,bottom,z,ww,-bottom,dd,tile));
  g.add(block(edge,bottom,edge,w-edge*2,.08,d-edge*2,tile));
  const water=m.water.clone();water.color.set('#39abbc');water.opacity=.73;water.roughness=.09;water.envMapIntensity=1.5;
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle='#8080ff';ctx.fillRect(0,0,256,256);
  for(let i=0;i<90;i++){ctx.strokeStyle=`rgba(${110+i%40},${120+i%25},255,.25)`;ctx.beginPath();for(let x=0;x<=256;x+=4){const y=(i*19+Math.sin(x*.06+i)*4)%256;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}
  const normal=new T.CanvasTexture(c);normal.wrapS=normal.wrapT=T.RepeatWrapping;normal.repeat.set(3,6);water.normalMap=normal;water.normalScale.set(.12,.12);
  const sheet=new T.Mesh(new T.PlaneGeometry(w-edge*2,d-edge*2,12,24),water);sheet.rotation.x=-Math.PI/2;sheet.position.set(w/2,-.2,d/2);sheet.receiveShadow=true;g.add(sheet);
  const band=new T.MeshStandardMaterial({color:'#276c86',roughness:.25});
  for(const [x,z,ww,dd] of [[edge,edge,w-edge*2,.035],[edge,d-edge-.035,w-edge*2,.035],[edge,edge,.035,d-edge*2],[w-edge-.035,edge,.035,d-edge*2]])g.add(block(x,-.35,z,ww,.2,dd,band));
  // Entry steps sit below the water surface; depth is still provisional.
  for(let i=0;i<3;i++)g.add(block(edge+.12,-.65-i*.42,edge+.12+i*.7,Math.min(w-edge*2-.24,5),.12,.72,tile));
  const root=new T.Group();g.position.set(-w/2,0,-d/2);root.add(g);root.position.set(e.x+w/2,e.elevation,e.z+d/2);root.rotation.y=-e.rotation*Math.PI/180;return root;
}

export function photoSteps(e:Element,m:Finish) {
  const g=new T.Group(),tile=m.paver.clone();tile.color.set('#c28b70');
  for(let i=0;i<3;i++){const inset=i*.35,z=e.z,w=e.width-inset*2,depth=e.depth*(3-i)/3,bevel=Math.min(1.1,w*.12),x=e.x+inset;
    const ring:[number,number][]=[[x,z],[x+w,z],[x+w,z+depth-bevel],[x+w-bevel,z+depth],[x+bevel,z+depth],[x,z+depth-bevel]];
    g.add(solid([[ring]],tile,e.height*(i+1)/3,e.elevation+e.height*(i+1)/3));
  }return g;
}

export function photoFurniture(e:Element,m:Finish,blueChair=false) {
  const g=new T.Group(),w=e.width,d=e.depth,h=e.height,steel=new T.MeshStandardMaterial({color:'#a9aeaa',metalness:.8,roughness:.28}),slat=new T.MeshStandardMaterial({color:blueChair?'#235f85':'#524c42',roughness:.55});
  if(blueChair){
    const scale=Math.min(w/2.5,d/3.2);g.scale.set(scale,scale,scale);
    for(let i=0;i<6;i++){g.add(block(i*.36,.95,.4,.3,.13,1.55,slat));const back=block(i*.36,1,1.8,.3,2.25,.12,slat);back.rotation.x=.2;g.add(back)}
    for(const x of [.06,2.0]){g.add(block(x,0,.45,.14,1.65,.16,slat));g.add(block(x,1.5,.2,.4,.16,2,slat));g.add(block(x,.05,1.8,.14,1.3,.16,slat))}
  }else if(e.style==='kitchen'){
    g.add(block(0,0,0,w,h,d,m.wall));g.add(block(-.08,h,-.08,w+.16,.18,d+.16,m.dark));
    for(let x=.2;x<w-.3;x+=1.9){g.add(block(x,.15,-.045,1.65,h-.3,.07,steel));g.add(block(x+.7,h*.55,-.13,.45,.05,.08,m.dark))}
    const grillW=w*.42;g.add(block(w*.12,h+.18,.1,grillW,.16,d*.8,steel));
    const hood=block(w*.12,h+.34,.2,grillW,1,d*.65,steel);g.add(hood);g.add(block(w*.2,h+.7,.1,grillW*.65,.07,.08,m.dark));
    g.add(block(w*.76,h+.18,d*.25,w*.17,.045,d*.5,steel));g.add(block(w*.82,h+.18,d*.45,.07,.65,.07,steel));
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
