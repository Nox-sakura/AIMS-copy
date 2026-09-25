import { REFERENCE_VERSION } from '../../constants/gradingReference'
/**
 * EducationLayout.jsx — 医教智能体模块容器组件
 *
 * 提供：
 *   - EducationContext（cases / currentCase / learningRecord / updateLearningRecord）
 *   - EducationHeader（标题 + 免责声明徽章）
 *   - EducationTabs（案例分析 Agent / 胚胎评估训练场）
 *   - <Outlet />（子页面）
 */
import { createContext, useContext, useState, useEffect } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { GraduationCap, MessageSquare, Dumbbell, AlertTriangle } from 'lucide-react'
import trainingCases from '@/mock/trainingCases.json'
import { logEducationAction, EDUCATION_ACTIONS, setEducationLogHandler } from '@/utils/educationLogger'
import { useAuth } from '@/context/AppContext'
import { useAppContext } from '@/context/AppContext'

/* ── EducationContext ── */
export const EducationContext = createContext(null)

export function useEducation() {
  const ctx = useContext(EducationContext)
  if (!ctx) throw new Error('useEducation must be used within EducationLayout')
  return ctx
}

/* ── Header ── */
function EducationHeader() {
  return (
    <div className="flex justify-between items-center border-b px-6 py-4 bg-white flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50">
          <GraduationCap className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1
            style={{ fontFamily: 'Outfit, sans-serif' }}
            className="text-xl font-semibold text-gray-900 tracking-tight"
          >
            医教智能体
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            形态分级辅助教学平台 · Day 3 卵裂期胚胎
          </p>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5
                       border border-orange-300 text-orange-700 bg-orange-50
                       rounded-full text-xs font-medium">
        <AlertTriangle className="w-3 h-3" />
        本模块仅供教学练习，不构成临床诊断依据
      </span>
    </div>
  )
}

/* ── Tabs ── */
function EducationTabs() {
  const tabs = [
    { to: '/education/case-agent', icon: MessageSquare, label: '案例分析 Agent' },
    { to: '/education/training',   icon: Dumbbell,      label: '胚胎评估训练场' },
  ]
  return (
    <div className="border-b bg-white px-6 flex-shrink-0">
      <div className="flex">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}>
            {({ isActive }) => (
              <div className={`flex items-center gap-2 px-4 py-3 text-sm font-medium
                               border-b-2 transition-colors duration-150
                               ${isActive
                                 ? 'border-blue-600 text-blue-700'
                                 : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

/* ── EducationLayout ── */
export default function EducationLayout() {
  const { user: currentUser } = useAuth()
  const { addLog } = useAppContext()
  const [currentCase, setCurrentCase] = useState(null)
  const [learningRecord, setLearningRecord] = useState({})

  // 注册日志处理器
  useEffect(() => {
    setEducationLogHandler(addLog)
  }, [addLog])

  // 进入模块时记录日志
  useEffect(() => {
    logEducationAction(currentUser?.id ?? 'unknown', EDUCATION_ACTIONS.ENTER_MODULE, {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateLearningRecord = (caseId, userGrade) => {
    const record = {
      submitted: true,
      referenceVersion: REFERENCE_VERSION,
      userGrade,
      timestamp: new Date().toISOString(),
    }
    setLearningRecord(prev => ({ ...prev, [caseId]: record }))
    logEducationAction(currentUser?.id ?? 'unknown', EDUCATION_ACTIONS.SUBMIT_ANSWER, {
      caseId,
      userGrade,
    })
  }

  return (
    <EducationContext.Provider value={{
      cases: trainingCases,
      currentCase,
      setCurrentCase,
      learningRecord,
      updateLearningRecord,
    }}>
      <div className="flex flex-col h-full">
        <EducationHeader />
        <EducationTabs />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </EducationContext.Provider>
  )
}
