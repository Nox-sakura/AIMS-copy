/**
 * 消息通知 Mock 数据
 * type: 'info' | 'warning' | 'success' | 'error'
 * read: 是否已读
 * path: 点击通知跳转的路由路径
 */
export const notifications = [
  {
    id:      'N-001',
    type:    'warning',
    message: '评估报告 RPT-2026-0023（张晓燕 · E-03-C）已提交，待您复核。',
    time:    '10分钟前',
    read:    false,
    link:    '/assessment/ASS-2026-0023',
    path:    '/reports',
  },
  {
    id:      'N-002',
    type:    'info',
    message: '新用户注册申请：陈晓明，请管理员审核。',
    time:    '1小时前',
    read:    false,
    link:    '/admin',
    path:    '/admin',
  },
  {
    id:      'N-003',
    type:    'success',
    message: '报告 RPT-2026-0026（赵淑华 · E-01-B）已终审通过，Grade 1。',
    time:    '昨天 16:00',
    read:    false,
    link:    '/assessment/ASS-2026-0026',
    path:    '/reports',
  },
  {
    id:      'N-004',
    type:    'info',
    message: '患者 P-2024-0009 吴佳慧已完成取卵，共获卵 4 枚，评估队列已更新。',
    time:    '昨天 09:30',
    read:    true,
    link:    '/patients/P-2024-0009',
    path:    '/patients',
  },
  {
    id:      'N-005',
    type:    'warning',
    message: '系统计划于今晚 23:00–01:00 进行维护，请及时保存工作内容。',
    time:    '2天前',
    read:    true,
    link:    null,
    path:    '/dashboard',
  },
]
