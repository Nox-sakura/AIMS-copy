/**
 * agentTools.js — AI 临床助手工具函数
 *
 * 四个工具函数模拟异步数据查询，每次调用后向 operationLogs 追加日志。
 * 依赖：patients / assessments / concepts / operationLogs（均为 mock 数组）
 */
import { patients } from '../../mock/patients'
import { assessments } from '../../mock/assessments'
import { concepts } from '../../mock/concepts'
import { operationLogs } from '../../mock/operationLogs'
import { MORPHOLOGY_ITEMS, getMorphologyEvidence } from '../../utils/morphologyEvidence'

const ROLE_LABEL = {
  embryologist: '胚胎学家',
  senior: '主任医师',
  admin: '管理员',
}

function appendLog(action, target, currentUser) {
  operationLogs.unshift({
    id: 'LOG-' + Date.now(),
    user: currentUser.name,
    role: ROLE_LABEL[currentUser.role] ?? currentUser.role,
    actionType: 'agent_query',
    action,
    target: String(target),
    time: new Date().toLocaleString('sv'),
    ip: 'AI-Agent',
  })
}

/**
 * 按姓名或 ID 模糊搜索患者
 */
export async function tool_search_patients(query, currentUser) {
  const q = query.toLowerCase()
  const results = patients
    .filter(p => p.name.includes(q) || p.id.toLowerCase().includes(q))
    .map(({ id, name, age, doctor }) => ({ id, name, age, doctor }))
  appendLog('AI助手查询患者信息', query, currentUser)
  return results
}

/**
 * 查询指定患者的评估报告列表
 */
export async function tool_get_reports(patientId, currentUser) {
  const results = assessments
    .filter(a => a.patientId === patientId)
    .map(({ id, embryoNo, grade, status, assessmentDate, doctor }) =>
      ({ id, embryoNo, grade, status, assessmentDate, doctor })
    )
  appendLog('AI助手查询评估报告列表', patientId, currentUser)
  return results
}

/** 保留原有界面和兼容接口。 */
export async function tool_get_report_detail(reportId, currentUser) {
  const assessment = assessments.find(a => a.id === reportId)
  if (!assessment) return null
  const enrichedScores = assessment.conceptScores.map(cs => {
    const concept = concepts.find(c => c.id === cs.id)
    return { ...cs, nameCn: concept?.name ?? cs.id, nameEn: concept?.nameEn ?? cs.id }
  })
  appendLog('AI助手读取报告详情', reportId, currentUser)
  return { ...assessment, conceptScores: enrichedScores }
}

const CHAT_SYSTEM_PROMPT = `你是一名辅助 IVF 胚胎学家的临床智能助手。回答简洁专业，不做最终诊断或移植建议。
讨论 Day 3 胚胎形态分级时，参考碎片率 <10%、10–25%、25–50%、>50% 的四档范围，并结合卵裂球均一性等可见形态；不要仅凭碎片率定级。单张静态图像不能判断分裂速度、代谢状态或妊娠结局。患者与报告查询由页面中的本地查询功能完成，不要声称你已访问未提供的数据。`

/**
 * 通用对话：将用户消息发送给 LLM，返回自然语言回复
 */
export async function tool_chat(userMessage) {
  const response = await fetch('/api/doubao', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'doubao-seed-1-8-251228',
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: CHAT_SYSTEM_PROMPT }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: userMessage }],
        },
      ],
    }),
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`豆包 API 请求失败 (${response.status}): ${err}`)
  }
  const data = await response.json()
  const messageOutput = data.output?.find(o => o.type === 'message')
  return messageOutput?.content?.[0]?.text ?? '暂时无法回复，请稍后重试。'
}

// 浮动助手中两份内置评估记录的参考分；不从旧概念分或模型等级换算。
const COMPARISON_EXAMPLE_SCORES = {
  'ASS-2026-0024': { C01: 94, C02: 90, C04: 95 },
  'ASS-2026-0029': { C01: 76, C02: 83, C04: 92 },
}

/** 对比指定患者本周期的形态观察示例。 */
export async function tool_compare_embryos(patientId, cycleNo, currentUser) {
  const cycleAssessments = assessments.filter(
    a => a.patientId === patientId && a.cycleNo === cycleNo
  )
  const embryos = cycleAssessments.map(a => {
    const fragmentation = getMorphologyEvidence(a).find(e => e.id === 'C08')
    return {
      id: a.id,
      embryoNo: a.embryoNo,
      assessmentDate: a.assessmentDate,
      grade: a.grade,
      confidence: a.confidence,
      comparisonValues: {
        ...COMPARISON_EXAMPLE_SCORES[a.id],
        C08: fragmentation?.status === 'recorded' && fragmentation.unit === '%'
          ? fragmentation.value : null,
      },
    }
  })
  appendLog('AI助手对比周期评估形态观察', `${patientId} 第${cycleNo}周期`, currentUser)
  return {
    patientName: cycleAssessments[0]?.patientName ?? '未知',
    patientId,
    cycleNo,
    comparisonRows: MORPHOLOGY_ITEMS.map(item => ({
      id: item.id,
      name: item.id === 'C08' ? '碎片率' : item.name,
      unit: item.id === 'C08' ? '%' : '分',
    })),
    embryos,
  }
}

const SUMMARY_SYSTEM_PROMPT = `你是一名辅助 IVF 胚胎学家的 AI 助手，只生成评估总结草稿，不做最终诊断。

分级参考（第 3 天卵裂期胚胎）：
- Grade 1：碎片率 <10%，卵裂球较均一
- Grade 2：碎片率 10–25%，可有轻度不均一
- Grade 3：碎片率 25–50%，形态不均一更明显
- Grade 4：碎片率 >50%，严重形态异常；多核须有明确观察依据
分级应综合可见形态，以上区间不是单独的诊断规则。

沿用输入中的既有等级；概念分数是界面参考值，不能当作对本图像的独立实测。没有明确碎片率观测时，不得编造具体百分比。单张静态图像不能确认分裂速度、代谢状态、移植潜力或妊娠结局，也不要据此给出移植建议。

输出格式：自然语言段落，150 字以内，以"本胚胎评估结果为 Grade X，……"开头。
末尾必须附加："【草稿仅供参考，最终结论须由主治医师确认。】"`

/**
 * 调用豆包 API 生成评估总结草稿
 */
export async function tool_generate_summary(reportDetail, currentUser) {
  const conceptList = reportDetail.conceptScores
    .filter(cs => ['C01', 'C02', 'C03', 'C04', 'C08'].includes(cs.id))
    .map(cs => `${cs.nameEn}（${cs.nameCn}）: ${cs.score}`)
    .join('，')

  const userPrompt = `胚胎编号：${reportDetail.embryoNo}
AI评级：${reportDetail.grade}（${reportDetail.gradeLabel}）
形态概念参考分数：${conceptList}

请根据以上信息生成评估总结草稿。`

  const response = await fetch('/api/doubao', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'doubao-seed-1-8-251228',
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: SUMMARY_SYSTEM_PROMPT }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: userPrompt }],
        },
      ],
    }),
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`豆包 API 请求失败 (${response.status}): ${err}`)
  }
  const data = await response.json()
  const messageOutput = data.output?.find(o => o.type === 'message')
  const text = messageOutput?.content?.[0]?.text ?? '无法生成总结，请稍后重试。'
  appendLog('AI助手生成评估总结草稿', reportDetail.id, currentUser)
  return text
}
