import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { validProject } from '@/lib/project';
export async function GET(request:Request){
  const user=await getChatGPTUser();if(!user)return Response.json({error:'Inicia sesión.'},{status:401});
  try{
    const db=env.DB as D1Database,id=new URL(request.url).searchParams.get('id');
    if(id){const row=await db.prepare('SELECT payload FROM versions WHERE id=? AND owner=?').bind(id,user.userId).first<{payload:string}>();return row?Response.json({project:JSON.parse(row.payload)}):Response.json({error:'Versión no encontrada.'},{status:404})}
    const r=await db.prepare('SELECT id,name,created_at FROM versions WHERE owner=? ORDER BY created_at DESC LIMIT 40').bind(user.userId).all();
    return Response.json({versions:r.results},{headers:{'Cache-Control':'private, no-store'}});
  }catch{return Response.json({error:'No se pudo consultar el historial.'},{status:503})}
}
export async function POST(request:Request){
  const user=await getChatGPTUser();if(!user)return Response.json({error:'Inicia sesión.'},{status:401});
  const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Origen no permitido.'},{status:403});
  try{
    const raw=await request.text();if(raw.length>3_000_000)return Response.json({error:'Archivo demasiado grande.'},{status:413});
    const {project,name}=JSON.parse(raw);if(!validProject(project)||typeof name!=='string'||!name.trim()||name.length>120)return Response.json({error:'Revisa el nombre y el proyecto.'},{status:400});
    const id=crypto.randomUUID(),date=new Date().toISOString();
    await (env.DB as D1Database).prepare('INSERT INTO versions (id,owner,name,payload,created_at) VALUES (?,?,?,?,?)').bind(id,user.userId,name.trim(),JSON.stringify(project),date).run();
    return Response.json({id,name,created_at:date});
  }catch{return Response.json({error:'No se pudo crear la versión.'},{status:503})}
}
