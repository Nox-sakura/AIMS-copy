/**
 * educationLogger.js — 教育模块操作日志工具
 *
 * 使用模式：
 *   1. 在 EducationLayout 挂载时调用 setEducationLogHandler(addLog) 注册处理器
 *   2. 在任意位置调用 logEducationAction(userId, actionType, payload) 写入日志
 */

// 操作类型枚举
export const EDUCATION_ACTIONS = {
  ENTER_MODULE:  'enter_module',   // 进入教育模块
  START_CASE:    'start_case',     // 开始一个训练案例
  SUBMIT_ANSWER: 'submit_answer',  // 提交评估答案
  VIEW_FEEDBACK: 'view_feedback',  // 查看反馈结果
}

const ACTION_LABELS = {
  enter_module:  '进入医教智能体模块',
  start_case:    '开始训练案例',
  submit_answer: '提交评估答案',
  view_feedback: '查看反馈结果',
}

// 模块级日志处理器（由 EducationLayout 注册）
let _addLog = null

/**
 * 注册日志写入处理器
 * @param {Function} fn - AppContext.addLog 函数
 */
export function setEducationLogHandler(fn) {
  _addLog = fn
}

/**
 * 记录教育模块操作日志
 * @param {string} userId - 当前用户 ID
 * @param {string} actionType - 操作类型（EDUCATION_ACTIONS 枚举值）
 * @param {object} payload - 附加数据
 */
export function logEducationAction(userId, actionType, payload = {}) {
  if (!_addLog) return

  const now = new Date()
  const timeStr = now.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).replace(/\//g, '-')

  _addLog({
    user: userId,
    role: '医教智能体',
    actionType: 'education',
    action: ACTION_LABELS[actionType] ?? actionType,
    target: payload.caseId ?? '教育模块',
    time: timeStr,
    ip: '127.0.0.1',
    module: 'education',
    educationActionType: actionType,
    payload,
  })
}
