import { area, demolitionFor, difference, intersection, polyFor, union, footprint, perimeter, surface, turfRolls } from './geometry';
import { baselineFor, type Project, type Proposal, type Zone } from './project';
import { earthVolumes, supportAreas } from './engineering';
export interface Line {key:string;name:string;zone:Zone|'shared';qty:number|null;unit:string;rate:number|null;amount:number|null;note:string;source:string;date:string;url?:string;}
export function calculate(project:Project,proposal:Proposal){
  const s=proposal.settings,w=1+s.waste/100,lines:Line[]=[];
  const add=(key:string,name:string,zone:Line['zone'],qty:number|null,unit:string,note='')=>{const rate=project.rates[key];lines.push({key,name,zone,qty,unit,rate:rate?.value??null,amount:qty===null||rate?.value==null?null:qty*rate.value,note,source:rate?.source??'Pendiente',date:rate?.date??'',url:rate?.url})};
  const surfaces={front:surface(proposal,'front'),back:surface(proposal,'back')};
  let totalWork=0;
  const totals={} as Record<Zone,{area:number;concrete:number;grass:number;volume:number;tiles:number;cuts:number;demolition:number;ground:number;elevated:number;unverified:number;cut:number;fill:number;levelArea:number;pathPieces:number;rolls:ReturnType<typeof turfRolls>}>;
  for(const zone of ['front','back'] as Zone[]){
    const t=surfaces[zone],a=area(t.net),c=area(t.concrete),g=area(t.grass),th=zone==='front'?s.thickness:s.backThickness;
    const old=area(demolitionFor(baselineFor(project,proposal),proposal.elements,zone));
    const rolls=turfRolls(t.turfCuts,s.rollWidth,s.rollLength,s.waste,s.angle);
    const volume=c*th/12/27,forms=t.tiles.reduce((n,t)=>n+perimeter(t.polygon),0)+perimeter(t.paths);
    const support=supportAreas(t.net,proposal.elements.filter(e=>e.zone===zone)),ground=area(support.terreno),elevated=area(support.elevado),unverified=area(support['por verificar'])<.001?0:area(support['por verificar']);
    let cut=0,fill=0,levelArea=0,rest=support.terreno;
    for(const e of [...proposal.elements].reverse().filter(e=>e.zone===zone&&['path','paving'].includes(e.kind)&&e.action!=='retirar')){const part=intersection(rest,polyFor(e));if(e.groundElevation!==undefined){const cv=earthVolumes(intersection(part,t.concrete),e,s.base+th),gv=earthVolumes(intersection(part,t.grass),e,s.base+(s.turf==='natural'?s.soil:.5));cut+=cv.cut+gv.cut;fill+=cv.fill+gv.fill;levelArea+=area(part)}rest=difference(rest,polyFor(e))}
    totals[zone]={ground,elevated,unverified,cut,fill,levelArea,pathPieces:t.pathTiles.length,area:a,concrete:c,grass:g,volume,tiles:t.tiles.length,cuts:t.tiles.filter(t=>!t.full).length,demolition:old,rolls};totalWork+=a;
    add(zone==='front'?'demo-paver':'demo-wood',zone==='front'?'Retiro de adoquín existente':'Retiro de madera existente',zone,old,'ft²','Superficie del estado actual, independiente del diseño nuevo.');
    add('disposal','Retiro de residuos',zone,old*(zone==='front'?s.demolitionFront:s.demolitionBack)/12/27*s.looseFactor,'yd³','Volumen suelto aproximado; espesor y factor editables. No incluye estructura oculta de madera.');
    add('excavate','Excavación · terreno definido',zone,ground>0?cut+(ground-levelArea)*s.excavation/12/27:unverified>0?null:0,'yd³',`${levelArea.toFixed(1)} ft² con nivel del terreno; ${(ground-levelArea).toFixed(1)} ft² con profundidad provisional ${s.excavation} in. ${unverified.toFixed(1)} ft² pendientes de apoyo, excluidos.`);
    if(fill>0)add('base','Relleno por diferencia de niveles',zone,fill*s.looseFactor,'yd³',`Neto ${fill.toFixed(2)} yd³; material a definir. No sustituye la base.`);
    add('base','Base granular · terreno definido',zone,ground>0?ground*s.base/12/27*s.looseFactor:unverified>0?null:0,'yd³',`Colocado ${(ground*s.base/12/27).toFixed(2)} yd³. Solo ${ground.toFixed(1)} ft² sobre terreno. Factor ${s.looseFactor}. No incluye áreas sin verificar ni elevadas.`);
    if(s.method==='vaciado'){
      add('concrete','Concreto · compra',zone,volume*w,'yd³',`Neto ${volume.toFixed(2)} yd³ + ${s.waste}% de reserva; espesor preliminar ${th}″. Mezcla final pendiente.`);
      add('forms','Moldes de cuadros y caminos',zone,forms,'ft','Incluye bordes de cada cuadro, recortes y caminos.');
    }else{
      add('precast','Piezas prefabricadas · compra',zone,Math.ceil(t.tiles.length*w),'ud',`${t.tiles.length} piezas de cuadrícula, ${totals[zone].cuts} con cortes. Sin reutilizar recortes. Capacidad vehicular pendiente.`);
      add('precast','Piezas para camino continuo',zone,Math.ceil(t.pathTiles.length*w),'ud',`${t.pathTiles.length} piezas recortadas con el formato de ${s.tile} ft, ${t.pathTiles.filter(x=>!x.full).length} cortes. Sin reutilizar recortes.`);
    }
    if(s.turf==='artificial'){
      add('turf-artificial','Césped artificial · corte de rollo',zone,g===0?0:s.turfUnit==='roll'?rolls.wholeRollArea:Math.max(rolls.area,s.minTurf??0),'ft²',`Instalado ${g.toFixed(1)} ft². Compra ${rolls.linear.toFixed(1)} ft lineales × ${s.rollWidth}′; cortes con dirección fija y ${s.waste}% adicional. ${rolls.rolls} rollos completos si se compra por rollo. Modo: ${s.turfUnit==='roll'?'rollo completo':'corte lineal'}; mínimo ${s.minTurf??0} ft². Sobrante según modo de compra.`);
      add('fixings','Fijaciones y relleno de césped',zone,g,'ft²','Tarifa conjunta por superficie instalada.');
    }else{
      add('turf-natural','Césped natural · compra',zone,s.sodUnit==='pallet'?Math.ceil(g*w/(s.sodPack??500))*(s.sodPack??500):g*w,'ft²',`Instalado ${g.toFixed(1)} ft² + ${s.waste}% de reserva. Compra ${s.sodUnit==='pallet'?`por palés de ${s.sodPack??500} ft²`:'por área'}; sobrante por redondeo incluido.`);
      add('soil','Tierra para franjas naturales',zone,g*s.soil/12/27*w,'yd³');
      add('irrigation','Ajustes de riego',zone,null,'lote','Recorrido y necesidades pendientes de visita.');
    }
    add('edging','Contención exterior',zone,perimeter(t.net),'ft','Perímetro exterior y huecos; no duplica todos los bordes de cada cuadro.');
    const modifiedGardens=area(intersection(t.gardens,union(proposal.elements.filter(e=>e.zone===zone&&e.kind==='garden'&&['nuevo','trasladar'].includes(e.action)).map(polyFor))));
    add('soil','Tierra de jardineras · reposición',zone,modifiedGardens*s.soil/12/27*w,'yd³','Solo jardineras nuevas o trasladadas; excluye las marcadas conservar. Capa de tierra editable.');
    if(modifiedGardens>0)add('planting','Jardinería · rehacer áreas modificadas',zone,modifiedGardens,'ft²','Definir vegetación y mano de obra en cotización por área. Tierra y palmas se desglosan por separado.');
    const days=a/(s.productivity*s.crew);
    add('labor','Cuadrilla · colocación y acabado',zone,days*s.crew*s.hours,'h-persona','Rendimiento por persona/día. Demolición, transporte y palmas se cotizan por separado.');
    add('equipment','Equipos · colocación',zone,Math.ceil(days),'día','Incluye días de colocación; equipos especiales pendientes.');
    add('drainage','Drenajes y conexiones',zone,null,'lote','Requiere niveles y destino autorizado del agua.');
    if(s.method==='vaciado')add('reinforcement','Refuerzo y juntas especiales',zone,null,'lote','Definir según apoyo, cargas y revisión del diseño.');
    if(area(t.elevated)>0)add('support','Apoyos y estructura del patio',zone,null,'lote','No se considera que una plataforma elevada pueda recibir concreto sin revisar su estructura.');
    const removed=proposal.elements.filter(e=>e.zone===zone&&e.kind==='palm'&&e.action==='retirar').length;
    const moved=proposal.elements.filter(e=>e.zone===zone&&e.kind==='palm'&&e.action==='trasladar').length;
    if(removed)add('palm-remove','Retiro de palma',zone,removed,'ud');if(moved)add('palm-move','Traslado de palmas',zone,moved,'ud','Incluye evaluación de viabilidad y condiciones de traslado por cotizar.');
  }
  add('survey','Levantamiento y verificación','shared',1,'lote');add('permits','Permisos y revisiones','shared',1,'lote');add('transport','Movilización y entregas adicionales','shared',1,'lote','Evitar duplicar entregas ya incluidas en tarifas de materiales.');
  const subtotal=lines.reduce((n,l)=>n+(l.amount??0),0),overhead=subtotal*s.overhead/100,tax=subtotal*s.tax/100,contingency=(subtotal+overhead+tax)*s.contingency/100;
  const warnings:string[]=[];
  const front=union(proposal.elements.filter(e=>e.zone==='front'&&['paving','path'].includes(e.kind)&&e.action!=='retirar').map(polyFor)),back=union(proposal.elements.filter(e=>e.zone==='back'&&['paving','path'].includes(e.kind)&&e.action!=='retirar').map(polyFor));
  if(area(intersection(front,back))>.01)warnings.push('Hay superficies de frente y patio superpuestas. El frente tiene prioridad; el solape no se suma dos veces.');
  if(totals.back.unverified+totals.front.unverified>.01)warnings.push(`${(totals.back.unverified+totals.front.unverified).toFixed(1)} ft² pendientes de comprobar apoyo: base y excavación excluidas de esa área; pavimento condicionado.`);
  if(s.base+s.thickness>s.excavation+.01&&totals.front.ground>totals.front.levelArea+.1)warnings.push(`Frente: base + concreto suman ${s.base+s.thickness} in; excavación provisional ${s.excavation} in. Medir niveles y conciliar ${s.base+s.thickness-s.excavation} in.`);
  if(totals.back.elevated+totals.front.elevated>0)warnings.push('Las áreas elevadas requieren solución de apoyo. No generan excavación ni base granular.');
  return {warnings,surfaces,totals,lines,subtotal,overhead,tax,contingency,total:subtotal+overhead+tax+contingency,pending:lines.filter(l=>l.amount===null).length,workDays:totalWork/(s.productivity*s.crew)};
}
export function stages(workDays:number,curingDays:number){return [
  {id:'measure',name:'Medir y cerrar el diseño',days:null,detail:'Survey, piscina, contornos, niveles, apoyos y servicios enterrados.'},
  {id:'permit',name:'Permisos y revisión',days:null,detail:'Consulta de cuadrícula, accesos, drenaje y traslado de palmas. Plazos municipales pendientes.'},
  {id:'protect',name:'Proteger y preparar accesos',days:1,detail:'Proteger casa, piscina y muelle. Mantener un acceso utilizable cuando sea viable.'},
  {id:'remove',name:'Retirar pavimento y madera',days:null,detail:'Trabajar por sectores. Separar residuos y comprobar lo que hay debajo.'},
  {id:'ground',name:'Preparar terreno, apoyos e instalaciones',days:null,detail:'Resolver primero apoyos, base, niveles, riego y drenaje. Revisar antes de cubrir.'},
  {id:'paving',name:'Colocar cuadros y caminos',days:Math.ceil(workDays),detail:'Duración calculada con superficie, cuadrilla y rendimiento. Secuencia por sectores.'},
  {id:'cure',name:'Espera antes de uso',days:curingDays,detail:'Hipótesis de calendario editable; liberar el uso según mezcla, fabricante y responsable de obra.'},
  {id:'green',name:'Franjas verdes y jardineras',days:null,detail:'Instalar césped, reponer tierra y ejecutar los traslados de palmas según la secuencia acordada.'},
  {id:'close',name:'Revisión final',days:1,detail:'Comprobar medidas, acabados, salida de agua, limpieza e inspecciones aplicables.'},
]}
