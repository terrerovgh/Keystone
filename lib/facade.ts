/** Photo-based visual components. Feet internally; editable in feet or millimetres.
 * These surfaces are separate from the surveyed footprint / paving quantities. */
export type FacadeKind='volume'|'gable'|'hip'|'window'|'bay'|'portal'|'canopy'|'oculus'|'gate'|'trim'|'vent'|'pipe';
export type FacadeZone='left'|'center'|'entry'|'right'|'side';
export interface FacadePart {
 id:string;name:string;zone:FacadeZone;kind:FacadeKind;
 x:number;y:number;z:number;width:number;height:number;depth:number;rotation:number;
 color:string;visible:boolean;source:'Estimada'|'Comprobada';note:string;
 rise:number;columns:number;rows:number;arch:'rect'|'arch'|'fan';posts:number;slope:number;
}
export interface FacadeModel {edition?:2;version:1;parts:FacadePart[];wallColor:string;trimColor:string;roofColor:string;roofDetail:boolean}
export const facadeZoneNames:Record<FacadeZone,string>={left:'Ala izquierda',center:'Centro',entry:'Entrada y torre',right:'Ala derecha',side:'Pasillo lateral'};
export const facadeKindNames:Record<FacadeKind,string>={volume:'Cuerpo de la casa',gable:'Techo a dos aguas',hip:'Techo de teja',window:'Ventana',bay:'Ventanal saliente',portal:'Portal y puerta',canopy:'Cubierta de estacionamiento',oculus:'Ventana circular',gate:'Puerta de barrotes',trim:'Moldura',vent:'Respiradero',pipe:'Bajante'};
export const facadeReferences=[
 {path:'/references/fachada-derecha-propietario.png',label:'Ala derecha · cubierta y pasillo'},
 {path:'/references/fachada-centro-propietario.png',label:'Centro · puerta y ventanas'},
 {path:'/references/fachada-izquierda-propietario.png',label:'Ala izquierda · cubierta del auto'},
 {path:'/photos/acceso.jpg',label:'Foto del propietario · acceso'},
 {path:'/photos/frente.jpg',label:'Foto del propietario · frente'},
 {path:'/references/listing/frente-publicado.png',label:'Foto pública · frente, miradores y acceso'},
];
function part(id:string,name:string,zone:FacadeZone,kind:FacadeKind,x:number,y:number,z:number,width:number,height:number,depth:number,extra:Partial<FacadePart>={}):FacadePart{return {id,name,zone,kind,x,y,z,width,height,depth,rotation:0,color:['window','bay','oculus'].includes(kind)?'#526c66':['gable','hip'].includes(kind)?'#b96b48':'#ddd0ba',visible:true,source:'Estimada',note:'Proporción visual de fotografías. Posición, espesor y medidas pendientes de comprobación en la casa.',rise:0,columns:3,rows:3,arch:'rect',posts:0,slope:1,...extra}}
export function createPreviousFacade():FacadeModel{return {version:1,wallColor:'#d8cfbc',trimColor:'#eeeade',roofColor:'#b96b48',roofDetail:true,parts:[
 part('left-upper','Cuerpo alto retrasado','left','volume',9.33,11.15,28.8,14.32,8.9,31.76,{color:'#e5ddcd'}),
 part('left-roof','Techo alto del ala izquierda','left','gable',8.72,20.1,28.18,15.5,.32,32.98,{rise:5.65}),
 part('left-arch','Ventanal alto con arco','left','window',12.3,11.25,28.67,8.15,8.15,.35,{arch:'arch',columns:2,rows:2}),
 part('left-low','Ventana bajo cubierta del auto','left','window',11.55,2.65,28.6,9.35,5.9,.4,{columns:3,rows:3}),
 part('car-canopy','Cubierta del auto · madera y panel','left','canopy',8.75,9.25,13.2,15.25,.28,15.55,{color:'#c3c6b9',posts:1,slope:2.2,note:'Cubierta fina con caída, perímetro de madera y apoyo delantero izquierdo visible. Los apoyos ocultos son configurables.'}),
 part('central-upper','Cuerpo central adelantado','center','volume',23.6,11.15,17.85,26.2,10.85,33,{color:'#e8dfcf'}),
 part('central-roof','Techo principal adelantado','center','gable',22.9,22.25,17.18,27.6,.32,34.65,{rise:7.4}),
 part('central-fan','Fanal semicircular superior','center','window',32.5,17.9,17.68,7.6,3.8,.32,{arch:'fan',columns:1,rows:1}),
 part('central-bay','Mirador central · tres caras','center','bay',29.95,2.8,17.66,12.7,6.05,1.18,{columns:4,rows:4}),
 part('central-bay-roof','Tejadillo sobre mirador','center','hip',23.2,10.6,15.78,26.55,.25,3.15,{rise:1.4}),
 part('central-left-light','Luz junto al mirador · izquierda','center','vent',24.7,5.3,17.58,.5,2.1,.13,{color:'#877a62'}),
 part('central-right-light','Luz junto al mirador · derecha','center','vent',46.9,5.3,17.56,.5,2.1,.13,{color:'#877a62'}),
 part('tower','Torre sobre el portal','entry','volume',49.8,10.85,22.08,6.6,10.45,17,{color:'#a99e86'}),
 part('tower-roof','Techo y cornisa de la torre','entry','hip',49.05,21.65,21.4,8.1,.3,18.2,{rise:2.5}),
 part('tower-circle','Óculo alto de la torre','entry','oculus',51.7,15.2,21.97,2.65,2.65,.25,{color:'#314341'}),
 part('tower-vent','Respiradero del retorno de la torre','entry','vent',56.48,18.35,25,3.9,.65,.2,{rotation:-90,color:'#514737'}),
 part('entrance','Portal arqueado y puerta retirada','entry','portal',49.98,1.2,22.03,6.18,9.45,2.55,{color:'#938872',rise:2.6,note:'Arco de mampostería con puerta negra rectangular al fondo. Tres escalones existentes; medir ancho, profundidad y altura.'}),
 part('right-front-roof','Techo bajo del ala derecha','right','hip',55.75,10.8,13.95,18.65,.3,16.7,{rise:3.45}),
 part('right-inner-window','Ventana frontal bajo cubierta del carrito','right','window',58,2.85,14.4,5.95,5.8,.35,{columns:3,rows:3}),
 part('right-bay','Mirador del extremo derecho','right','bay',66,2.85,14.43,5.9,5.8,.9,{columns:3,rows:3}),
 part('cart-canopy','Cubierta del carrito · vigas rojizas','right','canopy',54.2,9.25,6.05,10.75,.24,8.4,{color:'#b9c1b8',posts:0,slope:1.5,note:'Cubierta pequeña situada bajo el alero. Apoyos no visibles en todas las fotos: activar cada poste solo después de comprobarlo.'}),
 part('cart-circle','Óculo bajo del retorno interior','right','oculus',56.23,6.25,20.9,2.05,2.05,.22,{rotation:90,note:'Visible sobre el carrito en acceso.jpg. Ubicación sobre retorno interior inferida: confirmar en sitio.'}),
 part('right-upper','Cuerpo superior retrasado','right','volume',49.8,11.15,34.2,24,10.6,19.3,{color:'#e7d7c7'}),
 part('right-upper-roof','Techo alto posterior derecho','right','hip',49.15,22.08,33.55,25.25,.3,20.6,{rise:4.65}),
 part('right-upper-window','Ventana pequeña superior','right','window',65.65,16.2,34.05,2.4,3.2,.22,{columns:1,rows:2}),
 part('right-side-upper','Ventana alta del lateral','side','window',73.94,15.1,38,3,3.7,.25,{rotation:-90,columns:2,rows:2}),
 part('side-window-one','Ventana lateral 01','side','window',73.94,2.8,39.5,7,6,.3,{rotation:-90,columns:3,rows:3}),
 part('side-window-two','Ventana lateral 02','side','window',73.94,2.8,55,7,6,.3,{rotation:-90,columns:3,rows:3}),
 part('side-gate','Puerta blanca del pasillo lateral','side','gate',74.05,.18,23.3,4.45,6.4,.18,{color:'#eeeee6',columns:7,rows:5,note:'Puerta y barrotes visibles en el lateral derecho. Medidas y posición del cierre pendientes.'}),
 part('left-gutter','Bajante izquierda','left','pipe',9.36,.4,28.48,.18,19.4,.22,{color:'#c7c6b7'}),
 part('right-gutter','Bajante del ala derecha','side','pipe',73.36,.2,14.4,.18,10.5,.22,{color:'#dbdbcd'}),
 part('right-belt','Banda blanca del ala derecha','right','trim',56.4,2.3,14.36,17,.16,.14,{color:'#eeeadc'}),
 ]}}
