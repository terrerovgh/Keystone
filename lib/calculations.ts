import { area, footprint, perimeter, surface, turfRolls } from './geometry';
import type { Project, Proposal, Zone } from './project';
export interface Line {key:string;name:string;zone:Zone|'shared';qty:number|null;unit:string;rate:number|null;amount:number|null;note:string;source:string;date:string;url?:string;}
export function calculate(project:Project,proposal:Proposal){
  const s=proposal.settings,w=1+s.waste/100,lines:Line[]=[];
  const add=(key:string,name:string,zone:Line['zone'],qty:number|null,unit:string,note='')=>{const rate=project.rates[key];lines.push({key,name,zone,qty,unit,rate:rate?.value??null,amount:qty===null||rate?.value==null?null:qty*rate.value,note,source:rate?.source??'Pendiente',date:rate?.date??'',url:rate?.url})};
  const surfaces={front:surface(proposal,'front'),back:surface(proposal,'back')};
  let totalWork=0;
  const totals={} as Record<Zone,{area:number;concrete:number;grass:number;volume:number;tiles:number;cuts:number;demolition:number;rolls:ReturnType<typeof turfRolls>}>;
  for(const zone of ['front','back'] as Zone[]){
    const t=surfaces[zone],a=area(t.net),c=area(t.concrete),g=area(t.grass),th=zone==='front'?s.thickness:s.backThickness;
    const old=area(footprint(project.existing,zone).net);
    const rolls=turfRolls(t.turfCuts,s.rollWidth,s.rollLength,s.waste,s.angle);
    const volume=c*th/12/27,forms=t.tiles.reduce((n,t)=>n+perimeter(t.polygon),0)+perimeter(t.paths);
    totals[zone]={area:a,concrete:c,grass:g,volume,tiles:t.tiles.length,cuts:t.tiles.filter(t=>!t.full).length,demolition:old,rolls};totalWork+=a;
    add(zone==='front'?'demo-paver':'demo-wood',zone==='front'?'Retiro de adoquín existente':'Retiro de madera existente',zone,old,'ft²','Superficie del estado actual, independiente del diseño nuevo.');
    add('disposal','Retiro de residuos',zone,old*(zone==='front'?s.demolitionFront:s.demolitionBack)/12/27*s.looseFactor,'yd³','Volumen suelto aproximado; espesor y factor editables. No incluye estructura oculta de madera.');
    add('excavate','Excavación sobre terreno',zone,zone==='back'&&area(t.elevated)>0?null:a*s.excavation/12/27,'yd³','En patio, pendiente hasta comprobar apoyo bajo la madera.');
    add('base','Base granular · compra',zone,a*s.base/12/27*s.looseFactor,'yd³',`Volumen colocado: ${(a*s.base/12/27).toFixed(2)} yd³. Factor de compra ${s.looseFactor}. Patio condicionado a apoyo.`);
    if(s.method==='vaciado'){
      add('concrete','Concreto · compra',zone,volume*w,'yd³',`Neto ${volume.toFixed(2)} yd³ + ${s.waste}% de reserva; espesor preliminar ${th}″. Mezcla final pendiente.`);
      add('forms','Moldes de cuadros y caminos',zone,forms,'ft','Incluye bordes de cada cuadro, recortes y caminos.');
    }else{
      add('precast','Piezas prefabricadas · compra',zone,Math.ceil(t.tiles.length*w),'ud',`${t.tiles.length} piezas de cuadrícula, ${totals[zone].cuts} con cortes. Sin reutilizar recortes. Capacidad vehicular pendiente.`);
      add('precast','Piezas para camino continuo',zone,Math.ceil(area(t.paths)/(s.tile*s.tile)*w),'ud','Estimación por superficie; despiece del camino a confirmar con formato de fábrica.');
    }
    if(s.turf==='artificial'){
      add('turf-artificial','Césped artificial · corte de rollo',zone,rolls.area,'ft²',`Instalado ${g.toFixed(1)} ft². Compra ${rolls.linear.toFixed(1)} ft lineales × ${s.rollWidth}′; cortes con dirección fija y ${s.waste}% adicional. ${rolls.rolls} rollos equivalentes de ${s.rollLength}′ (informativo).`);
      add('fixings','Fijaciones y relleno de césped',zone,g,'ft²','Tarifa conjunta por superficie instalada.');
    }else{
      add('turf-natural','Césped natural · compra',zone,g*w,'ft²',`Instalado ${g.toFixed(1)} ft² + ${s.waste}% de reserva.`);
      add('soil','Tierra para franjas naturales',zone,g*s.soil/12/27*w,'yd³');
      add('irrigation','Ajustes de riego',zone,null,'lote','Recorrido y necesidades pendientes de visita.');
    }
    add('edging','Contención exterior',zone,perimeter(t.net),'ft','Perímetro exterior y huecos; no duplica todos los bordes de cada cuadro.');
    add('soil','Tierra de jardineras · reposición',zone,area(t.gardens)*s.soil/12/27*w,'yd³','Hipótesis: renovar la capa indicada en todas las jardineras del diseño.');
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
  return {surfaces,totals,lines,subtotal,overhead,tax,contingency,total:subtotal+overhead+tax+contingency,pending:lines.filter(l=>l.amount===null).length,workDays:totalWork/(s.productivity*s.crew)};
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
