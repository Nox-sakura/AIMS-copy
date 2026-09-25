/**
 * CaseAgent.jsx — 案例分析 Agent 页面
 * 左右分栏：CaseImagePanel（40%）+ AgentChatPanel（60%）
 */
import { useState, useEffect } from 'react'
import CaseImagePanel from '@/components/education/CaseImagePanel'
import AgentChatPanel from '@/components/education/AgentChatPanel'
import { useEducation } from './EducationLayout'

export default function CaseAgent() {
  const { cases, setCurrentCase } = useEducation()
  const [activeCaseIndex, setActiveCaseIndex] = useState(0)

  useEffect(() => {
    if (cases.length > 0) {
      setCurrentCase(cases[activeCaseIndex])
    }
  }, [activeCaseIndex, cases]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentCase = cases[activeCaseIndex] ?? null

  const handlePrev = () => setActiveCaseIndex(i => Math.max(0, i - 1))
  const handleNext = () => setActiveCaseIndex(i => Math.min(cases.length - 1, i + 1))

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      {/* 左栏：图像面板 */}
      <div className="w-full md:w-2/5 flex-shrink-0">
        <CaseImagePanel
          caseData={currentCase}
          onPrev={handlePrev}
          onNext={handleNext}
          showNavigation={true}
        />
      </div>

      {/* 右栏：Agent 对话 */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm min-h-[480px]">
        {currentCase && <AgentChatPanel caseData={currentCase} />}
      </div>
    </div>
  )
}
