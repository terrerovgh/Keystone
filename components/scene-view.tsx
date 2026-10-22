'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { difference, intersection, polyFor, type MultiPolygon } from '@/lib/geometry';
import type { ViewProps } from './plan-view';
function solid(polys:MultiPolygon,color:string,height:number,y:number){
  const group=new THREE.Group();
  for(const poly of polys){
    const shape=new THREE.Shape(poly[0].map(([x,z])=>new THREE.Vector2(x,-z)));
    poly.slice(1).forEach(r=>shape.holes.push(new THREE.Path(r.map(([x,z])=>new THREE.Vector2(x,-z)))));
    const geom=new THREE.ExtrudeGeometry(shape,{depth:Math.max(.04,height),bevelEnabled:false});geom.rotateX(-Math.PI/2);
    const mesh=new THREE.Mesh(geom,new THREE.MeshStandardMaterial({color,roughness:.88}));mesh.position.y=y;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
  }return group;
}
function box(x:number,y:number,z:number,w:number,h:number,d:number,color:string){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.82}));m.position.set(x+w/2,y+h/2,z+d/2);m.castShadow=true;m.receiveShadow=true;return m;}
export default function SceneView(props:ViewProps){
  const host=useRef<HTMLDivElement>(null),api=useRef<{renderer:THREE.WebGLRenderer;scene:THREE.Scene;camera:THREE.PerspectiveCamera;controls:OrbitControls;group:THREE.Group}|null>(null),latest=useRef(props),[error,setError]=useState(false);
  latest.current=props;
  useEffect(()=>{
    const dom=host.current!;let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true})}catch{setError(true);return}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor('#e8ede6');renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;
    renderer.domElement.setAttribute('aria-label','Modelo 3D interactivo del proyecto');dom.appendChild(renderer.domElement);
    const scene=new THREE.Scene();scene.fog=new THREE.Fog('#e8ede6',190,400);
    scene.add(new THREE.HemisphereLight('#fffdf2','#73866b',2));const light=new THREE.DirectionalLight('#fff4dd',2.3);light.position.set(-30,100,-30);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-110,right:110,top:150,bottom:-80,near:1,far:300});light.shadow.bias=-.0005;scene.add(light);
    const camera=new THREE.PerspectiveCamera(40,1,.1,800),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI/2-.06;controls.minDistance=18;controls.maxDistance=240;controls.target.set(37,0,28);
    const group=new THREE.Group();scene.add(group);api.current={renderer,scene,camera,controls,group};
    const resize=()=>{const w=dom.clientWidth,h=dom.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()};const observer=new ResizeObserver(resize);observer.observe(dom);resize();
    const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);let dragging:{id:string;x:number;z:number;start:THREE.Vector3;object:THREE.Object3D;pos:THREE.Vector3;last:THREE.Vector3}|null=null,down:{x:number;y:number;id:string|null}|null=null;
    const cast=(ev:PointerEvent)=>{const r=renderer.domElement.getBoundingClientRect();pointer.set((ev.clientX-r.left)/r.width*2-1,-(ev.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);};
    const hit=(ev:PointerEvent)=>{cast(ev);return ray.intersectObjects(group.children,true).find(h=>{let o:THREE.Object3D|null=h.object;while(o&&!o.userData.elementId)o=o.parent;return !!o?.userData.elementId})};
    const start=(ev:PointerEvent)=>{
      const h=hit(ev);let obj=h?.object;while(obj&&!obj.userData.elementId)obj=obj.parent??undefined;const id=obj?.userData.elementId??null;down={x:ev.clientX,y:ev.clientY,id};
      const p=latest.current,e=p.proposal.elements.find(e=>e.id===id);
      if(p.stage==='proposed'&&p.tool==='move'&&e&&!e.locked&&obj){const start=new THREE.Vector3();ray.ray.intersectPlane(plane,start);dragging={id:e.id,x:e.x,z:e.z,start,object:obj,pos:obj.position.clone(),last:start.clone()};controls.enabled=false;renderer.domElement.setPointerCapture(ev.pointerId);p.onSelect(e.id)}
    };
    const move=(ev:PointerEvent)=>{if(!dragging)return;cast(ev);const next=new THREE.Vector3();if(ray.ray.intersectPlane(plane,next)){dragging.last=next;const delta=next.clone().sub(dragging.start);dragging.object.position.copy(dragging.pos).add(new THREE.Vector3(delta.x,0,delta.z))}};
    const end=(ev:PointerEvent)=>{if(dragging){const d=dragging;dragging=null;controls.enabled=true;const delta=d.last.clone().sub(d.start);d.object.position.copy(d.pos);latest.current.onChange(d.id,{x:Math.round((d.x+delta.x)*4)/4,z:Math.round((d.z+delta.z)*4)/4});}else if(down&&Math.hypot(ev.clientX-down.x,ev.clientY-down.y)<5)latest.current.onSelect(down.id);down=null};
    const cancel=()=>{if(dragging)dragging.object.position.copy(dragging.pos);dragging=null;down=null;controls.enabled=true};
    renderer.domElement.addEventListener('pointerdown',start);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',end);renderer.domElement.addEventListener('pointercancel',cancel);
    let frame=0;const loop=()=>{frame=requestAnimationFrame(loop);controls.update();renderer.render(scene,camera)};loop();
    return()=>{cancelAnimationFrame(frame);observer.disconnect();controls.dispose();scene.traverse(o=>{const m=o as THREE.Mesh;if(m.geometry)m.geometry.dispose();if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(m=>m.dispose())});renderer.dispose();dom.removeChild(renderer.domElement);api.current=null};
  },[]);
  useEffect(()=>{const a=api.current;if(!a)return;const z=props.zone==='front'?28:103;a.camera.position.set(112,90,props.zone==='front'?-60:175);a.controls.target.set(37,0,z);a.controls.update()},[props.zone]);
  useEffect(()=>{
    const a=api.current;if(!a)return;const {group}=a;
    while(group.children.length){const obj=group.children[0];group.remove(obj);obj.traverse(o=>{const m=o as THREE.Mesh;if(m.geometry)m.geometry.dispose();if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(m=>m.dispose())})}
    const p=props.proposal,s=p.settings,es=props.stage==='proposed'?p.elements:props.existing;
    group.add(box(-35,-.6,-16,145,.5,155,'#bdc8aa'));group.add(box(-35,-.1,-12,145,.15,10,'#b9bbb5'));group.add(box(-35,-.06,5,145,.16,3,'#deded3'));group.add(box(-35,-.5,125,145,.15,40,'#89b5b3'));
    for(const zone of ['front','back'] as const){
      const d=zone===props.zone?props.data:null;
      if(props.stage==='proposed'){
        const data=d??null;
        // Other zone remains visible as a quiet footprint; focused zone has exact tile geometry.
        if(data){
          const layered=(polys:MultiPolygon,color:string,thickness:number)=>{let rest=polys;for(const e of [...es].reverse().filter(e=>e.zone===zone&&['paving','path'].includes(e.kind)&&e.action!=='retirar')){const part=intersection(rest,polyFor(e));if(part.length)group.add(solid(part,color,thickness,e.elevation));rest=difference(rest,polyFor(e))}if(rest.length)group.add(solid(rest,color,thickness,0))};
          layered(data.grass,s.turf==='natural'?'#94a470':'#788e59',.05);data.tiles.forEach(t=>layered(t.polygon,s.concreteColor,(zone==='front'?s.thickness:s.backThickness)/12));layered(data.paths,s.concreteColor,(zone==='front'?s.thickness:s.backThickness)/12)
        }
        else es.filter(e=>e.kind==='paving'&&e.zone===zone&&e.action!=='retirar').forEach(e=>group.add(solid(polyFor(e),'#c9c8b9',.15,0)));
      }else es.filter(e=>e.kind==='paving'&&e.zone===zone).forEach(e=>group.add(solid(polyFor(e),props.stage==='demolition'?'#c6a295':zone==='front'?'#bd9e88':'#8b735e',.2,0)));
    }
    es.forEach(e=>{
      if(e.action==='retirar'&&props.stage==='proposed')return;
      let obj=new THREE.Group();
      if(e.kind==='house'){
        obj.add(box(e.x,0,e.z,e.width,13,e.depth,e.color));obj.add(box(e.x+16,13,e.z+8,30,13,e.depth-8,'#dfd4c1'));
        const roof=(x:number,y:number,z:number,w:number,d:number)=>{
          const g=new THREE.BufferGeometry();const ridge=Math.min(w*.3,d*.4),verts=[x,y,z,x+w,y,z,x+w,y,z+d,x,y,z+d,x+ridge,y+5,z+d/2,x+w-ridge,y+5,z+d/2];g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex([0,4,1,1,4,5,1,5,2,2,5,3,3,5,4,3,4,0]);g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#a76e50',roughness:1,side:THREE.DoubleSide}));m.castShadow=true;obj.add(m);
        };roof(e.x-1,13.1,e.z-1,e.width+2,e.depth+2);roof(e.x+15,26.1,e.z+7,32,e.depth-6);
        for(const x of [e.x+10,e.x+44]){obj.add(box(x,3,e.z-.12,10,7,.2,'#607e7a'));for(let n=0;n<4;n++)obj.add(box(x+n*2.5,3,e.z-.26,.16,7,.2,'#f1ecdf'));obj.add(box(x,6,e.z-.26,10,.16,.2,'#f1ecdf'))}
        obj.add(box(e.x+28,0,e.z-.14,4,10,.25,'#5c574a'));
        obj.add(box(e.x-2,9,e.z-8,17,1,14,'#79654d'));obj.add(box(e.x+e.width-15,9,e.z-7,17,1,12,'#79654d'));
        for(const x of [e.x-1,e.x+e.width+1])obj.add(box(x,0,e.z-7,.6,9,.6,'#79654d'));
        obj.scale.y=e.height/26;obj.position.y=e.elevation;
      }else if(e.kind==='palm'){
        const x=e.x+e.width/2,z=e.z+e.depth/2;const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.35,.7,e.height,9),new THREE.MeshStandardMaterial({color:'#a48c6a'}));trunk.position.set(x,e.height/2,z);trunk.castShadow=true;obj.add(trunk);
        if(e.id!=='palm-remove'&&e.action!=='retirar')for(let i=0;i<10;i++){
          const a=i/10*Math.PI*2;const points=[new THREE.Vector3(x,e.height,z),new THREE.Vector3(x+Math.cos(a)*3,e.height+1,z+Math.sin(a)*3),new THREE.Vector3(x+Math.cos(a)*6,e.height-2.5,z+Math.sin(a)*6)];
          const leaf=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),8,.35,3,false),new THREE.MeshStandardMaterial({color:i%2?'#657c46':'#7d915b',roughness:1}));leaf.castShadow=true;obj.add(leaf);
        }obj.position.y=e.elevation;
      }else if(e.kind==='pool'){
        obj.add(solid(polyFor(e),'#b1c8c0',.1,e.elevation));obj.add(box(e.x+.35,e.elevation+.12,e.z+.35,e.width-.7,.06,e.depth-.7,'#71b7bc'));
      }else if(e.kind==='garden'){
        obj.add(solid(polyFor(e),'#9a9b7c',.2,e.elevation));
        for(let i=0;i<7;i++){const x=e.x+e.width*.5+Math.cos(i*2.4)*e.width*.3,z=e.z+e.depth*.5+Math.sin(i*2.4)*e.depth*.3;const bush=new THREE.Mesh(new THREE.SphereGeometry(Math.min(e.width,e.depth)/4,12,8),new THREE.MeshStandardMaterial({color:i%2?'#718254':'#879264'}));bush.scale.y=.7;bush.position.set(x,.9+e.elevation,z);bush.castShadow=true;obj.add(bush)}
      }else if(e.kind==='furniture'){
        obj.add(solid(polyFor(e),e.color,.2,e.height+e.elevation));for(const [x,z] of [[e.x+.3,e.z+.3],[e.x+e.width-.5,e.z+e.depth-.5]])obj.add(box(x,e.elevation,z,.15,e.height,.15,'#77796d'));
      }else if(e.kind==='stairs'){
        for(let i=0;i<4;i++)obj.add(box(e.x,e.elevation,e.z+i*e.depth/4,e.width,e.height*(i+1)/4,e.depth/4,e.color));
      }else if(e.kind==='dock')obj.add(solid(polyFor(e),e.color,.4,e.elevation));
      else if(e.kind==='paving'||e.kind==='path'){
        // Transparent picking surface makes the region selectable without hiding its grid.
        obj=solid(polyFor(e),'#ffffff',.02,-.04);obj.traverse(o=>{const mesh=o as THREE.Mesh;if(mesh.material){(mesh.material as THREE.MeshStandardMaterial).transparent=true;(mesh.material as THREE.MeshStandardMaterial).opacity=0}});
      }
      obj.userData.elementId=e.id;
      if(e.id===props.selected){const helper=new THREE.BoxHelper(obj,'#315e49');helper.userData.ignore=true;group.add(helper)}
      group.add(obj);
    });
  },[props.proposal,props.data,props.selected,props.stage,props.existing,props.zone]);
  return <div className="scene-wrap" ref={host}>{error&&<div className="scene-error">No se pudo iniciar el modelo 3D en este navegador. La vista Plano y los cálculos siguen disponibles.</div>}<div className="scene-tip">Arrastra para girar · rueda para acercar · herramienta Mover para desplazar elementos</div><div className="scene-caption">MODELO DE ESTUDIO <span>Casa y alturas aproximadas</span></div></div>
}
