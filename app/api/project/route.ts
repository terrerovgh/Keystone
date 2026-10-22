import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { validProject } from '@/lib/project';
export async function GET(){
  const user=await getChatGPTUser();if(!user)return Response.json({error:'Inicia sesión para abrir tu proyecto.'},{status:401});
  try{
    const db=env.DB as D1Database;
    const row=await db.prepare('SELECT payload, revision FROM projects WHERE owner=?').bind(user.userId).first<{payload:string;revision:number}>();
    return Response.json({project:row?JSON.parse(row.payload):null,revision:row?.revision??0},{headers:{'Cache-Control':'private, no-store'}});
  }catch{return Response.json({error:'No se pudo abrir el proyecto guardado.'},{status:503})}
}
export async function PUT(request:Request){
  const user=await getChatGPTUser();if(!user)return Response.json({error:'Inicia sesión para guardar.'},{status:401});
  const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Origen no permitido.'},{status:403});
  try{
    const text=await request.text();if(text.length>3_000_000)return Response.json({error:'El proyecto supera el tamaño permitido.'},{status:413});
    const {project,expectedRevision}=JSON.parse(text);
    if(!validProject(project)||!Number.isInteger(expectedRevision)||expectedRevision<0)return Response.json({error:'El archivo de proyecto no es válido.'},{status:400});
    const db=env.DB as D1Database;
    const row=await db.prepare('INSERT INTO projects (owner,payload,revision,updated_at) SELECT ?,?,1,? WHERE ?=0 ON CONFLICT(owner) DO NOTHING RETURNING revision')
      .bind(user.userId,JSON.stringify(project),new Date().toISOString(),expectedRevision).first<{revision:number}>();
    if(row)return Response.json(row);
    const updated=await db.prepare('UPDATE projects SET payload=?, revision=revision+1, updated_at=? WHERE owner=? AND revision=? RETURNING revision')
      .bind(JSON.stringify(project),new Date().toISOString(),user.userId,expectedRevision).first<{revision:number}>();
    if(!updated)return Response.json({error:'Hay una versión más reciente en otra pestaña. Descarga una copia antes de recargar.'},{status:409});
    return Response.json(updated);
  }catch{return Response.json({error:'No se pudo guardar. Tu copia local permanece en este dispositivo.'},{status:503})}
}
