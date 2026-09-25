/**
 * PatientView.jsx — 患者专属查询入口（从 PatientPortal.jsx 迁移，内容完全相同）
 *
 * 流程：
 *   1. 身份验证区：输入患者ID（mock 任意输入即通过）→ verified=true
 *   2. 脱敏报告摘要卡：展示 Grade + 四项关键指标（不含原始数据）
 *   3. 智能问答助手：
 *      - 预设5个快捷问题按钮（来自 chatbot.js presetQA 键名）
 *      - 用户消息右对齐蓝色气泡，助手消息左对齐白色气泡 + Bot 图标
 *      - 600ms 延迟后显示回答（typing 动画三点跳动）
 *      - chatEndRef 自动滚动到最新消息
 *      - 未匹配预设问题时返回 fallbackAnswer
 *   4. sticky bottom-0 输入栏：Enter 键 / 发送按钮 触发提问
 */
import { useState, useRef, useEffect } from 'react'
import { Bot } from 'lucide-react'
import { presetQA, fallbackAnswer } from '../../mock/chatbot'

const PRESET_QUESTIONS = Object.keys(presetQA)

const DESENSITIZED = {
  grade:      '一级胚胎',
  gradeType:  'grade1',
  conclusion: '胚胎质量优秀，具有高移植潜力。',
  keyPoints:  [
    { label: '细胞均一性',   value: '优秀' },
    { label: '发育速率',     value: '正常' },
    { label: '碎片化比例',   value: '极低（< 5%）' },
    { label: '综合建议',     value: '优先移植' },
  ],
  date: '2026-03-11',
}

const GRADE_COLOR_BG = {
  grade1: 'bg-[#D6EAF8] border-[#AED6F1]',
  grade2: 'bg-[#AED6F1] border-[#7FB3D3]',
  grade3: 'bg-[#D5F5E3] border-[#A9DFBF]',
  grade4: 'bg-[#A9DFBF] border-[#82C9A0]',
}

const GRADE_COLOR_TEXT = {
  grade1: 'text-[#1A5276]',
  grade2: 'text-medical-blue',
  grade3: 'text-[#1E8449]',
  grade4: 'text-[#196F3D]',
}

// message shape: { role: 'user'|'assistant', text: string }
const WELCOME_MSG = {
  role: 'assistant',
  text: '您好！我是胚胎评估智能助手。您可以向我咨询报告相关问题，或点击下方快捷问题快速获取解答。',
}

