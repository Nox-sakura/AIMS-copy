/**
 * PatientInfoBar — 多页面顶部患者信息确认栏
 *
 * Props:
 *   patient    {object}  患者对象（来自 patients mock）
 *   assessment {object}  评估对象（可选，用于取卵日期）
 *   cycleNo    {number}  指定周期编号（可选，不传则用 patient.currentCycle）
 *
 * 样式：
 *   背景 #EBF4FF，左侧 4px 主色蓝竖条，高度自适应（约 56px）
 */

import { User, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { users } from '../../mock/users'

/** 从 users 列表按姓名查找职称，返回"姓名（职称）"格式 */
function formatDoctor(name) {
  const found = users.find(u => u.name === name)
  if (found?.title) return `${found.name}（${found.title}）`
  return name
}

/** 将患者姓名格式化为"X女士" */
function formatPatientLabel(name) {
  if (!name) return '患者'
  const family = name.charAt(0)
  return `${family}女士`
}

/** 从 cycles 数组取指定周期的取卵日期（用 startDate 近似） */
function getRetrievalDate(patient, assessment, cycleNo) {
  if (assessment?.retrievalDate) return assessment.retrievalDate
  const cycle = patient?.cycles?.find(c => c.cycleNo === cycleNo)
  return cycle?.startDate ?? '—'
}

export default function PatientInfoBar({ patient, assessment, cycleNo: cycleProp }) {
  const navigate = useNavigate()

  if (!patient) return null

  const cycleNo       = cycleProp ?? assessment?.cycleNo ?? patient.currentCycle
  const retrievalDate = getRetrievalDate(patient, assessment, cycleNo)
  const doctorLabel   = formatDoctor(patient.doctor)

  return (
    <div
      className="relative flex items-center px-4 py-3 rounded-lg"
      style={{ background: '#EBF4FF', borderLeft: '4px solid #1A6EBD' }}
    >
      {/* 左侧图标 */}
      <User size={16} className="shrink-0 mr-2.5" style={{ color: '#1A6EBD' }} />

      {/* 信息内容 */}
      <div className="flex-1 min-w-0">
        {/* 第一行：姓名 | ID | 周期 | 取卵日期 */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-semibold text-sm" style={{ color: '#2C3E50' }}>
            {formatPatientLabel(patient.name)}
          </span>
          <span className="text-gray-400 text-xs select-none">|</span>
          <span className="text-xs" style={{ color: '#4B5563' }}>{patient.id}</span>
          <span className="text-gray-400 text-xs select-none">|</span>
          <span className="text-xs" style={{ color: '#4B5563' }}>
            第 {cycleNo} 周期
          </span>
          <span className="text-gray-400 text-xs select-none">|</span>
          <span className="text-xs" style={{ color: '#4B5563' }}>
            取卵：{retrievalDate}
          </span>
        </div>

        {/* 第二行：医生 | 科室 */}
        <div className="flex flex-wrap items-center gap-x-3 mt-0.5">
          <span className="text-xs" style={{ color: '#6B7280' }}>
            主治医生：
            <span style={{ color: '#2C3E50' }}>{doctorLabel}</span>
          </span>
          <span className="text-xs" style={{ color: '#6B7280' }}>
            {patient.department ?? '生殖医学科'}
          </span>
        </div>
      </div>

      {/* 右侧：返回患者详情链接 */}
      <button
        type="button"
        onClick={() => navigate(`/patients/${patient.id}`)}
        className="ml-4 shrink-0 flex items-center gap-0.5 text-xs font-medium
                   transition-colors hover:underline"
        style={{ color: '#1A6EBD' }}
      >
        返回患者详情
        <ChevronRight size={13} />
      </button>
    </div>
  )
}
