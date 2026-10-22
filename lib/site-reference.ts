import geo from '../public/references/site-geometry.json';
import type { Element, Point, Project, Proposal } from './project';
export const SITE={...geo,parcel:geo.parcelLocal as Point[],building:geo.buildingLocal as Point[],date:'2026-10-22',parcelUrl:'https://gisweb.miamidade.gov/arcgis/rest/services/MD_NSPApp/MapServer/1',buildingUrl:'https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/ArcGIS/rest/services/BuildingFootprint2D_gdb/FeatureServer/0',aerialUrl:'https://gisweb.miamidade.gov/arcgis/rest/services/MapCache/MDCImagery/MapServer',appleUrl:'https://maps.apple.com/?address=2331+Keystone+Blvd,+North+Miami,+FL+33181&ll=25.893525,-80.150526&q=2331+Keystone+Blvd',mapsUrl:'https://www.google.com/maps/search/?api=1&query=2331+Keystone+Blvd+North+Miami+FL',streetUrl:'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=25.89330,-80.15052&heading=292&pitch=0',lotListingArea:9375};
export function referenceFrame(proposal:Proposal){return proposal.referenceEdition===2?{width:82.444,depth:117.424,street:-16,sidewalk:-7,shore:116,parcel:SITE.parcel}:{width:75,depth:125,street:-2,sidewalk:5,shore:125,parcel:[[0,0],[75,0],[75,125],[0,125],[0,0]] as Point[]}}
function element(id:string,name:string,kind:Element['kind'],zone:Element['zone'],x:number,z:number,width:number,depth:number,extra:Partial<Element>={}):Element{return {id,name,kind,zone,x,z,width,depth,height:kind==='palm'?24:.15,elevation:0,rotation:0,shape:'rect',color:'#8c9c74',locked:false,action:'nuevo',source:'Estimada',support:'terreno',note:'Posición de estudio trazada sobre ortofoto; medir en sitio.',...extra}}
function contour(id:string,name:string,kind:Element['kind'],zone:Element['zone'],world:Point[],extra:Partial<Element>={}):Element{const x=Math.min(...world.map(p=>p[0])),z=Math.min(...world.map(p=>p[1])),width=Math.max(...world.map(p=>p[0]))-x,depth=Math.max(...world.map(p=>p[1]))-z;return element(id,name,kind,zone,x,z,width,depth,{shape:'polygon',points:world.map(p=>[p[0]-x,p[1]-z]),...extra})}
export function referenceElements():Element[]{
  const current=[
    contour('house','Casa · huella GIS 2015','house','front',SITE.building.slice(0,-1),{height:30,locked:true,action:'conservar',source:'Referencia GIS',color:'#ded0b8',note:'Huella pública derivada de LiDAR, actualización 2015. Alturas, ventanas y cubiertas interpretadas de fotos; no verificadas.'}),
    contour('front-floor','Entrada y medialuna','paving','front',[[8.5,-2],[76,-2],[76,14.6],[56.4,14.6],[56.4,22.1],[49.8,22.1],[49.8,17.7],[23.6,17.8],[23.65,28.7],[9.3,28.8]],{source:'Estimada',note:'Contorno trazado combinando ortofoto con la huella GIS y el croquis. No constituye medida de campo.'}),
    contour('entry-left','Acceso izquierdo · transición pública','paving','front',[[8.5,0],[22.8,0],[22.8,-10],[27,-16],[3,-16],[8.5,-10]],{note:'Apertura y radios aproximados. Revisar con North Miami antes de modificar la conexión a calle.'}),
    contour('entry-right','Acceso derecho · transición pública','paving','front',[[62,-0.5],[76,-0.5],[76,-10],[81,-16],[57,-16],[62,-10]],{note:'Transición pública estimada. Acera conservada descontada del pavimento nuevo.'}),
    element('sidewalk','Acera pública conservada','fixed','front',-5,-7,95,3.5,{locked:true,action:'conservar',color:'#cbc9be',note:'Ubicación estimada en ortofoto. Mantener continuidad; comprobar cotas y espesor en visita.'}),
    contour('old-center','Jardinera central existente','garden','front',[[26,-2],[58,-2],...Array.from({length:31},(_,i)=>{const x=58-i*32/30;return [x,-2+11*Math.sqrt(Math.max(0,1-((x-42)/16)**2))] as Point})],{action:'conservar'}),
    element('palm-left','Palma conservada · izquierda','palm','front',35,3,1.8,1.8,{action:'conservar',height:25}),
    element('palm-right','Palma conservada · derecha','palm','front',49,4,2,2,{action:'conservar',height:26}),
    element('palm-remove','Palma sin hojas','palm','front',28,3,1.5,1.5,{action:'conservar',height:24}),
    element('side-garden-left','Jardinera lateral izquierda','garden','front',1,0,6,29,{action:'conservar'}),
    element('side-garden-right','Jardinera lateral derecha','garden','front',76,0,4,36,{action:'conservar'}),
    contour('back-floor','Patio y contorno de piscina','paving','back',[[4,76],[33.8,76],[33.8,65.5],[55.2,65.5],[55.4,85.5],[77,85.5],[77,113],[4,113]],{support:'por verificar',note:'Trazado sobre ortofoto. No se ha comprobado qué parte de la madera está sobre terreno y qué parte está elevada.'}),
    element('pool','Piscina existente','pool','back',8.5,79.5,13,26,{locked:true,action:'conservar',height:4.5,color:'#75b5bd',note:'13 × 26 ft estimados sobre fotos/ortofoto. Medir vaso, borde, profundidad y cotas antes de cerrar el diseño.'}),
    element('back-garden','Jardinera junto a piscina','garden','back',3,77,3.5,34,{action:'conservar'}),
    element('back-garden-right','Jardinera del canal','garden','back',61,109,16,4,{action:'conservar'}),
    element('steps','Escalones y acceso de casa','stairs','back',35.5,67.3,14,5,{locked:true,action:'conservar',height:1.5,elevation:.1,color:'#b28c70',support:'elevado'}),
    element('dock','Muelle longitudinal conservado','dock','back',1,113,77,5,{locked:true,action:'conservar',color:'#8d7864',support:'elevado',note:'Longitud visual aproximada sobre ortofoto; verificar borde del canal y estructura existente.'}),
    element('dock-projection','Saliente del muelle · por confirmar','dock','back',32,118,15,5,{locked:true,action:'conservar',source:'Croquis',support:'elevado',color:'#8d7864',note:'15 × 5 ft del croquis: ubicación e identificación pendientes de comprobación.'}),
    element('table','Mesa y sillas exteriores','furniture','back',43,94,9,4,{action:'conservar',height:3,style:'dining',color:'#77776c'}),
    element('chair-1','Tumbona 01','furniture','back',25,90,2.5,6,{action:'conservar',height:1.25,style:'lounger',color:'#e4dfd4'}),
    element('chair-2','Tumbona 02','furniture','back',29,90,2.5,6,{action:'conservar',height:1.25,style:'lounger',color:'#e4dfd4'}),
    element('outdoor-kitchen','Cocina y barbacoa existentes','furniture','back',64,89,10,3,{action:'conservar',height:3,style:'kitchen',color:'#8e887a'}),
    element('back-palm','Palma del patio · canal','palm','back',58,109,2,2,{action:'conservar',height:27}),
    element('back-palm-left','Palma junto a piscina','palm','back',4,111,2,2,{action:'conservar',height:26}),
  ];
  current.forEach(e=>{if(e.kind==='paving'){e.action='conservar';e.color=e.zone==='front'?'#c3a993':'#8d7965'}});
  return current;
}
export function withReferenceEdition(original:Project,keepPrevious=true):Project{
  if(original.referenceEdition===2)return original;
  const p=structuredClone(original),baseline=referenceElements(),settings={...p.proposals[0].settings,sodPack:500,sodUnit:'pallet' as const,turfUnit:'linear' as const,minTurf:375,infillLb:1.5};
  const curved=structuredClone(baseline).filter(e=>e.id!=='old-center');
  curved.forEach(e=>{if(e.kind==='paving')e.action='nuevo';if(e.id==='palm-remove')e.action='retirar';if(e.id==='palm-left'){e.x=28;e.z=1.2;e.action='trasladar'}if(e.id==='palm-right'){e.x=54;e.z=1.2;e.action='trasladar'}});
  curved.push(
    contour('central-path','Camino central hacia la puerta','path','front',[[40.1,-2],[43.7,-2],[54.9,22.1],[50.5,22.1]],{color:settings.concreteColor,note:'Camino propuesto alineado con el entrante de acceso de la huella GIS. Ancho y llegada a puerta por verificar.'}),
    contour('garden-left','Jardinera central · izquierda','garden','front',[[26,-2],[45,-2],...Array.from({length:21},(_,i)=>{const x=45-i*19/20;return [x,-2+11*Math.sqrt(Math.max(0,1-((x-42)/16)**2))] as Point})]),
    contour('garden-right','Jardinera central · derecha','garden','front',[[46,-2],[58,-2],...Array.from({length:18},(_,i)=>{const x=58-i*12/17;return [x,-2+11*Math.sqrt(Math.max(0,1-((x-42)/16)**2))] as Point})]),
  );
  const straight=structuredClone(curved);straight.filter(e=>e.id==='garden-left'||e.id==='garden-right').forEach(e=>{e.shape='rect';e.width=e.id==='garden-left'?13:11;e.depth=8;e.x=e.id==='garden-left'?27:47;e.z=-2;delete e.points});
  const offset=keepPrevious?p.proposals.length:0;
  const next:Proposal[]=[{id:'reference-curves-v2',referenceEdition:2,name:`${String(offset+1).padStart(2,'0')} · Curvas · base GIS`,description:'Huella pública de la casa, jardines curvos y camino alineado con la entrada.',elements:curved,baseline:structuredClone(baseline),settings:{...settings},exceptions:{}},{id:'reference-lines-v2',referenceEdition:2,name:`${String(offset+2).padStart(2,'0')} · Rectas · base GIS`,description:'La misma base de referencia con jardineras geométricas y camino central.',elements:straight,baseline:structuredClone(baseline),settings:{...settings},exceptions:{}}];
  if(keepPrevious){p.proposals.forEach(v=>{v.baseline??=structuredClone(p.existing)});p.proposals.push(...next)}else p.proposals=next;
  p.existing=baseline;p.activeId=next[0].id;p.referenceEdition=2;p.updatedAt=new Date().toISOString();
  p.measures.push({id:'gis-parcel',label:'Parcela · referencia catastral',value:'82.44 ft frente · 117.45 / 117.04 ft laterales',source:'Referencia GIS',note:'Geometría pública en pies. Área calculada 9,554.9 ft² frente a 9,375 ft² en listados. Resolver con survey; no es lindero verificado.'},{id:'gis-building',label:'Casa · huella pública de referencia',value:'3,437.5 ft² · 16 vértices',source:'Referencia GIS',note:'Huella LiDAR actualizada en 2015. Puede incluir cubiertas y diferir del estado actual. Alturas no disponibles en el registro.'},{id:'gis-imagery',label:'Ortofoto del condado',value:'Mosaico local 2026 · píxel nominal 3 in',source:'Referencia GIS',note:'Fecha exacta de vuelo no disponible. Metadatos generales contienen referencias 2025/2026; la imagen local está identificada como 2026.'});
  return p;
}
export function feetLabel(n:number){const total=Math.round(Math.abs(n)*12);return `${n<0?'−':''}${Math.floor(total/12)}′ ${total%12}″`}
export const siteToPixel=(x:number,z:number):Point=>{const a=SITE.angleFromEastDegrees*Math.PI/180,c=Math.cos(a),s=Math.sin(a),e=SITE.origin2236[0]+x*c-z*s,n=SITE.origin2236[1]+x*s+z*c;return [(e-935370)*5,(568000-n)*5]};
