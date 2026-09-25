/**
 * ForgotPassword.jsx — 忘记密码页
 *
 * 三阶段流程（phase 状态控制）：
 *   phase 1 — 输入手机号 + 验证码（60s倒计时）
 *   phase 2 — 设置新密码（两次输入 + Eye/EyeOff 显隐）
 *   phase 3 — 成功页（绿色 CheckCircle + 3秒自动跳转回登录页）
 */
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'

function useCountdown(seconds = 60) {
  const [count, setCount] = useState(0)
  const start = () => {
    setCount(seconds)
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
  }
  return { count, start, active: count > 0 }
}

export default function ForgotPassword() {
  const navigate = useNavigate()
  const { showToast } = useAppContext()
  const [phase, setPhase] = useState(1) // 1: 验证 | 2: 设置新密码 | 3: 成功
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [redirectCount, setRedirectCount] = useState(3)
  const sms = useCountdown(60)

  // 成功后 3 秒自动跳转
  useEffect(() => {
    if (phase !== 3) return
    const timer = setInterval(() => {
      setRedirectCount(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate('/login')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [phase, navigate])

  const handleSendSMS = () => {
    if (sms.active) return
    sms.start()
    showToast('验证码已发送至您的手机', 'success')
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-medical-text mb-1">重置密码</h2>
        <p className="text-sm text-medical-muted">
          {phase === 1 && '通过手机验证码验证身份'}
          {phase === 2 && '验证成功，请设置新密码'}
          {phase === 3 && '密码已重置成功'}
        </p>
      </div>

      {/* 阶段进度条 */}
      {phase < 3 && (
        <div className="flex gap-1 mb-6">
          {[1, 2].map(p => (
            <div
              key={p}
              className={`flex-1 h-1 rounded-full transition-colors ${phase >= p ? 'bg-medical-blue' : 'bg-medical-border'}`}
            />
          ))}
        </div>
      )}

      {/* Phase 1：手机验证 */}
      {phase === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-medical-text mb-1.5">手机号</label>
            <input type="tel" placeholder="请输入注册手机号" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-medical-text mb-1.5">验证码</label>
            <div className="flex gap-2">
              <input type="text" placeholder="请输入验证码" className="input-field" />
              <button
                type="button"
                onClick={handleSendSMS}
                disabled={sms.active}
                className="btn-secondary flex-shrink-0 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sms.active ? `${sms.count}s 后重发` : '发送验证码'}
              </button>
            </div>
          </div>
          <button
            onClick={() => setPhase(2)}
            className="btn-primary w-full py-2.5 mt-2"
          >
            下一步
          </button>
        </div>
      )}

      {/* Phase 2：设置新密码 */}
      {phase === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-medical-text mb-1.5">新密码</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="8位以上，含数字与字母"
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-medical-muted hover:text-medical-text"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-medical-text mb-1.5">确认新密码</label>
            <div className="relative">
              <input
                type={showConfirmPwd ? 'text' : 'password'}
                placeholder="请再次输入新密码"
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-medical-muted hover:text-medical-text"
              >
                {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            <button onClick={() => setPhase(1)} className="btn-secondary flex-1">
              上一步
            </button>
            <button
              onClick={() => { setPhase(3); showToast('密码重置成功', 'success') }}
              className="btn-primary flex-1"
            >
              确认重置
            </button>
          </div>
        </div>
      )}

      {/* Phase 3：成功 */}
      {phase === 3 && (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-medical-green" />
          </div>
          <h3 className="text-base font-semibold text-medical-text mb-2">密码重置成功</h3>
          <p className="text-sm text-medical-muted mb-1">请使用新密码重新登录。</p>
          <p className="text-xs text-medical-muted mb-6">
            {redirectCount} 秒后自动跳转至登录页…
          </p>
          <Link to="/login" className="btn-primary inline-block">立即登录</Link>
        </div>
      )}

      {phase < 3 && (
        <p className="text-center text-sm text-medical-muted mt-6">
          <Link to="/login" className="text-medical-blue hover:underline">← 返回登录</Link>
        </p>
      )}
    </div>
  )
}
