/**
 * PatientAgentChat.jsx — 面向医生的患者管理智能体对话区
 *
 * Props: { selectedPatientId, selectedPatient, onOpenReminder }
 *
 * 意图解析为 rule-based，无需额外 API 调用。
 * 所有写操作（创建提醒/发送通知）需医生主动点击确认，智能体不自动执行。
 */
import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Zap, Edit3 } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import AgentResultCard from '../agent/AgentResultCard'
import {
  tool_get_reminders,
  tool_get_reports,
  tool_search_patients,
  tool_generate_reminder_draft,
  tool_send_reminder_notification,
  tool_chat,
  tool_create_reminder,
} from './agentToolsPatient'
import { useNavigate } from 'react-router-dom'

const QUICK_COMMANDS = [
  '为当前患者生成用药提醒草稿',
  '为当前患者生成随访提醒草稿',
  '查看当前患者的所有提醒',
  '查询当前患者的评估报告',
  '发送今日所有待推送提醒',
]

const WELCOME_MSG = {
  id: 'welcome',
  role: 'assistant',
  type: 'text',
  content: '您好！我是患者管理助手。请先在左侧选择患者，然后可以：生成提醒草稿、查询报告、管理随访计划。',
}

function hasAny(str, ...keywords) {
  return keywords.some(kw => str.includes(kw))
}

export default function PatientAgentChat({ selectedPatientId, selectedPatient, onOpenReminder }) {
  const { currentUser } = useAppContext()
  const navigate = useNavigate()

  const [messages, setMessages]       = useState([WELCOME_MSG])
  const [isLoading, setIsLoading]     = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [inputText, setInputText]     = useState('')
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // 当选中患者变化时，注入提示消息
  useEffect(() => {
    if (selectedPatient) {
      addAssistantText(`已切换到患者 ${selectedPatient.name}（${selectedPatient.id}），可以开始查询或生成提醒。`)
    }
  }, [selectedPatientId]) // eslint-disable-line react-hooks/exhaustive-deps

  function addAssistantText(text) {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      role: 'assistant',
      type: 'text',
      content: text,
    }])
  }

  function addAssistantCard(cardType, data) {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      role: 'assistant',
      type: 'card',
      cardType,
      content: data,
    }])
  }

  function addReminderDraft(draft) {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      role: 'assistant',
      type: 'reminder_draft',
      content: draft,
    }])
  }

  function addUserMessage(text) {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      role: 'user',
      type: 'text',
      content: text,
    }])
  }

  function getPatientContext() {
    if (!selectedPatient) return ''
    return `姓名：${selectedPatient.name}，年龄：${selectedPatient.age}岁，主治医师：${selectedPatient.doctor}`
  }

  async function handleSend(text) {
    const msg = (text ?? inputText).trim()
    if (!msg || isLoading) return
    setInputText('')
    addUserMessage(msg)
    setIsLoading(true)

    const lower = msg.toLowerCase()
    const pid = selectedPatientId

    try {
      // ── 意图解析 ──
      if (hasAny(lower, '用药提醒') && hasAny(lower, '生成', '草稿', '创建')) {
        if (!pid) { addAssistantText('请先在左侧选择患者。'); return }
        setLoadingText('正在生成用药提醒草稿…')
        const draft = await tool_generate_reminder_draft('medication', pid, currentUser)
        addReminderDraft(draft)
      }

      else if (hasAny(lower, '随访提醒') && hasAny(lower, '生成', '草稿', '创建')) {
        if (!pid) { addAssistantText('请先在左侧选择患者。'); return }
        setLoadingText('正在生成随访提醒草稿…')
        const draft = await tool_generate_reminder_draft('followup', pid, currentUser)
        addReminderDraft(draft)
      }

      else if (hasAny(lower, '提醒') && hasAny(lower, '查看', '所有', '列表')) {
        if (!pid) { addAssistantText('请先在左侧选择患者。'); return }
        setLoadingText('正在查询提醒列表…')
        const list = await tool_get_reminders(pid, currentUser)
        if (list.length === 0) {
          addAssistantText('该患者暂无提醒记录。')
        } else {
          addAssistantText(`找到 ${list.length} 条提醒记录：`)
          list.forEach(r => {
            const typeMap = { medication: '💊 用药提醒', followup: '🏥 随访提醒', rest: '🛏 休养提醒' }
            addAssistantText(`${typeMap[r.type] ?? r.type} · ${r.title} · ${r.startDate}～${r.endDate || '无限期'} · ${r.active ? '有效' : '已过期'}`)
          })
        }
      }

      else if (hasAny(lower, '报告', '评估') && pid) {
        setLoadingText('正在查询评估报告…')
        const reports = await tool_get_reports(pid, currentUser)
        if (reports.length === 0) {
          addAssistantText('该患者暂无评估报告。')
        } else {
          addAssistantCard('report_list', reports)
        }
      }

      else if (hasAny(lower, '发送') && hasAny(lower, '提醒', '通知')) {
        if (!pid) { addAssistantText('请先在左侧选择患者。'); return }
        setLoadingText('正在发送提醒通知…')
        const list = await tool_get_reminders(pid, currentUser)
        const active = list.filter(r => r.active)
        if (active.length === 0) {
          addAssistantText('当前患者没有有效提醒可发送。')
        } else {
          addAssistantText(`将发送 ${active.length} 条有效提醒，请逐条点击提醒卡片右上角的发送图标进行确认推送。`)
        }
      }

      else if (/P-\d{4}-\d{4}/.test(msg)) {
        setLoadingText('正在搜索患者…')
        const match = msg.match(/P-\d{4}-\d{4}/)
        const results = await tool_search_patients(match[0], currentUser)
        if (results.length === 0) {
          addAssistantText('未找到匹配患者。')
        } else {
          addAssistantCard('patient_list', results)
        }
      }

      else {
        setLoadingText('正在思考…')
        const reply = await tool_chat(msg, getPatientContext(), currentUser)
        addAssistantText(reply)
      }
    } catch (err) {
      addAssistantText(
        err?.message?.includes('未配置')
          ? '豆包 API Key 未配置，请联系管理员在 .env 文件中设置 DOUBAO_API_KEY。'
          : err?.message?.includes('401')
          ? 'API 鉴权失败，请检查豆包 API Key 是否正确。'
          : '网络请求失败，请稍后重试。（' + (err?.message ?? '未知错误') + '）'
      )
      console.error('[PatientAgentChat]', err)
    } finally {
      setIsLoading(false)
      setLoadingText('')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 快捷指令 */}
      <div className="flex-shrink-0 flex flex-wrap gap-1.5 mb-3">
        {QUICK_COMMANDS.map(cmd => (
          <button
            key={cmd}
            onClick={() => handleSend(cmd)}
            disabled={isLoading}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 border border-medical-border rounded-full text-medical-muted hover:border-medical-blue hover:text-medical-blue transition-colors disabled:opacity-40"
          >
            <Zap className="w-2.5 h-2.5" />
            {cmd}
          </button>
        ))}
      </div>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {messages.map(m => (
          <MessageBubble
            key={m.id}
            message={m}
            onNavigate={path => navigate(path)}
            onEditDraft={draft => onOpenReminder?.(draft)}
            onDirectCreate={async (draft) => {
              const created = await tool_create_reminder({ ...draft, patientId: selectedPatientId }, currentUser)
              await tool_send_reminder_notification(created.id, selectedPatientId, currentUser)
              addAssistantText(`提醒「${created.title}」已创建并推送到患者小程序。`)
            }}
          />
        ))}

        {/* 加载状态 */}
        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-medical-blue-light border border-medical-border flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-medical-blue" />
            </div>
            <div className="bg-white border border-medical-border px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-medical-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-medical-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-medical-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                {loadingText && <span className="text-xs text-medical-muted">{loadingText}</span>}
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 输入栏 */}
      <div className="flex-shrink-0 flex gap-2 border-t border-medical-border pt-3">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={selectedPatientId ? '输入指令或问题…' : '请先在左侧选择患者'}
          disabled={isLoading}
          className="input-field flex-1 disabled:opacity-60"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim() || isLoading}
          className="px-4 py-2 bg-medical-blue text-white rounded-lg hover:bg-medical-blue-dark transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

