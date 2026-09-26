// 案例首轮教学反馈只引用已有人工分级与分级参考，不从静态图像补造观察值。
const GRADE_REFERENCES = {
  1: 'Grade 1 通常参考碎片率 <10%，并结合卵裂球大小均一性判断。',
  2: 'Grade 2 通常参考碎片率 10–25%，可伴轻度卵裂球大小不均。',
  3: 'Grade 3 通常参考碎片率 25–50%，形态不均一往往更明显。',
  4: 'Grade 4 通常参考碎片率 >50%，还需综合其他严重形态异常。',
}

const CASE_ANSWER_POINTS = {
  'TC-001': '对称性与透明带完整性可作为形态观察线索，但不能由此反推该图的具体碎片率；仍需单独判读碎片。',
  'TC-002': '可描述细胞质是否清晰、均匀及有无明显颗粒；膜边界表现不能单独决定细胞质质量或胚胎等级。',
  'TC-003': '卵裂球边界可以观察，但单张 Day 3 图像不能测得分裂速率；分级应回到均一性与碎片化等可见形态。',
  'TC-004': '卵裂球大小和对称性有助于形态判断；透明带完整性可一并记录，不能单凭这两项确定等级。',
  'TC-005': '排列与细胞质清晰度可以记录为形态观察；单张图像不能证明分裂速度，也不能据此预测后续发育结局。',
  'TC-006': '卵裂球大小是否均一可以比较；“卵裂延迟”需要时间信息，不能仅由一张静态图像确认。',
  'TC-007': '细胞质颗粒表现可供复核，但单张图像不能测出分裂速率；不要把速度作为本案例定级的既定证据。',
  'TC-008': '排列及大小差异可以观察；“代谢残余”和卵裂延迟不能凭单张图像确证，应回到可见形态。',
  'TC-009': '区分 Grade 1 与 Grade 2 时，可重点核对碎片率区间和卵裂球均一性；单张图像无法比较分裂速率。',
  'TC-010': '细胞大小轻度不均更接近 Grade 2 的形态描述；细胞质颗粒表现可辅助观察，碎片率仍需另行判读。',
  'TC-011': '空泡若清晰可见，可作为形态记录；所谓“分裂停滞”需要连续观察，不能用单张图像确认。',
  'TC-012': '细胞边界和细胞质表现可辅助区分，但不是单独的定级阈值；应结合碎片化程度及卵裂球均一性复核。',
  'TC-013': '膜边界、空泡及局部膨胀若可见，可以分别描述；不要把其中任何一项当成 Grade 3 的唯一依据。',
  'TC-014': '细胞质颜色或颗粒分布只能作为辅助观察；区分 Grade 2 与 Grade 3 仍需综合碎片率和卵裂球形态。',
  'TC-015': '空泡及细胞形态可以记录，但单张图像不能证实分裂停滞；应依据可见形态复核人工分级。',
  'TC-016': '细胞边界不清及膜完整性变化可记录；单张图像不能推出“完全停止发育”或后续结局。',
  'TC-017': '需区分空泡与细胞外碎片，并结合整体形态判断；不能仅凭细胞排列紊乱给出等级。',
  'TC-018': '单张图像不能确诊细胞凋亡；Grade 3 与 Grade 4 的边界应重点核对碎片化程度及严重形态异常。',
  'TC-019': '“发育停滞”需要时间序列佐证；可讨论膜边界和细胞排列，但不能据此断言胚胎失去发育潜能。',
  'TC-020': '卵裂球数目和形态可以观察；空泡或颗粒表现不能直接证明细胞质降解，应综合可见形态复核。',
}

function getSubmittedGrade(answer) {
  const chineseDigits = { 一: 1, 二: 2, 三: 3, 四: 4 }
  const grades = new Set(
    [...answer.matchAll(/grade\s*([1-4])\b|([1-4一二三四])级(?:胚胎)?/gi)]
      .map(match => Number(chineseDigits[match[2]] ?? match[1] ?? match[2]))
  )
  return grades.size === 1 ? [...grades][0] : null
}

export function getCasePresetReply(caseData, answer = '') {
  const grade = caseData.humanLabel.grade
  const reference = GRADE_REFERENCES[grade] ?? '请结合卵裂球均一性与碎片化程度复核。'
  const point = CASE_ANSWER_POINTS[caseData.id] ?? '请依据可见形态逐项记录，不要仅凭单一特征定级。'
  const submittedGrade = getSubmittedGrade(answer)
  const gradeFeedback = submittedGrade == null ? ''
    : submittedGrade === grade
      ? `你给出的 Grade ${submittedGrade} 与人工标注一致。`
      : `你给出的 Grade ${submittedGrade} 与人工标注不同。`
  return `${gradeFeedback}本案例人工标注为 Grade ${grade}。${reference}${point}如需进一步讨论判断依据，可以继续追问。`
}
