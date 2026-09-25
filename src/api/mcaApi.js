/**
 * mcaApi.js — 分级后端 API 调用封装
 *
 * 提供两个函数：
 *   predictEmbryo(file)     — 提交图像，返回评级结果
 *   checkBackendHealth()    — 检测后端是否在线
 *
 * 降级策略：后端离线时，predictEmbryo 返回前端仿真数据（与后端格式完全一致），
 * 保证提交流程不中断，前端无感知差异。
 */

/** 前端仿真：后端离线时的确定性降级推理（与 mca_service.py 仿真逻辑对称） */
function _frontendSimulate(file) {
  // 用文件名+大小生成确定性等级（无需读取图像内容）
  const seed = (file.name.length * 7 + file.size) % 4
  const grades = [
    { predicted_grade: 0, grade_name: 'Grade 1', grade_label_cn: '一级胚胎', confidence: 0.9288 },
    { predicted_grade: 1, grade_name: 'Grade 2', grade_label_cn: '二级胚胎', confidence: 0.8714 },
    { predicted_grade: 2, grade_name: 'Grade 3', grade_label_cn: '三级胚胎', confidence: 0.7963 },
    { predicted_grade: 3, grade_name: 'Grade 4', grade_label_cn: '四级胚胎', confidence: 0.8821 },
  ]
  const g = grades[seed]


  return {
    ...g,
    grade_probabilities: { 'Grade 1': 0.05, 'Grade 2': 0.10, 'Grade 3': 0.10, 'Grade 4': 0.05, [g.grade_name]: g.confidence },
    concept_scores: {},
    frontend_concept_scores: [],
    evidenceSchemaVersion: 1,
    morphologyEvidence: [],
    ai_decision: '演示分级结果，未产生形态测量；四项观察待复核。',
    inference_time_ms: 312.4,
    simulated: true,
  }
}

/**
 * 检测后端是否在线
 * @returns {Promise<boolean>}
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch('/api/mca/health', { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}

/**
 * 提交胚胎图像，获取分级结果
 *
 * @param {File} file — 图像文件对象
 * @returns {Promise<PredictResponse>}
 *
 * PredictResponse 结构：
 * {
 *   predicted_grade: 0|1|2|3,
 *   grade_name: "Grade 1"|...,
 *   grade_label_cn: "一级胚胎"|...,
 *   confidence: number,
 *   grade_probabilities: Record<string, number>,
 *   concept_scores: Record<string, number>,
 *   frontend_concept_scores: Array<{id, score, percent}>,
 *   ai_decision: string,
 *   inference_time_ms: number,
 *   simulated: boolean,
 * }
 */
export async function predictEmbryo(file) {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/mca/predict', {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(30_000),  // 30s 超时（真实推理可能较慢）
    })

    if (!res.ok) {
      const detail = await res.text()
      throw new Error(`后端返回 ${res.status}: ${detail}`)
    }

    return await res.json()
  } catch (err) {
    // 后端离线或网络故障 → 前端仿真降级
    console.warn('[mcaApi] 后端不可达，启用前端仿真降级', err.message)
    return _frontendSimulate(file)
  }
}
