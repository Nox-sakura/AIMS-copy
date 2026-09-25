/**
 * messages.js — 患者小程序消息 Mock 数据
 *
 * 字段说明：
 *   type      — 'reminder' 提醒消息 | 'report' 报告通知
 *   reportId  — type='report' 时关联报告 ID，否则为 null
 *   read      — 已读状态
 */
export const messages = [
  {
    id: 'MSG-001',
    type: 'reminder',
    title: '黄体酮注射提醒',
    summary: '每日肌注黄体酮注射液，剂量由主治医师确认，注射后平卧30分钟。',
    reportId: null,
    time: '2026-03-25 08:00:00',
    timestamp: 1742860800000,
    read: true,
  },
  {
    id: 'MSG-002',
    type: 'reminder',
    title: '移植后随访提醒',
    summary: '移植后第14天来院抽血验孕，请勿剧烈运动，保持良好心态。',
    reportId: null,
    time: '2026-04-08 09:00:00',
    timestamp: 1744070400000,
    read: false,
  },
]