/* ── 消息气泡组件 ── */
function MessageBubble({ message, onNavigate, onEditDraft, onDirectCreate }) {
  const [creating, setCreating] = useState(false)

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-xs bg-medical-blue text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 rounded-full bg-medical-blue-light border border-medical-border flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-medical-blue" />
      </div>
      <div className="flex-1 min-w-0">
        {message.type === 'text' && (
          <div className="bg-white border border-medical-border text-sm text-medical-text px-4 py-2.5 rounded-2xl rounded-bl-sm leading-relaxed shadow-sm">
            {message.content}
          </div>
        )}

        {message.type === 'card' && (
          <AgentResultCard
            type={message.cardType}
            data={message.content}
            onNavigate={onNavigate}
          />
        )}

        {message.type === 'reminder_draft' && (
          <ReminderDraftCard
            draft={message.content}
            creating={creating}
            onEdit={() => onEditDraft?.(message.content)}
            onDirectCreate={async () => {
              setCreating(true)
              await onDirectCreate?.(message.content)
              setCreating(false)
            }}
          />
        )}
      </div>
    </div>
  )
}

/* ── 提醒草稿卡片 ── */
function ReminderDraftCard({ draft, creating, onEdit, onDirectCreate }) {
  const typeMap = { medication: '💊 用药提醒', followup: '🏥 随访提醒', rest: '🛏 休养提醒' }

  return (
    <div className="bg-white border-2 border-medical-blue/30 rounded-xl p-3 shadow-sm">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm">{typeMap[draft.type] ?? '📋 提醒'}</span>
        <span className="text-xs text-medical-muted bg-medical-blue-light text-medical-blue px-2 py-0.5 rounded-full">AI草稿</span>
      </div>
      <p className="text-sm font-semibold text-medical-text mb-1">{draft.title}</p>
      <p className="text-xs text-medical-muted leading-relaxed mb-2">{draft.detail}</p>
      {draft.times?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {draft.times.map(t => (
            <span key={t} className="text-xs bg-medical-blue-light text-medical-blue px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      )}
      <p className="text-xs text-medical-muted mb-3">【草稿仅供参考，需医生确认后创建】</p>
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs border border-medical-blue text-medical-blue rounded-lg hover:bg-medical-blue-light transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          编辑并创建
        </button>
        <button
          onClick={onDirectCreate}
          disabled={creating}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-medical-blue text-white rounded-lg hover:bg-medical-blue-dark transition-colors disabled:opacity-60"
        >
          <Send className="w-3.5 h-3.5" />
          {creating ? '创建中…' : '直接创建并发送'}
        </button>
      </div>
    </div>
  )
}
