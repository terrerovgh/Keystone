'use client';
import { useRef, useState } from 'react';
import { bounds, mapPoly, pathData, polyFor, rect, rotate, surface, type Surface } from '@/lib/geometry';
import { fmt, type Element, type Point, type Proposal, type Zone } from '@/lib/project';
export type Stage='proposed'|'existing'|'demolition';
export interface ViewProps {
  proposal:Proposal; zone:Zone; stage:Stage; existing:Element[]; data:Surface;
  selected:string|null; onSelect:(id:string|null)=>void; onChange:(id:string,patch:Partial<Element>)=>void;
  tool:'select'|'move'|'vertices'|'tile'|'pan'; dimensions:boolean; onTile:(id:string)=>void;
}
export default function PlanView({proposal,zone,stage,existing,data,selected,onSelect,onChange,tool,dimensions,onTile}:ViewProps){
  const svg=useRef<SVGSVGElement>(null),[zoom,setZoom]=useState(1),[pan,setPan]=useState<Point>([0,0]);
  const drag=useRef<{id:string;start:Point;original:Element;vertex?:number;pan?:Point;last?:Point}|null>(null);
  const es=stage==='proposed'?proposal.elements:existing;
  const view=zone==='front'?{x:-6,y:-49,w:87,h:56}:{x:-6,y:-128,w:87,h:55};
  const bw=view.w/zoom,bh=view.h/zoom,vx=view.x+(view.w-bw)/2+pan[0],vy=view.y+(view.h-bh)/2+pan[1];
  const point=(event:React.PointerEvent):Point=>{const p=svg.current!.createSVGPoint();p.x=event.clientX;p.y=event.clientY;const q=p.matrixTransform(svg.current!.getScreenCTM()!.inverse());return [q.x,-q.y]};
  const start=(event:React.PointerEvent,e:Element,vertex?:number)=>{
    if(stage!=='proposed')return;event.stopPropagation();onSelect(e.id);
    if((e.locked&&vertex===undefined)||tool==='tile')return;
    if(tool==='move'||tool==='vertices'||vertex!==undefined){event.currentTarget.setPointerCapture(event.pointerId);drag.current={id:e.id,start:point(event),original:structuredClone(e),vertex};}
  };
  const move=(event:React.PointerEvent)=>{
    const d=drag.current;if(!d)return;const p=point(event);const snap=(n:number)=>event.shiftKey?n:Math.round(n*4)/4;
    if(d.pan){setPan([d.pan[0]-(p[0]-d.start[0]),d.pan[1]+(p[1]-d.start[1])]);return;}
    d.last=p;
    // Preview geometry is updated in the SVG only; one undo step is committed on release.
    if(d.vertex===undefined){const g=svg.current?.querySelector(`[data-element="${d.id}"]`);g?.setAttribute('transform',`translate(${snap(p[0]-d.start[0])} ${snap(p[1]-d.start[1])})`)}
    else {const handle=svg.current?.querySelector(`[data-vertex="${d.vertex}"]`);handle?.setAttribute('cx',String(p[0]));handle?.setAttribute('cy',String(p[1]));}
  };
  const end=()=>{const d=drag.current;drag.current=null;if(!d||!d.last||d.pan)return;const dx=d.last[0]-d.start[0],dz=d.last[1]-d.start[1];const snap=(n:number)=>Math.round(n*4)/4;
    svg.current?.querySelector(`[data-element="${d.id}"]`)?.removeAttribute('transform');
    if(d.vertex!==undefined&&d.original.points){const delta=rotate([dx,dz],-d.original.rotation);const pts=structuredClone(d.original.points);pts[d.vertex]=[snap(pts[d.vertex][0]+delta[0]),snap(pts[d.vertex][1]+delta[1])];onChange(d.id,{points:pts});}
    else if(Math.abs(dx)+Math.abs(dz)>0.03)onChange(d.id,{x:snap(d.original.x+dx),z:snap(d.original.z+dz)});
  };
  const sel=es.find(e=>e.id===selected),sb=sel?bounds(polyFor(sel)):null;
  const localSurface=stage==='proposed'?data:surface({...proposal,elements:existing,exceptions:{}},zone);
  return <div className={`plan-wrap tool-${tool}`}>
    <svg ref={svg} className="plan-canvas" viewBox={`${vx} ${vy} ${bw} ${bh}`} role="img" aria-label={`Plano editable del ${zone==='front'?'frente':'patio'}`}
      onPointerMove={move} onPointerUp={end} onPointerCancel={()=>{drag.current=null}}
      onPointerDown={event=>{if(tool==='pan'){event.currentTarget.setPointerCapture(event.pointerId);drag.current={id:'',start:point(event),original:es[0],pan:[...pan]};}else onSelect(null)}}
      onWheel={event=>{setZoom(z=>Math.max(0.6,Math.min(4,z*(event.deltaY<0?1.12:0.9))))}}>
      <defs><pattern id="dots" patternUnits="userSpaceOnUse" width="2" height="2"><circle cx="0" cy="0" r="0.055" fill="#b7bab0"/></pattern></defs>
      <rect x={vx} y={vy} width={bw} height={bh} fill="#f2f3ed"/><rect x={vx} y={vy} width={bw} height={bh} fill="url(#dots)"/>
      <g transform="scale(1,-1)">
        <rect x="0" y="0" width="75" height="125" fill="#c0cba9" stroke="#819071" strokeDasharray="0.5 0.5" strokeWidth=".12"/>
        <rect x="-20" y="-10" width="115" height="8" fill="#d4d4cd"/>
        <rect x="-20" y="5" width="115" height="3" fill="#e5e4dc" stroke="#c8c9c0" strokeWidth=".1"/>
        <rect x="-20" y="125" width="115" height="20" fill="#b0ceca"/>
        {stage==='proposed'?<>
          <path d={pathData(data.grass)} fill={proposal.settings.turf==='natural'?'#91a36e':'#758b58'} fillRule="evenodd"/>
          <path d={pathData(data.paths)} fill={proposal.settings.concreteColor} fillRule="evenodd" stroke="#b9b8ad" strokeWidth=".08"/>
          {data.tiles.map(t=><path key={t.id} d={pathData(t.polygon)} fill={proposal.settings.concreteColor} fillRule="evenodd" stroke="#b9b8ad" strokeWidth=".06"
            className={tool==='tile'?'tile-hit':''} onPointerDown={event=>{if(tool==='tile'){event.stopPropagation();onTile(t.id)}}}/>)}
          {Object.keys(proposal.exceptions).filter(id=>id.startsWith(zone+':')).map(id=>{const [,c,r]=id.split(':').map(Number);const s=proposal.settings,p=s.tile+s.gap;const polygon=mapPoly(rect(c*p,r*p,s.tile,s.tile),q=>{const v=rotate(q,s.angle);return [v[0]+s.gridX,v[1]+s.gridZ]});return <path key={id} d={pathData(polygon)} fill="transparent" stroke="#a4ae90" strokeDasharray=".2 .2" strokeWidth=".1" onPointerDown={e=>{if(tool==='tile'){e.stopPropagation();onTile(id)}}}/>})}
        </>:<path d={pathData(localSurface.net)} fill={stage==='demolition'?'#d8bcb0':zone==='front'?'#c7a994':'#a28b73'} stroke="#b29a86" strokeWidth=".1" fillRule="evenodd"/>}
        {es.filter(e=>e.zone===zone||e.kind==='house').map(e=>{
          if(e.action==='retirar'&&stage==='proposed')return null;
          if(e.kind==='paving'||e.kind==='path')return <path key={e.id} data-element={e.id} d={pathData(polyFor(e))} fill="transparent" stroke={e.id===selected?'#3a624e':'transparent'} strokeWidth=".2" onPointerDown={ev=>{if(tool!=='tile')start(ev,e)}} style={{pointerEvents:tool==='tile'?'none':'visiblePainted'}}/>;
          return <g key={e.id} data-element={e.id} onPointerDown={ev=>start(ev,e)} className={e.locked?'locked-element':'editable-element'}>
            {e.kind==='palm'?<g><circle cx={e.x+e.width/2} cy={e.z+e.depth/2} r="3.5" fill={e.action==='retirar'?'#b77665':'#789166'} fillOpacity=".22"/>{Array.from({length:9},(_,i)=>{const a=i/9*Math.PI*2;const x=e.x+e.width/2,z=e.z+e.depth/2;return <path key={i} d={`M${x},${z}q${Math.cos(a+.3)*2},${Math.sin(a+.3)*2} ${Math.cos(a)*4},${Math.sin(a)*4}`} fill="none" stroke={e.action==='retirar'?'#a36c5c':'#486442'} strokeWidth=".3"/>})}<circle cx={e.x+e.width/2} cy={e.z+e.depth/2} r=".4" fill="#9a8060"/></g>:
              <path d={pathData(polyFor(e))} fill={e.kind==='pool'?'#8abfc0':e.color} fillRule="evenodd" stroke={e.id===selected?'#315941':e.kind==='garden'?'#718460':'#a59f91'} strokeWidth={e.id===selected?.24:.12}/>}
            {e.kind==='house'&&<><path d={`M${e.x},${e.z}l9,8h${e.width-18}l9,-8 M${e.x+9},${e.z+8}v${e.depth-16} M${e.x+e.width-9},${e.z+8}v${e.depth-16}`} fill="none" stroke="#b5a694" strokeWidth=".15"/><rect x={e.x+25} y={e.z} width="12" height="4" fill="#cbbba3"/></>}
            {e.kind==='pool'&&<path d={`M${e.x+.6},${e.z+.6}h${e.width-1.2}v${e.depth-1.2}h-${e.width-1.2}Z`} fill="none" stroke="#bde0da" strokeWidth=".2"/>}
            {e.kind==='stairs'&&Array.from({length:4},(_,i)=><path key={i} d={`M${e.x},${e.z+i*e.depth/4}h${e.width}`} stroke="#90755e" strokeWidth=".12"/>)}
          </g>
        })}
        {sel&&sb&&stage==='proposed'&&<g pointerEvents="none"><rect x={sb.x-.5} y={sb.z-.5} width={sb.maxX-sb.x+1} height={sb.maxZ-sb.z+1} fill="none" stroke="#315e49" strokeWidth=".18" strokeDasharray=".4 .25"/></g>}
        {stage==='demolition'&&es.filter(e=>e.zone===zone&&e.kind==='palm').map(e=>{const future=proposal.elements.find(f=>f.id===e.id);const x=e.x+e.width/2,z=e.z+e.depth/2;return future?.action==='retirar'?<path key={e.id} d={`M${x-2},${z-2}l4,4M${x+2},${z-2}l-4,4`} stroke="#b26851" strokeWidth=".35"/>:future?.action==='trasladar'?<g key={e.id} stroke="#ad7157" strokeWidth=".18"><path d={`M${x},${z}L${future.x+future.width/2},${future.z+future.depth/2}`} strokeDasharray=".5 .3"/><circle cx={future.x+future.width/2} cy={future.z+future.depth/2} r="1.2" fill="none"/></g>:null})}
        {sel&&tool==='vertices'&&!sel.locked&&sel.shape==='polygon'&&sel.points?.map((p,i)=>{const q=rotate([p[0]-sel.width/2,p[1]-sel.depth/2],sel.rotation);return <circle key={i} data-vertex={i} cx={sel.x+sel.width/2+q[0]} cy={sel.z+sel.depth/2+q[1]} r=".45" fill="#fff" stroke="#315e49" strokeWidth=".2" onPointerDown={ev=>start(ev,sel,i)}/>})}
      </g>
      {dimensions&&<g fontFamily="Arial,sans-serif" fontSize=".95" fill="#65705d">
        <text x="37.5" y={zone==='front'?-40:-125} textAnchor="middle" letterSpacing=".2">{zone==='front'?'CASA EXISTENTE':'CANAL · MUELLE CONSERVADO'}</text>
        {zone==='front'&&<text x="37.5" y="4.5" textAnchor="middle" letterSpacing=".2">KEYSTONE BOULEVARD</text>}
        {es.filter(e=>e.zone===zone&&['pool','paving','garden','path'].includes(e.kind)&&e.action!=='retirar').map(e=><text key={e.id} x={e.x+e.width/2} y={-(e.z+e.depth/2)} textAnchor="middle" fill="#4b5747" fontSize={e.kind==='path'?.7:.85} pointerEvents="none">{e.kind==='paving'?`${fmt(e.width)}′ × ${fmt(e.depth)}′*`:e.kind==='pool'?`Piscina · ${fmt(e.width)}′ × ${fmt(e.depth)}′*`:e.kind==='path'?`${fmt(e.width)}′*`:''}</text>)}
        {sel&&sb&&<><path d={`M${sb.x},${-sb.z+2}H${sb.maxX}M${sb.x},${-sb.z+1.4}v1.2M${sb.maxX},${-sb.z+1.4}v1.2`} stroke="#315e49" strokeWidth=".1"/><text x={(sb.x+sb.maxX)/2} y={-sb.z+3.5} textAnchor="middle">{fmt(sb.maxX-sb.x)}′ · {sel.source}</text></>}
      </g>}
    </svg>
    <div className="plan-navigation"><button title="Acercar" onClick={()=>setZoom(z=>Math.min(4,z*1.2))}>+</button><button title="Alejar" onClick={()=>setZoom(z=>Math.max(.6,z/1.2))}>−</button><button title="Centrar plano" onClick={()=>{setZoom(1);setPan([0,0])}}>⌖</button></div>
    <div className="canvas-scale"><span style={{width:50}}/> 0 ─ 10 ft <small>* Medidas preliminares · marco visual sin linderos verificados</small></div>
  </div>
}
