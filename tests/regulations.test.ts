import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { activeProposal, createProject } from '../lib/project';
import { LEGAL_CATALOG, regulatoryFindings, regulatorySource } from '../lib/regulations';
const date=new Date('2026-10-23T16:00:00Z');

test('las alertas de acceso responden al diseño y no desaparecen al preparar documentos',()=>{
 const p=createProject(),v=activeProposal(p),before=JSON.stringify(p),findings=regulatoryFindings(p,v,date);
 assert.ok(findings.some(f=>f.id==='driveway-grid'&&f.status==='alert'));assert.equal(JSON.stringify(p),before);
 p.checklist['legal:driveway-grid']=true;assert.ok(regulatoryFindings(p,v,date).some(f=>f.id==='driveway-grid'&&f.status==='alert'));
 v.settings.gap=0;assert.ok(!regulatoryFindings(p,v,date).some(f=>f.id==='driveway-grid'));
 v.settings.method='vaciado';v.settings.thickness=3;assert.ok(regulatoryFindings(p,v,date).some(f=>f.id==='driveway-thickness'));
 v.settings.thickness=6;assert.ok(!regulatoryFindings(p,v,date).some(f=>f.id==='driveway-thickness'));
});
test('otra dirección requiere verificar jurisdicción y un catálogo antiguo exige nueva consulta',()=>{
 const p=createProject(),v=activeProposal(p);p.address='123 Main St, Miami';assert.deepEqual(regulatoryFindings(p,v,date).map(f=>f.id),['jurisdiction']);
 p.address='2331 Keystone Blvd · North Miami Beach, FL';assert.deepEqual(regulatoryFindings(p,v,date).map(f=>f.id),['jurisdiction']);
 p.address='2331 Keystone Blvd · North Miami, FL';assert.ok(regulatoryFindings(p,v,new Date('2026-12-10T16:00:00Z')).some(f=>f.id==='currency'));
});
test('un muelle conservado con geometría modificada requiere revisión aunque no cambie su acción',()=>{
 const p=createProject(),v=activeProposal(p),dock=v.elements.find(e=>e.kind==='dock')!;dock.x+=1;
 assert.ok(regulatoryFindings(p,v,date).some(f=>f.id==='dock'));
});
test('cada alerta enlaza evidencia y cada PDF archivado conserva su hash y tamaño',()=>{
 const p=createProject();for(const finding of regulatoryFindings(p,activeProposal(p),date))for(const source of finding.sources)assert.ok(regulatorySource(source),source);
 assert.equal(new Set(LEGAL_CATALOG.documents.map(d=>d.id)).size,LEGAL_CATALOG.documents.length);
 let count=0;
 for(const document of LEGAL_CATALOG.documents){
  const d=document as typeof document & {archiveStatus?:string;localPath?:string;sha256?:string;bytes?:number};
  if(d.archiveStatus!=='archived')continue;count++;
  const file=readFileSync(new URL('../public'+d.localPath,import.meta.url));
  assert.equal(file.subarray(0,5).toString(),'%PDF-');assert.equal(file.length,d.bytes);assert.equal(createHash('sha256').update(file).digest('hex'),d.sha256);
 }
 assert.ok(count>=10);
});
