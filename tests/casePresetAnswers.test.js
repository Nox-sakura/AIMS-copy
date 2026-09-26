import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getCasePresetReply } from '../src/components/education/casePresetAnswers.js'

const cases = JSON.parse(readFileSync(new URL('../src/mock/trainingCases.json', import.meta.url), 'utf8'))

test('每个案例都有与人工等级一致的首轮参考答复', () => {
  assert.equal(cases.length, 20)
  const replies = cases.map(caseData => getCasePresetReply(caseData))
  assert.equal(new Set(replies).size, cases.length)
  for (const [index, caseData] of cases.entries()) {
    assert.match(replies[index], new RegExp(`人工标注为 Grade ${caseData.humanLabel.grade}`))
    assert.match(replies[index], /继续追问/)
  }
})

test('首轮分级反馈只比较明确且唯一的学员等级', () => {
  const caseData = cases.find(item => item.id === 'TC-006')
  assert.match(getCasePresetReply(caseData, '我认为二级胚胎'), /与人工标注一致/)
  assert.match(getCasePresetReply(caseData, '我认为 Grade 1'), /与人工标注不同/)
  assert.doesNotMatch(getCasePresetReply(caseData, 'Grade 1 和 Grade 2 如何区分？'), /你给出的 Grade/)
})
