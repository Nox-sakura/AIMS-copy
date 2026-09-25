// 本周每日评估数量（用于 Dashboard AreaChart）
export const weeklyTrend = [
  { day: '周一', assessments: 14, approved: 11 },
  { day: '周二', assessments: 21, approved: 16 },
  { day: '周三', assessments: 17, approved: 14 },
  { day: '周四', assessments: 22, approved: 17 },
  { day: '周五', assessments: 15, approved: 12 },
  { day: '周六', assessments: 6,  approved: 4  },
  { day: '周日', assessments: 3,  approved: 2  },
]

// 近6个月模型与医生一致率（用于 Admin LineChart）
export const monthlyConsistency = [
  { month: '10月', rate: 89.2 },
  { month: '11月', rate: 91.5 },
  { month: '12月', rate: 90.8 },
  { month: '1月',  rate: 92.3 },
  { month: '2月',  rate: 93.1 },
  { month: '3月',  rate: 94.2 },
]

// 本月各 Grade 胚胎数量分布（用于 Admin BarChart，fill 按原有等级配色）
export const gradeDistribution = [
  { grade: '一级胚胎', count: 142, fill: '#AED6F1' },
  { grade: '二级胚胎', count: 178, fill: '#1A6EBD' },
  { grade: '三级胚胎', count: 79,  fill: '#A9DFBF' },
  { grade: '四级胚胎', count: 31,  fill: '#27AE60' },
]

// Dashboard KPI 概览数据
export const kpiStats = [
  {
    label: '今日评估数',
    value: '11',
    unit: '份',
    trend: '+4',
    trendUp: true,
    icon: 'clipboard',
  },
  {
    label: '待复核报告',
    value: '8',
    unit: '份',
    trend: '+2',
    trendUp: false,
    icon: 'clock',
  },
  {
    label: '本月患者数',
    value: '312',
    unit: '人',
    trend: '+28',
    trendUp: true,
    icon: 'users',
  },
  {
    label: '模型一致率',
    value: '91.3',
    unit: '%',
    trend: '+0.8%',
    trendUp: true,
    icon: 'chart',
  },
]
