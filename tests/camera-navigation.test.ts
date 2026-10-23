import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { frameCamera } from '../components/scene-view';

test('switching between front and patio tolerates the previous zone camera until the next frame',()=>{
 const camera=new T.PerspectiveCamera(39,1.5,.2,1000),controls={target:new T.Vector3(),update(){}};
 for(const [zone,view] of [['back','architecture'],['front','architecture'],['front','front'],['back','front'],['back','houseSteps'],['front','houseSteps'],['back','dockSteps'],['front','dockSteps']] as const){
  frameCamera({camera,controls:controls as any},zone,view);
  assert.ok([...camera.position.toArray(),...controls.target.toArray()].every(Number.isFinite),`${zone} / ${view}`);
  assert.ok(camera.position.distanceTo(controls.target)>0);
 }
});
