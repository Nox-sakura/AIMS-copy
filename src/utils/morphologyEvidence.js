export const MORPHOLOGY_ITEMS = [
  { id: 'C01', name: '卵裂球大小均一性', shortDesc: '观察卵裂球大小是否一致' },
  { id: 'C02', name: '细胞质表现', shortDesc: '观察胞质清晰度及颗粒表现' },
  { id: 'C04', name: '透明带完整性', shortDesc: '观察透明带是否连续完整' },
  { id: 'C08', name: '碎片化程度', shortDesc: '观察碎片化程度，结合其他形态特征复核' },
]
const SOURCES = { manual_review: '人工复核', validated_measurement: '已验证测量', demo: '演示数据' }
export function getMorphologyEvidence(record = {}) {
  return MORPHOLOGY_ITEMS.map(def => {
    const raw = record.evidenceSchemaVersion === 1 && Array.isArray(record.morphologyEvidence)
      ? record.morphologyEvidence.find(e => e.id === def.id) : null
    const valid = raw && SOURCES[raw.source] && typeof raw.method === 'string' && raw.method.trim()
    const observation = valid && typeof raw.observation === 'string' ? raw.observation.trim() : ''
    const numeric = valid && typeof raw.value === 'number' && Number.isFinite(raw.value) && typeof raw.unit === 'string' && raw.unit.trim()
    const status = valid && raw.status === 'unreadable' ? 'unreadable'
      : valid && raw.status === 'recorded' && (observation || numeric) ? 'recorded' : 'pending'
    return { ...def, status, observation: status === 'recorded' ? observation || null : null,
      value: status === 'recorded' && numeric ? raw.value : null,
      unit: status === 'recorded' && numeric ? raw.unit : null,
      source: status !== 'pending' ? raw.source : null,
      sourceLabel: status !== 'pending' ? SOURCES[raw.source] : '暂无来源',
      method: status !== 'pending' ? raw.method : null, region: status === 'recorded' ? raw.region ?? null : null }
  })
}
export function evidenceText(e) {
  if (e.status === 'unreadable') return '图像不可判读'
  if (e.status !== 'recorded') return '待复核'
  return [e.observation, e.value !== null ? `${e.value}${e.unit}` : null].filter(Boolean).join(' · ')
}
export function evidenceSummary(record) {
  return getMorphologyEvidence(record).map(e => `${e.name}：${evidenceText(e)}（${e.sourceLabel}）`).join('；') + '。形态观察与分级结果分别记录，未记录项不能由等级反推。'
}

export function linkedRegion(record, evidence) {
  const region = evidence?.region
  const box = region?.box
  if (evidence?.status !== 'recorded' || !record.image?.id || region?.imageId !== record.image.id || !region?.source || !Array.isArray(box) || box.length !== 4) return null
  if (!box.every(v => Number.isFinite(v) && v >= 0 && v <= 1) || box[2] <= 0 || box[3] <= 0 || box[0] + box[2] > 1 || box[1] + box[3] > 1) return null
  return box
}
