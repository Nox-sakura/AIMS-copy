/**
 * DoctorView.jsx — 医生管理视角主页面
 *
 * 左栏（40%）：ReminderManager — 患者选择器 + 提醒列表 + 新建/编辑/删除/发送
 * 右栏（60%）：PatientAgentChat — 智能体对话区
 */
import { useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { patients } from '../../mock/patients'
import ReminderManager from '../../components/patientPortal/ReminderManager'
import PatientAgentChat from '../../components/patientPortal/PatientAgentChat'

export default function DoctorView() {
  const [selectedId, setSelectedId]       = useState('')
  const [searchQuery, setSearchQuery]     = useState('')
  const [dropdownOpen, setDropdownOpen]   = useState(false)
  const [reminderTick, setReminderTick]   = useState(0)
  const [draftToFill, setDraftToFill]     = useState(null)

  const selectedPatient = patients.find(p => p.id === selectedId) ?? null

  const filtered = searchQuery
    ? patients.filter(p =>
        p.name.includes(searchQuery) || p.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : patients

  function handleSelect(patient) {
    setSelectedId(patient.id)
    setSearchQuery('')
    setDropdownOpen(false)
  }

  return (
    <div className="flex h-full gap-0 divide-x divide-medical-border">

      {/* ── 左栏：患者选择器 + 提醒管理 ── */}
      <div className="w-2/5 flex flex-col p-4 overflow-hidden">

        {/* 患者选择器 */}
        <div className="mb-4 relative">
          <p className="text-xs font-medium text-medical-text mb-1.5">选择患者</p>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 border border-medical-border rounded-lg text-sm bg-white hover:border-medical-blue transition-colors"
            >
              <span className={selectedPatient ? 'text-medical-text' : 'text-medical-muted'}>
                {selectedPatient ? `${selectedPatient.name} · ${selectedPatient.id}` : '请选择患者…'}
              </span>
              <ChevronDown className={`w-4 h-4 text-medical-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-medical-border rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="p-2 border-b border-medical-border">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-medical-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="姓名或患者ID…"
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-medical-border rounded-lg focus:outline-none focus:border-medical-blue"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filtered.slice(0, 20).map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSelect(p)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-medical-blue-light text-left transition-colors"
                    >
                      <span className="text-sm font-medium text-medical-text">{p.name}</span>
                      <span className="text-xs text-medical-muted font-mono">{p.id}</span>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-xs text-medical-muted text-center py-4">无匹配结果</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 选中患者简要信息 */}
          {selectedPatient && (
            <div className="mt-2 px-3 py-2 bg-medical-blue-light rounded-lg">
              <p className="text-xs text-medical-text">
                <span className="font-medium">{selectedPatient.name}</span>
                <span className="text-medical-muted ml-2">{selectedPatient.age}岁 · {selectedPatient.doctor}</span>
              </p>
            </div>
          )}
        </div>

        {/* 提醒管理 */}
        <div className="flex-1 overflow-hidden">
          <ReminderManager
            patientId={selectedId}
            onReminderChange={() => setReminderTick(t => t + 1)}
            prefillDraft={draftToFill}
            onDraftConsumed={() => setDraftToFill(null)}
          />
        </div>
      </div>

      {/* ── 右栏：智能体对话 ── */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          <div className="w-6 h-6 rounded-lg bg-medical-blue flex items-center justify-center">
            <span className="text-white text-xs font-bold">AI</span>
          </div>
          <h3 className="text-sm font-semibold text-medical-text">患者管理助手</h3>
          {selectedPatient && (
            <span className="text-xs text-medical-muted ml-auto">
              当前：{selectedPatient.name} · {selectedPatient.id}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <PatientAgentChat
            selectedPatientId={selectedId}
            selectedPatient={selectedPatient}
            onOpenReminder={(draft) => setDraftToFill(draft)}
          />
        </div>
      </div>

      {/* 点击下拉外部时关闭 */}
      {dropdownOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
      )}
    </div>
  )
}
