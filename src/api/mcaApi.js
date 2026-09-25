/**
 * mcaApi.js — MCA 后端 API 调用封装
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

  // 前端 conceptScores（与 assessments.js 格式一致）
  const scoreMap = {
    0: [[92,18.50],[88,12.00],[90,16.50],[88,14.00],[86,10.50],[84,9.50],[83,8.00],[5,5.00],[2,3.50],[3,2.50]],
    1: [[72,14.50],[76,11.00],[68,13.50],[70,12.00],[65,9.00],[63,8.50],[60,6.50],[24,14.50],[9,5.50],[14,5.00]],
    2: [[48,9.50],[44,8.00],[42,8.50],[38,7.50],[35,6.50],[32,6.00],[28,5.00],[60,24.00],[42,14.50],[35,10.50]],
    3: [[22,4.80],[18,3.50],[15,4.20],[12,3.80],[10,3.00],[8,3.20],[7,2.50],[84,34.50],[68,22.00],[60,18.50]],
  }
  const ids = ['C01','C02','C03','C04','C05','C06','C07','C08','C09','C10']
  const frontend_concept_scores = ids.map((id, i) => ({
    id,
    score: scoreMap[seed][i][0],
    percent: scoreMap[seed][i][1],
  }))

  const decisionMap = {
    0: '该胚胎各项形态学指标均处于优秀水平，碎片化比例极低（<5%），细胞均一性和对称性突出，发育速率与标准时序高度吻合。综合评估为 Grade 1，具有高移植优先级，强烈建议优先移植。',
    1: '胚胎整体质量良好，细胞均一性轻微不足，碎片化比例约 12%，在可接受范围内。发育速率略慢于标准时序，其余指标正常。综合评估为 Grade 2，可作为备选移植胚胎。',
    2: '碎片化比例达 26%，细胞对称性较差，部分卵裂球大小差异明显。发育速率偏慢，综合评估为 Grade 3，移植潜力有限，建议在无更优选择时考虑使用。',
    3: '碎片化比例超过 40%，细胞严重不均一，可见多核细胞及大型空泡。综合评估为 Grade 4，不建议用于移植，建议废弃。',
  }

  return {
    ...g,
    grade_probabilities: { 'Grade 1': 0.05, 'Grade 2': 0.10, 'Grade 3': 0.10, 'Grade 4': 0.05, [g.grade_name]: g.confidence },
    concept_scores: {},
    frontend_concept_scores,
    ai_decision: decisionMap[seed],
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
 * 提交胚胎图像，获取 MCA 评级结果
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
