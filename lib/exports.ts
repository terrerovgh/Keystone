import { edgeDimensions } from './engineering';
import { FRONT_CONTROLS, feetLabel, referenceFrame, SITE } from './site-reference';
import { jsPDF } from 'jspdf';
import { area, demolitionFor, bounds, footprint, intersection, pathData, polyFor, rect, union, visibleFootprint, type MultiPolygon } from './geometry';
import { calculate, stages } from './calculations';
import { baselineFor, fmt, SOURCES, usd, type Project, type Proposal, type Zone } from './project';
const plain=(s:string)=>s.replace(/′/g," ft").replace(/″/g,' in').replace(/[–—]/g,'-').replace(/→/g,' > ').replace(/·/g,' / ').replace(/²/g,'2').replace(/³/g,'3').replace(/…/g,'...').replace(/−/g,'-').replace(/[“”«»]/g,'"');
function safeCell(value:unknown){const s=String(value??'');return '"'+(/^[=+@-]/.test(s)?"'"+s:s).replaceAll('"','""')+'"'}
export function csv(project:Project,proposal:Proposal){
  const c=calculate(project,proposal),rows:unknown[][]=[['All Needs Discount LLC - Keystone Residence'],[project.address],[proposal.name],['Exportado',new Date().toISOString()],['ESTUDIO PRELIMINAR','Cantidades aproximadas. Precios y cantidades pendientes no equivalen a cero.'],['Zona','Partida','Cantidad de compra','Unidad','Precio USD','Importe USD','Estado','Nota','Fuente','Fecha','Referencia']];
  c.lines.forEach(l=>rows.push([l.zone==='front'?'Frente':l.zone==='back'?'Patio':'Compartidos',l.name,l.qty===null?'Pendiente':l.qty.toFixed(4),l.unit,l.rate===null?'Pendiente':l.rate,l.amount===null?'Pendiente':l.amount.toFixed(2),l.amount===null?'Pendiente':'Calculado',l.note,l.source,l.date,l.url??'']));
  rows.push([],['Subtotal con precio',c.subtotal.toFixed(2)],['Gastos / margen',c.overhead.toFixed(2)],['Impuesto estimado',c.tax.toFixed(2)],['Imprevistos',c.contingency.toFixed(2)],['IMPORTE PARCIAL CALCULADO',c.total.toFixed(2)],['Partidas pendientes',c.pending]);
  return '\uFEFF'+rows.map(row=>row.map(safeCell).join(',')).join('\r\n');
}
export function piecesCsv(project:Project,proposal:Proposal){const c=calculate(project,proposal),rows:unknown[][]=[['Zona','Pieza','Tipo','Fila','Columna','Área ft²','Completa','Contorno mundial (ft)']];for(const zone of ['front','back'] as const){const d=c.surfaces[zone];[...d.tiles,...d.pathTiles].forEach((t,i)=>rows.push([zone==='front'?'Frente':'Patio',`${zone==='front'?'F':'P'}${i+1}`,t.id.startsWith('path')?'Camino':'Cuadrícula',t.row,t.col,area(t.polygon).toFixed(4),t.full?'Sí':'Recorte',JSON.stringify(t.polygon)]))}return '\uFEFF'+rows.map(r=>r.map(safeCell).join(',')).join('\r\n')}
export function buildPdf(project:Project,proposal:Proposal):jsPDF {
  const c=calculate(project,proposal),s=proposal.settings,doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a3',compress:true}),W=420,H=297;
  let page=0;
  const text=(str:string,x:number,y:number,size=10,color='#52684d',opts:Record<string,unknown>={})=>{doc.setFont('helvetica','normal');doc.setFontSize(size);doc.setTextColor(color);doc.text(plain(str),x,y,opts)};
  const para=(str:string,x:number,y:number,width:number,size=10,color='#7d8d6d')=>{doc.setFontSize(size);const lines=doc.splitTextToSize(plain(str),width);doc.setTextColor(color);doc.text(lines,x,y);return y+lines.length*size*.39};
  const sheet=(title:string,code:string)=>{if(page++)doc.addPage('a3','landscape');doc.setFillColor('#fafbf5');doc.rect(0,0,W,H,'F');text('ALL NEEDS DISCOUNT LLC',18,16,10,'#314c3d');text('KEYSTONE STUDIO / EXTERIORES',402,16,8,'#8c9c78',{align:'right'});doc.setDrawColor('#d7dfc9');doc.line(18,23,402,23);doc.setFont('times','normal');doc.setFontSize(27);doc.setTextColor('#314c3d');doc.text(plain(title),18,38);text(project.address,18,47,9);text(proposal.name,402,39,11,'#81966a',{align:'right'});text('PRELIMINAR / MEDIDAS POR VERIFICAR',402,47,8,'#ac9567',{align:'right'});doc.setDrawColor('#d7dfc9');doc.line(18,278,402,278);text(`${code} / ${String(page).padStart(2,'0')}`,18,286,8);text('Sin firma profesional ni aprobación municipal. Confirmar medidas, apoyos y requisitos antes de construir.',210,286,8,'#94a581',{align:'center'});text(new Date(project.updatedAt).toLocaleDateString('es-US',{timeZone:'America/New_York'}),402,286,8,'#8a9a76',{align:'right'})};
  const draw=(polys:MultiPolygon,color:string,stroke='#b3bda6',line=.08)=>{
    const ops: {op:string;c:number[]}[]=[];
    polys.forEach(poly=>poly.forEach(r=>{ops.push({op:'m',c:r[0]});r.slice(1).forEach(p=>ops.push({op:'l',c:p}));ops.push({op:'h',c:[]})}));
    if(!ops.length)return;doc.setFillColor(color);doc.setDrawColor(stroke);doc.setLineWidth(line);doc.path(ops).fillStrokeEvenOdd();
  };
  sheet('Emplazamiento general / base de referencia','G-01');
  {const f=referenceFrame(proposal),all=proposal.elements,b=bounds(union(all.filter(e=>e.kind!=='fixed').map(polyFor))),minX=Math.min(-7,b.x-4),maxX=Math.max(f.width+6,b.maxX+4),minZ=Math.min(-22,b.z-4),maxZ=Math.max(f.depth+9,b.maxZ+4),fit=Math.min(270/(maxX-minX),195/(maxZ-minZ)),den=[150,200,250,300,400,500,1000].find(n=>304.8/n<=fit)??2000,sc=304.8/den,left=35-minX*sc,top=65;
    const mapping=(p:MultiPolygon)=>p.map(pg=>pg.map(r=>r.map(([x,z])=>[left+x*sc,top+(maxZ-z)*sc] as [number,number]))),pt=(x:number,z:number)=>[left+x*sc,top+(maxZ-z)*sc] as [number,number];
    draw(mapping([[f.parcel]]),'#d1d9be');for(const z of ['front','back'] as const){draw(mapping(c.surfaces[z].grass),'#859d66');draw(mapping(c.surfaces[z].concrete),s.concreteColor)}
    all.filter(e=>['house','pool','dock','garden','stairs'].includes(e.kind)&&e.action!=='retirar').forEach(e=>{draw(mapping(visibleFootprint(e,all)),e.kind==='house'?'#d8d0ba':e.kind==='pool'?'#89b8bd':e.kind==='garden'?'#9aa77d':e.color);if(['house','pool','dock'].includes(e.kind)){const q=pt(e.x+e.width/2,e.z+e.depth/2);text(e.kind==='house'?'CASA':e.kind==='pool'?'PISCINA':'MUELLE',q[0],q[1],8,'#51634e',{align:'center'})}});
    for(let i=0;i<f.parcel.length-1;i++){const a=pt(...f.parcel[i]),b=pt(...f.parcel[i+1]);doc.setDrawColor('#718162');doc.setLineWidth(.25);doc.line(...a,...b);text(feetLabel(Math.hypot(f.parcel[i+1][0]-f.parcel[i][0],f.parcel[i+1][1]-f.parcel[i][1]))+(proposal.referenceEdition?' GIS':' est.'),(a[0]+b[0])/2+3,(a[1]+b[1])/2+3,7,'#617355')}
    text(`1:${den} / A3 al 100%`,35,268,9);doc.setDrawColor('#536e51');doc.line(35,260,35+10*sc,260);doc.line(35,258,35,262);doc.line(35+10*sc,258,35+10*sc,262);text('10 ft',35+5*sc,257,7,'#617355',{align:'center'});
    const nx=278,ny=87;doc.setDrawColor('#4d674c');doc.line(nx,ny,nx+.7,ny-14);doc.line(nx+.7,ny-14,nx-1.8,ny-10);doc.line(nx+.7,ny-14,nx+3,ny-10);text('N',nx+.8,ny-17,10,'#52684d',{align:'center'});
    text('BASE DE REFERENCIA',312,70,11);let yy=83;for(const item of [proposal.referenceEdition?`Parcela GIS: ${fmt(SITE.parcelAreaSqft)} ft².`:'Marco anterior estimado: 75 × 125 ft.',`Listado: 9,375 ft². Conciliar con survey.`,`Casa: huella pública LiDAR 2015.`,`Ortofoto: tesela local identificada 2026.`,`Fachada: fotos del propietario y Apple Look Around.`,`Piscina, patios, muelle y alturas: estimados.`]){yy=para(item,312,yy,87,9)+8}
    yy=para('El marco GIS orienta el diseño; no certifica linderos. Los contornos exteriores combinan imágenes y croquis y deben medirse en campo.',312,yy+7,87,9)+12;
    para('Las cotas son locales al plano, en pies. El origen coincide con la esquina frontal izquierda de la parcela GIS. No representan alturas sobre el nivel del mar.',312,yy,87,9);
  }
  for(const zone of ['front','back'] as Zone[])for(const mode of ['existing','demolition','proposed','layout'] as const){
    const title=`${zone==='front'?'Frente y entrada':'Patio y piscina'} / ${mode==='existing'?'Estado actual':mode==='demolition'?'Retiros previstos':mode==='layout'?'Distribución de piezas':'Diseño propuesto'}`;
    sheet(title,`${zone==='front'?'F':'P'}-${mode==='existing'?'01':mode==='demolition'?'02':mode==='layout'?'04':'03'}`);
    const es=mode==='proposed'||mode==='layout'?proposal.elements:baselineFor(project,proposal);
    const d=c.surfaces[zone],fp=footprint(es,zone),f=referenceFrame(proposal),relevant=es.filter(e=>e.zone===zone&&e.kind!=='house'&&e.kind!=='fixed'),eb=bounds(union(relevant.map(polyFor))),minX=Math.min(-6,eb.x-5),maxX=Math.max(f.width+5,eb.maxX+5),minZ=zone==='front'?Math.min(-22,eb.z-5):Math.min(61,eb.z-5),maxZ=zone==='front'?Math.max(42,eb.maxZ+5):Math.max(f.depth+8,eb.maxZ+5);
    const fit=Math.min(257/(maxX-minX),174/(maxZ-minZ)),denominator=[75,100,125,150,200,250,500,1000].find(n=>304.8/n<=fit)??2000,scale=304.8/denominator,left=25-minX*scale,top=65;
    const worldBounds=rect(minX,minZ,maxX-minX,maxZ-minZ);
    const map=(p:MultiPolygon)=>intersection(p,worldBounds).map(poly=>poly.map(r=>r.map(([x,z])=>[left+x*scale,top+(maxZ-z)*scale] as [number,number])));
    const pt=(x:number,z:number)=>[left+x*scale,top+(maxZ-z)*scale] as [number,number];
    doc.setFillColor('#f0f3e7');doc.rect(18,59,279,190,'F');
    draw(map([[f.parcel]]),'#ccd6b8','#b3c09b');
    draw(map(rect(minX,f.street-7,maxX-minX,14)),'#d1d4c9');draw(map(rect(minX,f.sidewalk,maxX-minX,3.5)),'#e5e6dc');draw(map(rect(minX,f.shore+1,maxX-minX,30)),'#a5c9c2');
    if(mode==='proposed'||mode==='layout'){
      draw(map(d.grass),s.turf==='natural'?'#90a274':'#7c945b');draw(map(d.paths),s.concreteColor);d.tiles.forEach(tile=>draw(map(tile.polygon),s.concreteColor));if(s.method==='prefabricado'||mode==='layout')d.pathTiles.forEach(tile=>draw(map(tile.polygon),s.concreteColor));
    }else draw(map(mode==='demolition'?demolitionFor(es,proposal.elements,zone):fp.net),mode==='demolition'?'#ddb9a7':zone==='front'?'#c1a48b':'#a38b72');
    es.filter(e=>(e.zone===zone||e.kind==='house')&&!['paving','path','palm'].includes(e.kind)&&(!['proposed','layout'].includes(mode)||e.action!=='retirar')).forEach(e=>{
      draw(map(visibleFootprint(e,es)),e.kind==='pool'?'#8bbebc':e.kind==='house'?'#ded3bc':e.kind==='garden'?'#8c9c72':e.color);
      if(['pool','house','dock','stairs'].includes(e.kind)){
        const b=bounds(intersection(polyFor(e),worldBounds));if(b.maxX>b.x){const q=pt((b.x+b.maxX)/2,(b.z+b.maxZ)/2);text(e.kind==='house'?'CASA EXISTENTE':e.kind==='pool'?'PISCINA':e.kind==='dock'?'MUELLE':'ESCALONES',q[0],q[1],7,'#566b50',{align:'center'})}
      }
    });
    es.filter(e=>e.zone===zone&&e.kind==='palm'&&(!['proposed','layout'].includes(mode)||e.action!=='retirar')).forEach(e=>{
      const q=pt(e.x+e.width/2,e.z+e.depth/2);doc.setFillColor('#6f8557');doc.circle(q[0],q[1],2,'F');doc.setDrawColor('#7b915e');doc.setLineWidth(.35);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;doc.line(q[0],q[1],q[0]+Math.cos(a)*7,q[1]+Math.sin(a)*7)}
      if(mode==='demolition'){
        const future=proposal.elements.find(f=>f.id===e.id);if(future?.action==='retirar'){doc.setDrawColor('#a86d54');doc.line(q[0]-4,q[1]-4,q[0]+4,q[1]+4);doc.line(q[0]+4,q[1]-4,q[0]-4,q[1]+4)}
        if(future?.action==='trasladar'){const end=pt(future.x+future.width/2,future.z+future.depth/2);doc.setDrawColor('#a86d54');doc.setLineDashPattern([1,1],0);doc.line(q[0],q[1],end[0],end[1]);doc.setLineDashPattern([],0);doc.circle(end[0],end[1],3,'S')}
      }
    });
    if(mode==='layout'){
      [...d.tiles,...d.pathTiles].forEach((tile,i)=>{if(area(tile.polygon)<.5)return;const b=bounds(tile.polygon),q=pt((b.x+b.maxX)/2,(b.z+b.maxZ)/2);text(`${zone==='front'?'F':'P'}${i+1}`,q[0],q[1]+.6,6.4,'#5d6c54',{align:'center'})});
    }else{
      const occupied:{x:number;y:number;w:number;h:number}[]=[],seen=new Set<string>();
      const dims=es.filter(e=>e.zone===zone&&['paving','pool','path'].includes(e.kind));
      dims.forEach(e=>edgeDimensions(e).filter(d=>d.length>4).forEach(d=>{const key=[d.a,d.b].map(p=>p.map(n=>n.toFixed(2)).join(',')).sort().join('|');if(seen.has(key))return;seen.add(key);const aa=pt(...d.a),bb=pt(...d.b),len=Math.hypot(bb[0]-aa[0],bb[1]-aa[1]),dx=-(bb[1]-aa[1])/len,dz=(bb[0]-aa[0])/len,mid=[(aa[0]+bb[0])/2,(aa[1]+bb[1])/2];doc.setFontSize(7.2);const label=plain(feetLabel(d.length)+` (${d.source==='Croquis'?'C':d.source==='Referencia GIS'?'G':d.source==='Comprobada'?'V':'E'})`),tw=doc.getTextWidth(label)+1.4;
      let chosen:null|{x:number;y:number;offset:number}=null;
      for(const offset of [3,6,9,-3,-6,12,-9]){const x=mid[0]+dx*offset,y=mid[1]+dz*offset,box={x:x-tw/2,y:y-2.3,w:tw,h:3.6};if(box.x<25||box.x+box.w>286||box.y<67||box.y+box.h>240)continue;if(occupied.some(b=>box.x<b.x+b.w&&box.x+box.w>b.x&&box.y<b.y+b.h&&box.y+box.h>b.y))continue;occupied.push(box);chosen={x,y,offset};break}if(!chosen)return;const off=chosen.offset*.55;doc.setDrawColor('#60765a');doc.setLineWidth(.09);doc.line(aa[0]+dx*off,aa[1]+dz*off,bb[0]+dx*off,bb[1]+dz*off);doc.line(aa[0]+dx*off-.65*dz,aa[1]+dz*off+.65*dx,aa[0]+dx*off+.65*dz,aa[1]+dz*off-.65*dx);doc.line(bb[0]+dx*off-.65*dz,bb[1]+dz*off+.65*dx,bb[0]+dx*off+.65*dz,bb[1]+dz*off-.65*dx);doc.setFillColor('#fafbf5');doc.rect(chosen.x-tw/2,chosen.y-2.2,tw,3,'F');text(label,chosen.x,chosen.y,7.2,'#4b6250',{align:'center'});
      }));
    }
    const scaleX=25,scaleY=259;doc.setDrawColor('#405a3c');doc.setLineWidth(.4);doc.line(scaleX,scaleY,scaleX+10*scale,scaleY);for(let i=0;i<=2;i++)doc.line(scaleX+i*5*scale,scaleY-1.5,scaleX+i*5*scale,scaleY+1.5);text('0',scaleX,scaleY+6,7);text('5',scaleX+5*scale,scaleY+6,7);text('10 ft',scaleX+10*scale,scaleY+6,7);text(`1:${denominator} en A3 / imprimir al 100%`,100,261,8);
    text('LECTURA DEL PLANO',314,68,9);let y=78;
    const legend=mode==='demolition'?[['#ddb9a7','Pavimento / madera a retirar'],['#a86d54','Palmas: retiro o traslado'],['#8c9c72','Jardineras a modificar']]:[['#d8d4ca',mode==='existing'?'Superficie existente':'Concreto / piezas'],['#7c945b','Franjas verdes'],['#8c9c72','Jardineras'],['#8bbebc','Piscina conservada']];
    legend.forEach(([color,label])=>{doc.setFillColor(color);doc.rect(314,y-2,3,3,'F');text(label,321,y,8);y+=9});
    y+=9;text('CANTIDADES DE LA ZONA',314,y,9);y+=10;
    const zt=c.totals[zone];for(const [label,value] of [['Superficie nueva',`${fmt(zt.area)} ft²`],['Concreto neto',`${fmt(zt.concrete)} ft²`],['Franjas verdes',`${fmt(zt.grass)} ft²`],['Retiro existente',`${fmt(zt.demolition)} ft²`],['Cuadros con recortes',`${zt.cuts} / ${zt.tiles}`],['Camino / piezas',`${zt.pathPieces}`],['Apoyo por verificar',`${fmt(zt.unverified)} ft²`]]){text(label,314,y,8,'#708264');text(value,399,y,9,'#526d45',{align:'right'});y+=9}
    y+=7;y=para(mode==='layout'?'Identificadores F / P coinciden con el CSV de despiece. Piezas menores de 0.5 ft² se incluyen en cantidades, sin etiqueta por legibilidad.':'C: croquis / G: GIS / E: estimada / V: comprobada. Cotas de lados reales. Origen por tramo; las fotos no certifican dimensiones de campo.',314,y,85,8)+7;
    y=para(proposal.referenceEdition?'Base: parcela GIS del condado, huella LiDAR 2015, ortofoto local 2026 y fotos del propietario. Linderos, niveles, alturas y cierres pendientes del survey.':'Alternativa anterior: base estimada de croquis y fotografías. Linderos y cierres pendientes de survey.',314,y,85,8)+7;
    if(zone==='back')para('Verificar qué parte de la plataforma está sobre tierra y qué parte está elevada. No se define una estructura nueva con estas imágenes.',314,y,85,8);
  }
  for(const zone of ['front','back'] as Zone[]){
    sheet(`Despiece y cantidades / ${zone==='front'?'Frente':'Patio'}`,'D-00');let row=65;const d=c.surfaces[zone],t=c.totals[zone];
    text(`Cuadro ${s.tile} ft / franja ${s.gap*12} in / giro ${s.angle} grados`,22,row,11);row+=12;
    const entries=[['Superficie nueva',t.area,'ft²'],['Concreto neto',t.concrete,'ft²'],['Césped instalado',t.grass,'ft²'],['Concreto neto / volumen',t.volume,'yd³'],['Concreto con reserva',t.volume*(1+s.waste/100),'yd³'],['Cuadros completos',t.tiles-t.cuts,'ud'],['Cuadros recortados',t.cuts,'ud'],['Piezas de camino continuo',t.pathPieces,'ud'],['Apoyo sobre terreno',t.ground,'ft²'],['Apoyo elevado',t.elevated,'ft²'],['Apoyo pendiente de comprobar',t.unverified,'ft²'],['Área con cota de terreno',t.levelArea,'ft²'],['Corte con cotas indicadas',t.cut,'yd³'],['Relleno con cotas indicadas',t.fill,'yd³']];
    entries.forEach(([label,value,unit],i)=>{if(i%2===0){doc.setFillColor('#edf1e4');doc.rect(20,row-4,220,9,'F')}text(String(label),24,row,9);text(`${fmt(Number(value),2)} ${unit}`,235,row,10,'#52684d',{align:'right'});row+=10});
    text('COMPRA DE CÉSPED',263,79,11);let yy=92;for(const l of c.lines.filter(l=>l.zone===zone&&l.key.startsWith('turf-'))){text(l.name,263,yy,10);yy=para(l.note,263,yy+8,132,9)+10;text(`Cantidad facturable: ${fmt(l.qty??0,2)} ft²`,263,yy,11);yy+=15;para(`Sobrante frente a área instalada: ${fmt((l.qty??0)-t.grass,2)} ft². Incluye reserva, cortes, mínimos o redondeo del modo de compra.`,263,yy,132,9);yy+=30}
    para(`Artificial: ${t.rolls.pieces} cortes; longitud por acomodo ${fmt(t.rolls.cutLinear,2)} ft antes de reserva. ${t.rolls.rolls} rollos completos de ${s.rollWidth} × ${s.rollLength} ft si se compra por rollo. Dirección fija; el acomodo es conservador.`,263,yy,132,9);
    text('APOYOS Y NIVELES',22,242,11);para('Solo las áreas marcadas sobre terreno generan base granular y excavación. Con cota de terreno se integra la diferencia entre terreno y cara inferior de capas; sin cota se usa la profundidad provisional. Las áreas elevadas o por verificar requieren solución independiente.',22,252,370,9);
  }
  if(proposal.frontCalibration===3){sheet('Frente / controles del croquis y revisión visual','F-05');let fy=67;for(const m of FRONT_CONTROLS){text(m.label,22,fy,11);text(`${m.value} / ${m.source}`,395,fy,10,'#6e815c',{align:'right'});fy=para(m.use,22,fy+7,370,9)+12}para('Recorrido Apple Look Around: frente central, accesos izquierdo y derecho, vistas oblicuas desde ambos extremos. Referencias consultadas el 22 oct 2026; fecha de captura no visible. Se comprueban formas y proporciones, sin convertir imágenes de perspectiva en cotas certificadas.',22,fy+3,370,9)}
  sheet('Capas y decisiones de construcción','D-01');
  text('DOS ZONAS / DOS CONDICIONES DE APOYO',20,65,10);
  const layers=[['CUADROS DE CONCRETO',`Frente ${s.thickness} in / patio ${s.backThickness} in. Parámetros de cálculo, sujetos a verificación.`,s.concreteColor,13],['BASE DE ESTUDIO',`${s.base} in colocadas. Compra con factor ${s.looseFactor}. Verificar composición y compactación.`,'#b9b599',19],['TERRENO / APOYO',`Excavación propuesta ${s.excavation} in. Medir material existente y ajustar niveles reales.`,'#999d76',24]] as const;
  let ly=83;layers.forEach(([label,note,color,h])=>{doc.setFillColor(color);doc.rect(22,ly,210,h,'F');text(label,245,ly+5,11);para(note,245,ly+12,145,9);ly+=h+17});
  para('Concreto y césped deben tener una solución compatible de niveles y salida de agua. Las franjas verdes por sí solas no demuestran permeabilidad del conjunto.',22,214,207,11);
  para('La base y el concreto no se especifican sobre una plataforma de madera sin comprobar su apoyo. El espesor, la mezcla, el refuerzo, las juntas y los detalles junto a piscina se definen al cerrar el diseño.',245,214,148,10);
  text('CUADRO / FRANJA',22,254,10);text(`${s.tile} ft / ${fmt(s.gap*12)} in  |  Giro ${s.angle}°  |  ${s.method==='vaciado'?'Vaciado en obra':'Prefabricado'}  |  Césped ${s.turf}`,22,264,10);
  // Coordinate schedule makes every irregular footprint reproducible from the exported plan.
  sheet('Registro de elementos y contornos','D-02');
  let y=65;
  for(const zone of ['front','back'] as Zone[]){text(zone==='front'?'FRENTE':'PATIO',20,y,11);y+=10;
    proposal.elements.filter(e=>e.zone===zone).forEach(e=>{if(y>250){sheet('Registro de elementos / continuación','D-02');y=65}
      text(e.name,20,y,10);text(`${e.source} / ${e.action} / apoyo ${e.support}`,220,y,8,'#8e9c7b');y+=5;
      y=para(`X ${fmt(e.x,2)} ft / Y ${fmt(e.z,2)} ft / ancho ${fmt(e.width,2)} ft / fondo ${fmt(e.depth,2)} ft / giro ${fmt(e.rotation)}° / nivel ${fmt(e.elevation,2)} ft / pendientes X/Y ${e.slopeX??0}% / ${e.slopeZ??0}% / terreno ${e.groundElevation===undefined?'sin cota':e.groundElevation+' ft'} / forma ${e.shape==='ellipse'?'óvalo':e.shape==='polygon'?'polígono':'rectángulo'}`,20,y,378,8)+3;
      if(e.points)y=para('Puntos locales (X,Y) en ft: '+e.points.map(p=>`(${fmt(p[0],2)}, ${fmt(p[1],2)})`).join(' - '),20,y,378,8)+4;
    });y+=8;
  }
  for(const zone of ['front','back','shared'] as const){sheet(`Materiales y presupuesto / ${zone==='front'?'Frente':zone==='back'?'Patio':'Compartidos'}`,'C-01');y=65;
    const heading=()=>{doc.setFillColor('#e9efdd');doc.rect(18,y-5,384,10,'F');text('PARTIDA / CONDICIONES',22,y,8);text('CANTIDAD COMPRA',262,y,8);text('PRECIO USD',325,y,8);text('IMPORTE USD',393,y,8,'#52684d',{align:'right'});y+=13};heading();
    c.lines.filter(l=>l.zone===zone).forEach(l=>{
      doc.setFontSize(8);const rows=doc.splitTextToSize(plain(l.note),227),height=12+Math.min(rows.length,5)*3.3;
      if(y+height>258){sheet(`Materiales / ${zone==='front'?'Frente':zone==='back'?'Patio':'Compartidos'} / continuación`,'C-01');y=65;heading()}
      text(l.name,22,y,10);text(l.qty===null?'Por medir':`${fmt(l.qty,2)} ${l.unit}`,262,y,9);text(l.rate===null?'Por cotizar':usd(l.rate),325,y,9);text(l.amount===null?'Pendiente':usd(l.amount),393,y,10,l.amount===null?'#a28e65':'#52684d',{align:'right'});
      if(l.note)para(l.note,22,y+5,227,8);text(`${l.source.startsWith('Pendiente')?'Cotización pendiente':l.source.startsWith('Referencia')?'Referencia regional / confirmar':'Tarifa del usuario'} / ${l.date}`,22,y+height-3,7,'#758169');y+=height+3;doc.setDrawColor('#e4e9da');doc.line(20,y-4,400,y-4);
    });
    if(zone==='shared'){y+=5;for(const [label,value] of [['Subtotal con precio',c.subtotal],['Gastos / margen',c.overhead],['Impuesto estimado',c.tax],['Imprevistos',c.contingency],['IMPORTE PARCIAL CALCULADO',c.total]]){text(String(label),235,y,11);text(usd(Number(value)),394,y,12,'#3e5b38',{align:'right'});y+=10}para(`${c.pending} partidas pendientes. Este importe no representa el costo completo de la obra. Las tarifas por unidad son comunes a las dos zonas.`,22,y+5,370,10)}
  }
  sheet('Obra / secuencia y tiempos','O-01');y=66;
  text(`Cuadrilla: ${s.crew} personas / ${s.hours} h por jornada / rendimiento: ${s.productivity} ft² por persona y día`,20,y,10);y+=17;
  stages(c.workDays,s.method==='vaciado'?s.curingDays:0).forEach((st,i)=>{text(`${String(i+1).padStart(2,'0')} / ${st.name}`,22,y,12);text(st.days===null?'Por definir':`${st.days} días`,395,y,10,'#8f9f7a',{align:'right'});y=para(st.detail,35,y+7,355,9)+10});
  para('No se fija fecha de terminación: faltan tiempos de permisos, retiros, preparación, instalaciones y condiciones ocultas. La espera indicada no autoriza el tránsito de vehículos.',22,257,370,9);
  sheet('Medidas pendientes y fuentes','V-01');y=65;
  project.measures.forEach(m=>{if(y>235){sheet('Medidas pendientes / continuación','V-01');y=65}text(m.label,22,y,11);text(`${m.value} / ${m.source}`,395,y,9,'#91a179',{align:'right'});y=para(m.note,22,y+7,370,9)+11});
  sheet('Consultas y criterios del expediente','V-02');y=65;
  for(const source of SOURCES){text(source.title,22,y,13);y=para(source.note,22,y+9,365,10)+6;y=para(source.url,22,y,365,8)+15;doc.link(22,y-22,370,20,{url:source.url})}
  text('PRECIOS DE REFERENCIA',22,y,12);y+=10;
  for(const [key,r] of Object.entries(project.rates).filter(([,r])=>r.value!==null)){if(y>230){sheet('Referencias de precios / continuación','V-03');y=65}y=para(`${key}: ${r.value} USD / ${r.source} / ${r.date}`,22,y,365,9)+4;if(r.url)y=para(r.url,22,y,365,8)+8}
  y=para('Césped artificial: corte por rectángulos que contienen cada franja recortada, manteniendo dirección fija; acomodo por filas dentro del ancho de rollo. Sin reutilizar sobrantes. La cantidad facturable se estima por pies lineales; rollos equivalentes son informativos.',22,y+8,365,9)+8;
  para('Bases y espesores: hipótesis editables, no una especificación final. Confirmar cuadrícula con North Miami, capacidad vehicular de prefabricados, apoyos del patio, drenaje, palmas y niveles junto a piscina. Las superficies propuestas no sustituyen el survey.',22,y,365,9);
  sheet('Base de referencia y control de cantidades','V-04');text('REFERENCIAS DEL INMUEBLE',22,67,12);let ry=81;
  for(const [title,detail,url] of [['Parcela oficial de Miami-Dade',`Área geométrica ${fmt(SITE.parcelAreaSqft,1)} ft². Listado: 9,375 ft². No sustituye el survey firmado.`,SITE.parcelUrl],['Huella pública de la casa',`LiDAR / actualización 2015. ${fmt(SITE.buildingAreaSqft,1)} ft² de huella, no superficie habitable. Altura no disponible.`,SITE.buildingUrl],['Ortofoto del condado','Tesela local 2026, píxel nominal 3 in. Fecha exacta de vuelo no disponible; metadatos generales 2025/2026.',SITE.aerialUrl],['Fotografías y Apple Look Around','Fachada y patio: fotos del propietario. Apple Look Around confirma torre con ventana circular, ventanales y cocheras. Fecha de captura no visible; consulta 22 oct 2026.',SITE.appleUrl]]){text(title,22,ry,11);ry=para(detail,22,ry+7,370,9)+5;ry=para(url,22,ry,370,8)+12}
  text('REVISIÓN AUTOMÁTICA',22,ry,12);ry+=10;for(const warning of c.warnings){ry=para(warning,22,ry,370,9)+7}
  doc.setProperties({title:`Keystone Residence - ${proposal.name}`,author:'All Needs Discount LLC',subject:'Planificación preliminar de exteriores',creator:'Keystone Studio'});
  return doc;
}
export async function makePdf(project:Project,proposal:Proposal):Promise<Blob>{return buildPdf(project,proposal).output('blob')}
