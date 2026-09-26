import test from 'node:test'
import assert from 'node:assert/strict'
import { getMorphologyEvidence, evidenceText, linkedRegion } from '../src/utils/morphologyEvidence.js'
import { makeMorphologyExample } from '../src/mock/morphologyExamples.js'
const make = (fields = {}) => ({ evidenceSchemaVersion: 1, morphologyEvidence: [{ id: 'C08', status: 'recorded', observation: null, value: 0, unit: '%', source: 'validated_measurement', method: 'reviewed segmentation', ...fields }] })
test('legacy contributions never become measurements', () => {
  const e = getMorphologyEvidence({ conceptScores: [{id:'C08',percent:95,score:95}] })
  assert.deepEqual(e.map(x=>x.id), ['C01','C02','C04','C08'])
  assert.ok(e.every(x=>x.status === 'pending' && x.value === null))
})
test('zero is valid, missing values are pending', () => {
  assert.equal(evidenceText(getMorphologyEvidence(make())[3]), '0%')
  for (const value of [null, undefined, NaN, '0']) assert.equal(getMorphologyEvidence(make({value}))[3].status, 'pending')
})
test('source and method are required; demo stays demo', () => {
  for (const fields of [{source:null},{source:'model'},{method:''},{unit:null}]) assert.equal(getMorphologyEvidence(make(fields))[3].status,'pending')
  assert.equal(getMorphologyEvidence(make({source:'demo'}))[3].sourceLabel,'演示数据')
  assert.equal(evidenceText(getMorphologyEvidence(make({status:'unreadable'}))[3]),'图像不可判读')
})
test('unknown schema and unsupported dimensions are ignored', () => {
  const r=make();r.evidenceSchemaVersion=2
  assert.ok(getMorphologyEvidence(r).every(e=>e.status==='pending'))
  assert.equal(getMorphologyEvidence({evidenceSchemaVersion:1,morphologyEvidence:[{id:'C05',status:'recorded'}]}).length,4)
})
test('region must belong to this image and fit normalized bounds', () => {
  const record={image:{id:'image-A'}}
  const e={status:'recorded',region:{imageId:'image-A',source:'manual_review',box:[.1,.2,.3,.4]}}
  assert.deepEqual(linkedRegion(record,e),[.1,.2,.3,.4])
  assert.equal(linkedRegion({image:{id:'image-B'}},e),null)
  assert.equal(linkedRegion(record,{...e,region:{...e.region,box:[.9,0,.3,1]}}),null)
  assert.equal(linkedRegion(record,{...e,status:'pending'}),null)
})
test('explicit built-in examples keep their provenance and never fill unknown cases', () => {
  const record = { evidenceSchemaVersion: 1, morphologyEvidence: makeMorphologyExample(['均一', '清晰、均匀', '连续、完整', 6]) }
  const items = getMorphologyEvidence(record)
  assert.equal(items[0].observation, '均一')
  assert.equal(items[3].value, 6)
  assert.ok(items.every(e => e.source === 'demo' && e.region === null))
  assert.deepEqual(makeMorphologyExample(), [])
  assert.ok(getMorphologyEvidence({grade:'grade1'}).every(e=>e.status==='pending'))
})