export default function PatientView() {
  const [verified, setVerified]   = useState(false)
  const [patientId, setPatientId] = useState('')
  const [messages, setMessages]   = useState([WELCOME_MSG])
  const [input, setInput]         = useState('')
  const [isTyping, setIsTyping]   = useState(false)

  const chatEndRef = useRef(null)

  // 每次 messages 或 isTyping 变更后滚到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleVerify = (e) => {
    e.preventDefault()
    setVerified(true)
  }

  const handleSend = (question) => {
    const q = (question ?? input).trim()
    if (!q || isTyping) return

    setMessages(prev => [...prev, { role: 'user', text: q }])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const answer = presetQA[q] ?? fallbackAnswer
      setMessages(prev => [...prev, { role: 'assistant', text: answer }])
      setIsTyping(false)
    }, 600)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 顶部标识栏 */}
      <div className="px-6 py-4 border-b border-medical-border bg-white flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-medical-blue flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <div>
            <h1 className="text-base font-semibold text-medical-text">胚胎评估结果查询</h1>
            <p className="text-xs text-medical-muted">患者专属通道 · 数据已脱敏处理</p>
          </div>
        </div>
      </div>

      {!verified ? (
        /* ── 身份验证区 ── */
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="card p-8 w-full max-w-sm">
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-medical-blue-light flex items-center justify-center">
                <Bot className="w-7 h-7 text-medical-blue" />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-medical-text text-center mb-1">验证患者身份</h2>
            <p className="text-sm text-medical-muted text-center mb-5">请输入您的患者ID以查询评估结果</p>
            <form onSubmit={handleVerify} className="space-y-3">
              <input
                type="text"
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                placeholder="患者ID（如：P-2024-0001）"
                className="input-field"
              />
              <button type="submit" className="btn-primary w-full py-2.5">
                查询我的报告
              </button>
            </form>
            <p className="text-xs text-medical-muted mt-4 text-center">
              患者ID见您的就诊凭证，如有疑问请联系护士台
            </p>
          </div>
        </div>
      ) : (
        /* ── 已验证：报告 + 聊天 ── */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 可滚动内容区 */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">

              {/* 脱敏报告摘要卡片 */}
              <div className={`card p-5 border-2 ${GRADE_COLOR_BG[DESENSITIZED.gradeType]}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-medical-muted mb-0.5">评估日期：{DESENSITIZED.date}</p>
                    <p className="text-xs text-medical-muted">本报告已脱敏处理，仅显示关键结论</p>
                  </div>
                  <span className="text-xs bg-white border border-medical-border text-medical-muted px-2 py-0.5 rounded">
                    已脱敏
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <p className={`text-5xl font-bold ${GRADE_COLOR_TEXT[DESENSITIZED.gradeType]}`}>
                      {DESENSITIZED.grade}
                    </p>
                    <p className="text-xs text-medical-muted mt-1">综合评级</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-medical-text leading-relaxed">{DESENSITIZED.conclusion}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DESENSITIZED.keyPoints.map(kp => (
                    <div key={kp.label} className="bg-white/70 rounded-lg px-3 py-2">
                      <p className="text-xs text-medical-muted">{kp.label}</p>
                      <p className="text-sm font-medium text-medical-text mt-0.5">{kp.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 智能问答助手标题 */}
              <div className="flex items-center gap-2 px-1">
                <Bot className="w-4 h-4 text-medical-blue" />
                <h3 className="text-sm font-semibold text-medical-text">智能问答助手</h3>
                <span className="text-xs text-medical-muted">· 可咨询报告相关问题</span>
              </div>

              {/* 对话气泡 */}
              <div className="space-y-3">
                {messages.map((m, idx) => (
                  m.role === 'user' ? (
                    /* 用户气泡：右对齐蓝色 */
                    <div key={idx} className="flex justify-end">
                      <div className="max-w-xs bg-medical-blue text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-sm leading-relaxed">
                        {m.text}
                      </div>
                    </div>
                  ) : (
                    /* 助手气泡：左对齐白色 + 机器人图标 */
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-medical-blue-light border border-medical-border flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-medical-blue" />
                      </div>
                      <div className="max-w-sm bg-white border border-medical-border text-sm text-medical-text px-4 py-2.5 rounded-2xl rounded-bl-sm leading-relaxed shadow-sm">
                        {m.text}
                      </div>
                    </div>
                  )
                ))}

                {/* 打字指示器 */}
                {isTyping && (
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-medical-blue-light border border-medical-border flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-medical-blue" />
                    </div>
                    <div className="bg-white border border-medical-border px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                      <div className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-medical-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-medical-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-medical-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 滚动锚点 */}
                <div ref={chatEndRef} />
              </div>

              {/* 快捷问题按钮 */}
              <div className="flex flex-wrap gap-2 pb-2">
                {PRESET_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    disabled={isTyping}
                    className="text-xs px-3 py-1.5 border border-medical-border rounded-full text-medical-muted hover:border-medical-blue hover:text-medical-blue transition-colors disabled:opacity-40"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* sticky 底部输入栏 */}
          <div className="sticky bottom-0 bg-white border-t border-medical-border flex-shrink-0">
            <div className="max-w-2xl mx-auto px-6 py-3 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="输入您的问题…"
                disabled={isTyping}
                className="input-field flex-1 disabled:opacity-60"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="btn-primary px-5 disabled:opacity-50"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
