/**
 * AgentChatPanel.jsx — MCA 教学助手对话面板
 *
 * - 调用 Anthropic API（claude-sonnet-4-20250514）
 * - 5 秒超时后降级至预设 QA
 * - API Key 来自 VITE_ANTHROPIC_API_KEY
 */
import { useState, useEffect, useRef } from 'react'
import { Bot, Send } from 'lucide-react'
import { useAuth } from '@/context/AppContext'
import { useAppContext } from '@/context/AppContext'
import { logEducationAction, EDUCATION_ACTIONS } from '@/utils/educationLogger'

/* ── System Prompt ── */
const SYSTEM_PROMPT = `你是 MCA 胚胎评估教学助手。你的知识边界严格限定为：
1. Day 3 卵裂期胚胎形态学评估
2. Grade 1–4 分级标准（基于论文 MCA，Multi-level Concept Alignment）
3. 以下概念名称（来自论文 Table 1，不得使用其他概念）：
   Grade 1：symmetrical blastomeres, uniform cell size, clear cytoplasm, no fragmentation,
   rapid cleavage rate, intact zona pellucida, well-defined intercellular borders,
   compact blastomere alignment, minimal metabolic debris, smooth membrane boundaries,
   homogeneous texture, balanced cell division, no nuclear fragments
   Grade 2：uneven blastomere size, delayed cleavage stage, suboptimal cell alignment,
   slow division rate, slight membrane roughness, slight metabolic residue,
   mild structural irregularities, irregular cytoplasm granularity
   Grade 3：pronounced vacuolation, stalled cleavage phase, disorganized cell structures,
   fragmented membranes, uneven cytoplasmic coloration, mild cell border retraction,
   localized cell swelling, uneven intracellular granularity
   Grade 4：indistinct cell boundaries, loss of membrane integrity, vacuole swelling and rupture,
   signs of apoptosis, overall structural disintegration, disordered cell arrangement,
   granular cytoplasm accumulation, abnormal cell number, visible cell debris,
   complete developmental arrest

你绝对不得讨论：移植建议、临床决策、囊胚评估（Day 5）、其他胚胎类型、论文范围外的任何概念。
当学员回答时，基于 Grade 特征给出有教学价值的反馈，鼓励深入思考。
回复使用中文，专业术语保留英文原名（如 symmetrical blastomeres）。
回复长度：100–200 字，不使用 Markdown 格式符号。`

/* ── API 调用 ── */
async function callAnthropicAPI(messages) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch('/api/anthropic', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    })
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    const data = await response.json()
    return data.content[0]?.text ?? ''
  } finally {
    clearTimeout(timeoutId)
  }
}

/* ── 降级回复 ── */
function getFallbackReply(userInput, caseData) {
  const correctGrade = caseData.humanLabel.grade
  const inputLower = userInput.toLowerCase()
  const isCorrect = [
    `grade ${correctGrade}`,
    `${correctGrade}级`,
    ['一', '二', '三', '四'][correctGrade - 1] + '级',
  ].some(kw => inputLower.includes(kw))
  return isCorrect ? caseData.agentFeedback.correct : caseData.agentFeedback.incorrect
}

/* ── 时间格式 ── */
function formatTime(date) {
  return new Date(date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

/* ── 打字动画 ── */
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
        <div className="flex gap-1 items-center">
          {[0, 150, 300].map(delay => (
            <div
              key={delay}
              className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── 消息气泡 ── */
function MessageBubble({ message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          <div className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm
                          text-sm leading-relaxed">
            {message.content}
          </div>
          <p className="text-right text-xs text-gray-400 mt-1">{formatTime(message.timestamp)}</p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[75%]">
        <div className="bg-white border border-gray-200 border-l-4 border-l-blue-400
                        px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm
                        text-sm text-gray-700 leading-relaxed"
             style={{ fontFamily: 'DM Sans, sans-serif' }}>
          {message.content}
        </div>
        <p className="text-xs text-gray-400 mt-1">{formatTime(message.timestamp)}</p>
      </div>
    </div>
  )
}

/* ── AgentChatPanel ── */
export default function AgentChatPanel({ caseData }) {
  const { user: currentUser } = useAuth()
  const { showToast } = useAppContext()
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef(null)

  // 案例切换时重置消息并插入初始问题
  useEffect(() => {
    if (!caseData) return
    setMessages([{
      id: 'init',
      role: 'assistant',
      content: caseData.agentQuestion,
      timestamp: new Date(),
    }])
    setInputText('')
  }, [caseData?.id])

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return

    const userMsg = { id: Date.now(), role: 'user', content: inputText, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setIsLoading(true)

    logEducationAction(currentUser?.id ?? 'unknown', EDUCATION_ACTIONS.SUBMIT_ANSWER, {
      caseId: caseData.id,
      messageLength: inputText.length,
    })

    try {
      const reply = await callAnthropicAPI([...messages, userMsg])
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }])
      logEducationAction(currentUser?.id ?? 'unknown', EDUCATION_ACTIONS.VIEW_FEEDBACK, { caseId: caseData.id })
    } catch {
      const fallback = getFallbackReply(userMsg.content, caseData)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: fallback,
        timestamp: new Date(),
      }])
      showToast('AI 服务暂时不可用，切换至预设回复', 'warning')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Agent 身份栏 */}
      <div className="flex items-center gap-3 p-4 border-b bg-white flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
          <Bot className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            MCA 教学助手
          </p>
          <p className="text-xs text-gray-400">
            基于 MCA 论文模型 · 知识边界：Day 3 胚胎 Grade 1–4
          </p>
        </div>
        <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          在线
        </span>
      </div>

      {/* 消息列表 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
      </div>

      {/* 输入区 */}
      <div className="p-4 border-t bg-white flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isLoading && handleSend()}
            disabled={isLoading}
            placeholder="输入你的评估观察或问题..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-300
                       disabled:bg-gray-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputText.trim()}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl
                       hover:bg-blue-700 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