export const FRONT_CENTER=(9.33+73.833)/2;
const centeredChanges:Record<string,Partial<FacadePart>>={
 'central-upper':{width:14.38,height:10.35,color:'#d8c9b7'},
 'central-roof':{width:16.0,y:21.8,rise:6.0},
 'central-fan':{x:27.4,y:17.6,width:6.9,height:3.45},
 'central-bay':{x:25.9,width:9.5},
 'central-bay-roof':{width:15.2},
 'central-right-light':{x:36.4},
 'tower':{x:FRONT_CENTER-3.3,z:19.85,color:'#998c70'},
 'tower-roof':{x:FRONT_CENTER-4.05,z:19.17},
 'tower-circle':{x:FRONT_CENTER-1.325,z:19.74},
 'tower-vent':{x:FRONT_CENTER+3.38,z:23},
 'entrance':{x:FRONT_CENTER-3.09,z:19.8,note:'Puerta en el centro de la fachada, según corrección del propietario. Ancho, altura y retranqueo continúan estimados.'},
 'right-front-roof':{x:44.25,width:30.2,depth:16.7},
 'right-inner-window':{x:48.5,width:6.3},
 'right-bay':{x:64.5,width:6.7},
 'cart-canopy':{x:45.35,width:11.1},
 'cart-circle':{x:45.08,z:20.9},
 'right-upper':{x:45.1,width:28.7,color:'#dbc9b9'},
 'right-upper-roof':{x:44.45,width:30},
 'right-belt':{x:44.9,width:28.9},
};
export function createFacade():FacadeModel{
 const m=createPreviousFacade();m.edition=2;m.wallColor='#c8bba5';m.trimColor='#e9e3d6';
 m.parts.forEach(p=>Object.assign(p,centeredChanges[p.id]??{}));
 m.parts.push(part('right-front-body','Cuerpo bajo del ala derecha','right','volume',44.9,0,14.565,28.933,11.15,15.4,{color:m.wallColor}));
 return m;
}
/** Apply the corrected reference without overwriting individual user adjustments or writing to the cloud on view. */
export function resolveFacade(input?:FacadeModel):FacadeModel{
 if(!input)return createFacade();if(input.edition===2)return input;
 const old=createPreviousFacade(),next=structuredClone(input);next.edition=2;
 for(const p of next.parts){const original=old.parts.find(v=>v.id===p.id),changes=centeredChanges[p.id];if(!original||!changes)continue;for(const [key,value] of Object.entries(changes)){const a=(p as any)[key],b=(original as any)[key];if(a===b||typeof a==='number'&&typeof b==='number'&&Math.abs(a-b)<1e-5)(p as any)[key]=value}}
 for(const p of next.parts.filter(p=>['entrance','tower','tower-circle','tower-roof'].includes(p.id)))p.x=FRONT_CENTER-p.width/2;
 if(next.wallColor===old.wallColor)next.wallColor='#c8bba5';if(next.trimColor===old.trimColor)next.trimColor='#e9e3d6';
 if(!next.parts.some(p=>p.id==='right-front-body'))next.parts.push(createFacade().parts.find(p=>p.id==='right-front-body')!);
 return next;
}
export function validFacade(raw:unknown):raw is FacadeModel{
 if(!raw||typeof raw!=='object')return false;const m=raw as FacadeModel,hex=(s:unknown)=>typeof s==='string'&&/^#[\da-f]{6}$/i.test(s),n=(x:unknown,min:number,max:number)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
 return (m.edition===undefined||m.edition===2)&&m.version===1&&hex(m.wallColor)&&hex(m.trimColor)&&hex(m.roofColor)&&typeof m.roofDetail==='boolean'&&Array.isArray(m.parts)&&m.parts.length>0&&m.parts.length<=160&&m.parts.every(p=>p&&typeof p.id==='string'&&p.id.length<=120&&typeof p.name==='string'&&p.name.length<=120&&typeof p.note==='string'&&p.note.length<=1000&&Object.hasOwn(facadeKindNames,p.kind)&&Object.hasOwn(facadeZoneNames,p.zone)&&['Estimada','Comprobada'].includes(p.source)&&['rect','arch','fan'].includes(p.arch)&&typeof p.visible==='boolean'&&hex(p.color)&&n(p.x,-100,200)&&n(p.z,-100,220)&&n(p.y,-10,70)&&n(p.width,.05,100)&&n(p.height,.05,70)&&n(p.depth,.02,120)&&n(p.rotation,-360,360)&&n(p.rise,0,30)&&n(p.columns,1,16)&&Number.isInteger(p.columns)&&n(p.rows,1,16)&&Number.isInteger(p.rows)&&n(p.posts,0,15)&&Number.isInteger(p.posts)&&n(p.slope,-15,15))&&new Set(m.parts.map(p=>p.id)).size===m.parts.length;
}
export function ensureFacade<P extends {facade?:FacadeModel}>(p:P):P{return p.facade?p:{...p,facade:createFacade()}}
