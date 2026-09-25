/**
 * ReminderManager.jsx — 提醒列表展示 + 新建/编辑/删除/发送
 *
 * Props: { patientId, onReminderChange }
 *
 * 提醒类型：medication 用药提醒 | followup 随访提醒 | rest 休养提醒
 */
import { useState, useEffect } from 'react'
import { Edit2, Trash2, Send, Plus, X, Clock, Check } from 'lucide-react'
import { reminders } from '../../mock/reminders'
import { tool_send_reminder_notification } from './agentToolsPatient'
import { useAppContext } from '../../context/AppContext'

const TYPE_META = {
  medication: { icon: '💊', label: '用药提醒' },
  followup:   { icon: '🏥', label: '随访提醒' },
  rest:        { icon: '🛏', label: '休养提醒' },
}

const EMPTY_FORM = {
  type: 'medication',
  title: '',
  detail: '',
  startDate: '',
  endDate: '',
  times: [],
}

export default function ReminderManager({ patientId, onReminderChange, prefillDraft, onDraftConsumed }) {
  const { currentUser } = useAppContext()

  const [list, setList]                   = useState([])
  const [isModalOpen, setIsModalOpen]     = useState(false)
  const [editingId, setEditingId]         = useState(null)
  const [formData, setFormData]           = useState(EMPTY_FORM)
  const [timeInput, setTimeInput]         = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [sentSet, setSentSet]             = useState(new Set())
  const [sendingId, setSendingId]         = useState(null)

  // 当 patientId 变化时重新过滤列表
  useEffect(() => {
    refreshList()
  }, [patientId]) // eslint-disable-line react-hooks/exhaustive-deps

  // 接收来自 PatientAgentChat 的草稿预填
  useEffect(() => {
    if (prefillDraft) {
      openModal(null, prefillDraft)
      onDraftConsumed?.()
    }
  }, [prefillDraft]) // eslint-disable-line react-hooks/exhaustive-deps

  function refreshList() {
    const filtered = reminders.filter(r => r.patientId === patientId)
    setList([...filtered])
  }

  function openModal(reminder, draft) {
    if (reminder) {
      setEditingId(reminder.id)
      setFormData({
        type:      reminder.type,
        title:     reminder.title,
        detail:    reminder.detail,
        startDate: reminder.startDate,
        endDate:   reminder.endDate,
        times:     [...reminder.times],
      })
    } else if (draft) {
      setEditingId(null)
      setFormData({
        type:      draft.type ?? 'medication',
        title:     draft.title ?? '',
        detail:    draft.detail ?? '',
        startDate: draft.startDate ?? new Date().toISOString().slice(0, 10),
        endDate:   draft.endDate ?? '',
        times:     draft.times ? [...draft.times] : [],
      })
    } else {
      setEditingId(null)
      setFormData({ ...EMPTY_FORM, startDate: new Date().toISOString().slice(0, 10) })
    }
    setTimeInput('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setTimeInput('')
  }

  function handleField(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function addTime() {
    const t = timeInput.trim()
    if (!t || formData.times.includes(t)) return
    setFormData(prev => ({ ...prev, times: [...prev.times, t] }))
    setTimeInput('')
  }

  function removeTime(t) {
    setFormData(prev => ({ ...prev, times: prev.times.filter(x => x !== t) }))
  }

  function handleSubmit() {
    if (!formData.title.trim() || !formData.detail.trim()) return

    const today = new Date().toISOString().slice(0, 10)
    const active = !formData.endDate || formData.endDate >= today

    if (editingId) {
      const idx = reminders.findIndex(r => r.id === editingId)
      if (idx !== -1) {
        reminders[idx] = { ...reminders[idx], ...formData, active }
      }
    } else {
      reminders.unshift({
        id: 'RMD-' + Date.now(),
        patientId,
        active,
        ...formData,
      })
    }

    refreshList()
    onReminderChange?.()
    closeModal()
  }

  function handleDelete(id) {
    const idx = reminders.findIndex(r => r.id === id)
    if (idx !== -1) reminders.splice(idx, 1)
    setDeleteConfirmId(null)
    refreshList()
    onReminderChange?.()
  }

  async function handleSend(reminder) {
    if (sendingId) return
    setSendingId(reminder.id)
    await tool_send_reminder_notification(reminder.id, reminder.patientId, currentUser)
    setSentSet(prev => new Set([...prev, reminder.id]))
    setSendingId(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-medical-text">提醒管理</h3>
        <button
          onClick={() => openModal(null, null)}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-medical-blue text-white rounded-lg hover:bg-medical-blue-dark transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          新建提醒
        </button>
      </div>

      {/* 提醒列表 */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {!patientId && (
          <p className="text-xs text-medical-muted text-center py-8">请先在右侧选择患者</p>
        )}
        {patientId && list.length === 0 && (
          <p className="text-xs text-medical-muted text-center py-8">暂无提醒记录</p>
        )}
        {list.map(r => {
          const meta = TYPE_META[r.type] ?? { icon: '📋', label: r.type }
          const isSent = sentSet.has(r.id)
          return (
            <div
              key={r.id}
              className="bg-white border border-medical-border rounded-xl p-3 relative"
            >
              {/* 操作按钮组 */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                <button
                  onClick={() => openModal(r, null)}
                  className="p-1 text-medical-muted hover:text-medical-blue transition-colors"
                  title="编辑"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {deleteConfirmId === r.id ? (
                  <>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-1"
                    >
                      确认删除
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="text-xs text-medical-muted hover:text-medical-text px-1"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(r.id)}
                    className="p-1 text-medical-muted hover:text-red-500 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleSend(r)}
                  disabled={!!sendingId}
                  className={`p-1 transition-colors ${isSent ? 'text-green-500' : 'text-medical-muted hover:text-medical-blue'}`}
                  title={isSent ? '已推送' : '推送到患者小程序'}
                >
                  {isSent ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* 卡片内容 */}
              <div className="pr-24">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">{meta.icon}</span>
                  <span className="text-xs text-medical-muted">{meta.label}</span>
                  <span className={`text-xs ml-1 px-1.5 py-0.5 rounded-full ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {r.active ? '有效' : '已过期'}
                  </span>
                </div>
                <p className="text-sm font-medium text-medical-text mb-0.5">{r.title}</p>
                <p className="text-xs text-medical-muted leading-relaxed mb-2">{r.detail}</p>

                {/* 时间 badges */}
                {r.times.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {r.times.map(t => (
                      <span key={t} className="inline-flex items-center gap-0.5 text-xs bg-medical-blue-light text-medical-blue px-2 py-0.5 rounded-full">
                        <Clock className="w-2.5 h-2.5" />
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* 日期范围 */}
                <p className="text-xs text-medical-muted">
                  {r.startDate}{r.endDate && r.endDate !== r.startDate ? ` ~ ${r.endDate}` : ''}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* 新建/编辑弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-medical-border">
              <h3 className="text-sm font-semibold text-medical-text">
                {editingId ? '编辑提醒' : '新建提醒'}
              </h3>
              <button onClick={closeModal} className="p-1 text-medical-muted hover:text-medical-text">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* 类型选择 */}
              <div>
                <p className="text-xs font-medium text-medical-text mb-2">提醒类型</p>
                <div className="flex gap-2">
                  {Object.entries(TYPE_META).map(([key, meta]) => (
                    <button
                      key={key}
                      onClick={() => handleField('type', key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs transition-colors ${
                        formData.type === key
                          ? 'border-medical-blue bg-medical-blue-light text-medical-blue font-medium'
                          : 'border-medical-border text-medical-muted hover:border-medical-blue'
                      }`}
                    >
                      <span>{meta.icon}</span>
                      <span>{meta.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 标题 */}
              <div>
                <label className="text-xs font-medium text-medical-text block mb-1">标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => handleField('title', e.target.value)}
                  placeholder="请输入提醒标题"
                  className="input-field"
                />
              </div>

              {/* 详情 */}
              <div>
                <label className="text-xs font-medium text-medical-text block mb-1">详情 *</label>
                <textarea
                  value={formData.detail}
                  onChange={e => handleField('detail', e.target.value)}
                  placeholder="请输入提醒详细内容"
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              {/* 日期范围 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-medical-text block mb-1">开始日期</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => handleField('startDate', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-medical-text block mb-1">结束日期</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    min={formData.startDate}
                    onChange={e => handleField('endDate', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* 提醒时间 */}
              <div>
                <label className="text-xs font-medium text-medical-text block mb-1">提醒时间</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="time"
                    value={timeInput}
                    onChange={e => setTimeInput(e.target.value)}
                    className="input-field flex-1"
                  />
                  <button
                    onClick={addTime}
                    className="px-3 py-2 bg-medical-blue-light text-medical-blue rounded-lg text-xs hover:bg-medical-blue hover:text-white transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.times.map(t => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 text-xs bg-medical-blue-light text-medical-blue px-2.5 py-1 rounded-full cursor-pointer hover:bg-red-100 hover:text-red-500 transition-colors"
                      onClick={() => removeTime(t)}
                      title="点击删除"
                    >
                      <Clock className="w-2.5 h-2.5" />
                      {t}
                      <X className="w-2.5 h-2.5" />
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 px-5 py-4 border-t border-medical-border">
              <button
                onClick={closeModal}
                className="flex-1 py-2 text-sm border border-medical-border rounded-lg text-medical-muted hover:text-medical-text transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.title.trim() || !formData.detail.trim()}
                className="flex-1 py-2 text-sm bg-medical-blue text-white rounded-lg hover:bg-medical-blue-dark transition-colors disabled:opacity-50"
              >
                {editingId ? '保存修改' : '创建提醒'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
