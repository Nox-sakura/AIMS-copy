/**
 * AgentPanel.jsx — AI 临床助手右侧浮动面板
 *
 * 面板始终 mounted，通过 CSS translate-x-full / translate-x-0 控制显隐，保留对话历史。
 * 数据来源：useAppContext()（currentUser / agentOpen / setAgentOpen / assessments）
 * 导航：useNavigate()
 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Send, Bot } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import AgentResultCard from './AgentResultCard'
import {
  tool_search_patients,
  tool_get_reports,
  tool_get_report_detail,
  tool_generate_summary,
  tool_compare_embryos,
  tool_chat,
} from './agentTools'

/* ── 快捷指令配置 ── */
const SHORTCUTS = [
  { label: '查看待复核报告',              fillOnly: false },
  { label: '查看已拒绝的报告',            fillOnly: false },
  { label: '该患者本周期胚胎得分对比',        fillOnly: false },
  { label: '查询患者 P-　报告列表',        fillOnly: true  },
]

/* ── 欢迎消息 ── */
const WELCOME = {
  id: 0,
  role: 'assistant',
  type: 'text',
  content: '您好，我是临床智能助手。我可以帮您查询患者信息、检索评估报告，或对比患者本次周期评估记录的形态观察。请描述您的需求，或点击下方快捷指令开始。',
}

/* ── 意图解析（rule-based，无需额外 API 调用） ── */
function parseIntent(text) {
  const t = text.toLowerCase()

  if (t.includes('待复核') || t.includes('待审核')) {
    return { type: 'pending' }
  }

  if (t.includes('已拒绝') || t.includes('被拒绝') || t.includes('rejected')) {
    return { type: 'rejected' }
  }

  if (t.includes('该患者') || (t.includes('白艳丽') && (t.includes('概念') || t.includes('对比') || t.includes('得分')))) {
    return { type: 'compare_embryos', patientId: 'P-2024-0002', cycleNo: 1 }
  }

  if (t.includes('总结') || t.includes('草稿') || t.includes('生成')) {
    return { type: 'generate_summary' }
  }

  const reportIdMatch = text.match(/(?:ASS|RPT)-[\w-]+/)
  if (reportIdMatch || t.includes('详情')) {
    return { type: 'report_detail', reportId: reportIdMatch ? reportIdMatch[0] : null }
  }

  const patientIdMatch = text.match(/P-\d{4}-\d{4}/)
  if (t.includes('报告') && (t.includes('列表') || t.includes('所有') || t.includes('查看'))) {
    return { type: 'get_reports', patientId: patientIdMatch ? patientIdMatch[0] : null }
  }

  if (patientIdMatch || (t.includes('患者') && (t.includes('查找') || t.includes('找') || t.includes('搜索')))) {
    const query = patientIdMatch ? patientIdMatch[0] : text
    return { type: 'search_patients', query }
  }

  return { type: 'unknown' }
}

