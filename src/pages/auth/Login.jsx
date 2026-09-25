/**
 * Login.jsx — 登录页
 *
 * 布局：双栏（左侧医疗插画色块 + 右侧登录表单）
 *
 * 功能：
 *   - Tab 切换：密码登录 / 验证码登录（含60s倒计时）
 *   - 密码显隐切换（Eye / EyeOff）
 *   - 登录按钮：1s loading 后 switchRole + navigate('/dashboard')
 *   - 底部快捷角色切换（胚胎学家 / 高级医师 / 管理员），用于演示
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'

// SMS 倒计时 Hook
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

export default function Login() {
  const navigate = useNavigate()
  const { switchRole, showToast } = useAppContext()
  const [loginMode, setLoginMode] = useState('password')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const sms = useCountdown(60)

  const doLogin = (roleKey) => {
    if (loading) return
    if (roleKey) switchRole(roleKey)
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      showToast('登录成功，欢迎使用 AIMS', 'success')
      navigate('/dashboard')
    }, 1000)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    doLogin(null)
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden flex min-h-[520px]">
      {/* ── 左侧医疗主题插图区 ── */}
      <div className="hidden md:flex flex-col justify-between bg-medical-blue p-10 w-1/2">
        {/* Logo + 标题 */}
        <div>
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-6">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <h2 className="text-2xl font-bold text-white leading-snug">
            胚胎质量<br />智能评估系统
          </h2>
          <p className="text-blue-100 mt-3 text-sm leading-relaxed opacity-90">
            AI 辅助胚胎评级 · 医疗质控合规<br />多角色协同工作流
          </p>
        </div>

        {/* 装饰性细胞网格 */}
        <div className="my-8 grid grid-cols-5 gap-2.5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-full aspect-square bg-white transition-opacity
                ${[0, 4, 6, 10, 13, 17, 19].includes(i) ? 'opacity-60' : 'opacity-20'}`}
            />
          ))}
        </div>

        {/* 统计数字 */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: '91.3%', label: '模型一致率' },
            { value: '2,847', label: '已完成评估' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-lg p-3">
              <p className="text-white font-bold text-xl">{s.value}</p>
              <p className="text-blue-100 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="text-white/40 text-xs mt-6">© 2026 AIMS Medical Technology</p>
      </div>

      {/* ── 右侧登录表单 ── */}
      <div className="flex-1 p-8 flex flex-col justify-center">
        {/* 移动端 Logo */}
        <div className="flex items-center gap-2 mb-6 md:hidden">
          <div className="w-8 h-8 rounded-md bg-medical-blue flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="text-medical-blue font-semibold text-sm">AIMS · 胚胎质量智能评估系统</span>
        </div>

        <h2 className="text-xl font-semibold text-medical-text mb-1">登录系统</h2>
        <p className="text-sm text-medical-muted mb-6">请使用您的工号或手机号登录</p>

        {/* 登录方式切换 Tab */}
        <div className="flex border border-medical-border rounded-lg p-0.5 mb-6 bg-medical-bg">
          {[
            { key: 'password', label: '密码登录' },
            { key: 'sms',      label: '验证码登录' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setLoginMode(tab.key)}
              className={[
                'flex-1 py-1.5 text-sm rounded-md transition-colors',
                loginMode === tab.key
                  ? 'bg-white text-medical-blue font-medium shadow-sm'
                  : 'text-medical-muted hover:text-medical-text',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 工号 / 手机号 */}
          <div>
            <label className="block text-sm font-medium text-medical-text mb-1.5">
              工号 / 手机号
            </label>
            <input
              type="text"
              placeholder="请输入工号或手机号"
              className="input-field"
              defaultValue="EMP-10023"
            />
          </div>

          {loginMode === 'password' ? (
            /* 密码输入 */
            <div>
              <label className="block text-sm font-medium text-medical-text mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="请输入密码"
                  className="input-field pr-10"
                  defaultValue="password123"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-medical-muted hover:text-medical-text"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            /* 短信验证码 */
            <div>
              <label className="block text-sm font-medium text-medical-text mb-1.5">验证码</label>
              <div className="flex gap-2">
                <input type="text" placeholder="请输入验证码" className="input-field" />
                <button
                  type="button"
                  onClick={() => { if (!sms.active) { sms.start(); showToast('验证码已发送', 'success') } }}
                  disabled={sms.active}
                  className="btn-secondary flex-shrink-0 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sms.active ? `${sms.count}s 后重发` : '发送验证码'}
                </button>
              </div>
            </div>
          )}

          {loginMode === 'password' && (
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-medical-blue hover:underline">
                忘记密码？
              </Link>
            </div>
          )}

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? '登录中…' : '登 录'}
          </button>
        </form>

        {/* 注册入口 */}
        <p className="text-center text-sm text-medical-muted mt-4">
          还没有账号？
          <Link to="/register" className="text-medical-blue hover:underline ml-1">申请注册</Link>
        </p>

        {/* 快捷角色切换（演示专用） */}
        <div className="mt-6 pt-4 border-t border-medical-border">
          <p className="text-xs text-medical-muted text-center mb-2">演示快捷切换角色</p>
          <div className="flex gap-2">
            {[
              { key: 'doctor',    label: '主任医师',  cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { key: 'director',  label: '副主任医师', cls: 'bg-green-50 text-green-700 hover:bg-green-100' },
              { key: 'admin',        label: '管理员',   cls: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
            ].map(r => (
              <button
                key={r.key}
                onClick={() => doLogin(r.key)}
                disabled={loading}
                className={`flex-1 text-xs py-2 rounded-md font-medium transition-colors disabled:opacity-60 ${r.cls}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
