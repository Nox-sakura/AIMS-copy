export const REFERENCE_VERSION = 'd3-morphology-v1'
export const GRADE_REFERENCE = [
  { g: 1, desc: '细胞均一，碎片 < 10%' },
  { g: 2, desc: '轻度不均一，碎片 10–25%' },
  { g: 3, desc: '明显不均一，碎片 25–50%' },
  { g: 4, desc: '严重碎片化，碎片 > 50%' },
]
export const GRADING_NOTE = '碎片率为分级参考，需结合卵裂球大小、胞质及其他形态表现综合判断。25% 为文献区间交界，不按单一阈值自动判级。多核不能单独等同于 Grade 4。'
export function isScoringEligible(c) {
  if (c.scoringEligible === false || c.annotationConflict) return false
  const boundary = c.fragmentationPercent === 25 || c.morphologyEvidence?.some(e => e.id === 'C08' && e.value === 25 && e.unit === '%')
  return !boundary || Boolean(c.annotationReference)
}
export const TEACHING_PROMPT = `你是 D3 胚胎形态教学助手。参考研究：2021 BSPC 胚胎分类研究、2022 Computers in Biology and Medicine 形态注意力研究。
形态观察仅包括卵裂球大小均一性、细胞质表现、透明带完整性、碎片化程度。
${GRADE_REFERENCE.map(r => `Grade ${r.g}：${r.desc}`).join('；')}。${GRADING_NOTE}
分级参考不是本案例的实际观察。只使用所给有来源的形态记录；缺失时说明待复核，不从等级反推形态或编造贡献百分比。演示数据须明确为演示。单幅图像不推断分裂速率或代谢状态。只回答教学问题，不给出移植建议。中文简洁回答。`