export default function AgentPanel() {
  const navigate = useNavigate()
  const { currentUser, agentOpen, setAgentOpen, assessments } = useAppContext()

  const [messages, setMessages] = useState([WELCOME])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [inputText, setInputText] = useState('')
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  /* 消息变化时自动滚动到底部 */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const addMessage = (role, type, content) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), role, type, content }])
  }

  const handleNavigate = (path) => {
    navigate(path)
    setAgentOpen(false)
  }

  /* ── 发送逻辑 ── */
  const handleSend = async (text) => {
    const userText = (text !== undefined ? text : inputText).trim()
    if (!userText || isLoading) return
    setInputText('')

    addMessage('user', 'text', userText)
    setIsLoading(true)

    try {
      const intent = parseIntent(userText)

      if (intent.type === 'rejected') {
        const rejected = assessments.filter(a => a.status === 'rejected')
        setIsLoading(false)
        if (rejected.length === 0) {
          addMessage('assistant', 'text', '当前没有已拒绝的报告。')
        } else {
          const list = rejected.map(({ id, embryoNo, grade, status, assessmentDate, doctor }) =>
            ({ id, embryoNo, grade, status, assessmentDate, doctor })
          )
          addMessage('assistant', 'card', { type: 'report_list', data: list })
        }

      } else if (intent.type === 'pending') {
        const pending = assessments.filter(a => a.status === 'pending')
        setIsLoading(false)
        if (pending.length === 0) {
          addMessage('assistant', 'text', '当前没有待复核的报告。')
        } else {
          const list = pending.map(({ id, embryoNo, grade, status, assessmentDate, doctor }) =>
            ({ id, embryoNo, grade, status, assessmentDate, doctor })
          )
          addMessage('assistant', 'card', { type: 'report_list', data: list })
        }

      } else if (intent.type === 'compare_embryos') {
        setLoadingText('正在读取患者本周期评估记录...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        const result = await tool_compare_embryos(intent.patientId, intent.cycleNo, currentUser)
        setIsLoading(false)
        if (!result.embryos.length) {
          addMessage('assistant', 'text', '未找到白艳丽本次周期的评估记录。')
        } else {
          addMessage('assistant', 'card', { type: 'embryo_comparison', data: result })
        }

      } else if (intent.type === 'generate_summary') {
        setLoadingText('正在读取最近报告...')
        const sorted = [...assessments].sort((a, b) =>
          new Date(b.assessmentDate) - new Date(a.assessmentDate)
        )
        const recentId = sorted[0] ? sorted[0].id : null
        if (!recentId) {
          setIsLoading(false)
          addMessage('assistant', 'text', '未找到可用的评估报告。')
          return
        }
        const reportDetail = await tool_get_report_detail(recentId, currentUser)
        setLoadingText('正在生成评估总结草稿...')
        const summary = await tool_generate_summary(reportDetail, currentUser)
        setIsLoading(false)
        addMessage('assistant', 'card', { type: 'report_summary', data: { report: reportDetail, summary } })

      } else if (intent.type === 'report_detail') {
        if (!intent.reportId) {
          setIsLoading(false)
          addMessage('assistant', 'text', '请提供具体的报告 ID（如 ASS-2026-0021）以便查询详情。')
          return
        }
        setLoadingText('正在读取报告详情...')
        const reportDetail = await tool_get_report_detail(intent.reportId, currentUser)
        setIsLoading(false)
        if (!reportDetail) {
          addMessage('assistant', 'text', '未找到报告 ' + intent.reportId + '。')
        } else {
          const list = [{ id: reportDetail.id, embryoNo: reportDetail.embryoNo, grade: reportDetail.grade, status: reportDetail.status, assessmentDate: reportDetail.assessmentDate, doctor: reportDetail.doctor }]
          addMessage('assistant', 'card', { type: 'report_list', data: list })
        }

      } else if (intent.type === 'search_patients') {
        setLoadingText('正在查询患者数据...')
        const results = await tool_search_patients(intent.query, currentUser)
        setIsLoading(false)
        if (results.length === 0) {
          addMessage('assistant', 'text', '未找到与"' + intent.query + '"匹配的患者。')
        } else {
          addMessage('assistant', 'card', { type: 'patient_list', data: results })
        }

      } else if (intent.type === 'get_reports') {
        if (!intent.patientId) {
          setIsLoading(false)
          addMessage('assistant', 'text', '请提供患者 ID（格式如 P-2024-0001）以查询报告列表。')
          return
        }
        setLoadingText('正在查询评估报告...')
        const results = await tool_get_reports(intent.patientId, currentUser)
        setIsLoading(false)
        if (results.length === 0) {
          addMessage('assistant', 'text', '患者 ' + intent.patientId + ' 暂无评估报告。')
        } else {
          addMessage('assistant', 'card', { type: 'report_list', data: results })
        }

      } else {
        setLoadingText('正在思考...')
        const reply = await tool_chat(userText)
        setIsLoading(false)
        addMessage('assistant', 'text', reply)
      }
    } catch (err) {
      setIsLoading(false)
      addMessage('assistant', 'text',
        err?.message?.includes('未配置')
          ? '豆包 API Key 未配置，请联系管理员在 .env 文件中设置 DOUBAO_API_KEY。'
          : err?.message?.includes('401')
          ? 'API 鉴权失败，请检查豆包 API Key 是否正确。'
          : '网络请求失败，请稍后重试。（' + (err?.message ?? '未知错误') + '）'
      )
    }
  }

  const handleShortcut = (shortcut) => {
    if (shortcut.fillOnly) {
      setInputText(shortcut.label)
      inputRef.current?.focus()
    } else {
      handleSend(shortcut.label)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const ROLE_LABEL = { embryologist: '胚胎学家', senior: '主任医师', admin: '管理员' }

  return (
    <div
      className={`h-full flex flex-col bg-white transition-transform duration-300 ${
        agentOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* 顶部标题栏 */}
      <div className="bg-medical-blue text-white px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <span className="font-semibold text-sm">临床智能助手</span>
          </div>
          <button
            onClick={() => setAgentOpen(false)}
            className="p-1 rounded hover:bg-white/20 transition-colors"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {currentUser && (
          <p className="text-xs text-blue-100 mt-1">
            当前用户：{currentUser.name}（{ROLE_LABEL[currentUser.role] || currentUser.role}）
          </p>
        )}
      </div>

      {/* 对话气泡区 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.type === 'card' ? (
              <div className="w-full max-w-[95%]">
                <AgentResultCard
                  type={msg.content.type}
                  data={msg.content.data}
                  onNavigate={handleNavigate}
                />
              </div>
            ) : (
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-medical-blue text-white rounded-br-sm'
                    : 'bg-white border border-medical-border text-medical-text rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {/* 工具调用中状态提示 */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-medical-border rounded-xl rounded-bl-sm px-3 py-2 text-sm text-medical-muted flex items-center gap-2">
              <span className="inline-flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-medical-blue rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-medical-blue rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-medical-blue rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
              {loadingText && <span>{loadingText}</span>}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 快捷指令区 */}
      <div className="px-3 py-2 border-t border-medical-border overflow-x-auto flex gap-2 flex-shrink-0">
        {SHORTCUTS.map(s => (
          <button
            key={s.label}
            onClick={() => handleShortcut(s)}
            disabled={isLoading}
            className="flex-shrink-0 text-xs px-2.5 py-1.5 border border-medical-border rounded-full text-medical-muted hover:border-medical-blue hover:text-medical-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {s.label.trim()}
          </button>
        ))}
      </div>

      {/* 输入栏 */}
      <div className="px-3 pb-3 pt-2 flex gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入查询指令…"
          disabled={isLoading}
          className="flex-1 border border-medical-border rounded-lg px-3 py-2 text-sm text-medical-text placeholder:text-medical-muted focus:outline-none focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20 disabled:opacity-50 transition-colors"
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !inputText.trim()}
          className="w-9 h-9 rounded-lg bg-medical-blue text-white flex items-center justify-center hover:bg-medical-blue-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          title="发送"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
