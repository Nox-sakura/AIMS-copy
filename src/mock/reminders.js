/**
 * reminders.js — 患者提醒 Mock 数据
 *
 * 字段说明：
 *   type      — 'medication' 用药提醒 | 'followup' 随访提醒 | 'rest' 休养提醒
 *   times     — 提醒时间数组，格式 'HH:mm'
 *   active    — true 有效 | false 已过期（endDate < today）
 */
export const reminders = [
  {
    id: 'RMD-001',
    patientId: 'P-2024-0001',
    type: 'medication',
    title: '黄体酮注射',
    detail: '每日肌注黄体酮注射液，剂量由主治医师确认，注射后平卧30分钟。',
    times: ['08:00', '20:00'],
    startDate: '2026-03-25',
    endDate: '2026-04-15',
    active: true,
  },
  {
    id: 'RMD-002',
    patientId: 'P-2024-0001',
    type: 'followup',
    title: '移植后随访',
    detail: '移植后第14天来院抽血验孕，请勿剧烈运动，保持良好心态。',
    times: ['09:00'],
    startDate: '2026-04-08',
    endDate: '2026-04-08',
    active: true,
  },
  {
    id: 'RMD-003',
    patientId: 'P-2024-0002',
    type: 'rest',
    title: '术后休养',
    detail: '取卵术后建议卧床休息24小时，避免剧烈运动，如有腹痛及时联系诊所。',
    times: [],
    startDate: '2026-03-20',
    endDate: '2026-03-22',
    active: false,
  },
  {
    id: 'RMD-004',
    patientId: 'P-2024-0003',
    type: 'medication',
    title: '促性腺激素注射',
    detail: '每晚固定时间自行皮下注射，如注射部位出现明显肿痛请及时联系护士。',
    times: ['21:00'],
    startDate: '2026-03-28',
    endDate: '2026-04-05',
    active: true,
  },
]
