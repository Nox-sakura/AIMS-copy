/**
 * Register.jsx — 用户注册页
 *
 * 三步骤流程：
 *   Step 1 — 手机验证（含60s倒计时）
 *   Step 2 — 执业证书上传（mock：点击后显示"已上传：执业证书.jpg"）
 *   Step 3 — 信息确认摘要（只读）+ 提交 → 进入"审核中"状态页
 *
 * 提交后不跳转路由，在页内切换到等待审核的成功状态。
 * 真实场景下需后端接口；第二阶段全为 mock。
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Upload, Check } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'

const STEPS = ['基本信息', '职业信息', '提交审核']

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

// 步骤条组件
function Stepper({ steps, current }) {
  return (
    <div className="flex items-center mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          {/* 节点 */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors
              ${i < current  ? 'bg-medical-blue border-medical-blue text-white'
              : i === current ? 'border-medical-blue bg-white text-medical-blue'
              : 'border-medical-border bg-white text-medical-muted'}`}
            >
              {i < current ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs mt-1.5 whitespace-nowrap
              ${i === current ? 'text-medical-blue font-medium' : 'text-medical-muted'}`}>
              {label}
            </span>
          </div>
          {/* 连接线 */}
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-5 ${i < current ? 'bg-medical-blue' : 'bg-medical-border'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function Register() {
  const { showToast } = useAppContext()
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  // 表单状态
  const [form1, setForm1] = useState({ name: '', phone: '', code: '', password: '', confirm: '' })
  const [form2, setForm2] = useState({ employeeId: '', department: '生殖医学科', title: '主治医师', licenseNo: '' })

  const sms = useCountdown(60)

  const handleSendSMS = () => {
    if (sms.active) return
    sms.start()
    showToast('验证码已发送至您的手机', 'success')
  }

  const handleSubmit = () => {
    setSubmitted(true)
    showToast('注册申请已提交，等待管理员审核', 'success')
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-medical-green" />
        </div>
        <h3 className="text-lg font-semibold text-medical-text mb-2">注册申请已提交</h3>
        <p className="text-sm text-medical-muted mb-2 leading-relaxed">
          您的注册申请已发送至系统管理员审核。
        </p>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-left text-sm text-orange-800 mb-6">
          <p className="font-medium mb-1">温馨提示</p>
          <ul className="space-y-0.5 list-disc list-inside text-orange-700 text-xs">
            <li>审核通常在 1 个工作日内完成</li>
            <li>审核结果将以短信形式通知您</li>
            <li>如有疑问请联系信息科：ext. 8001</li>
          </ul>
        </div>
        <Link to="/login" className="btn-primary inline-block">返回登录</Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-medical-text mb-1">申请注册账号</h2>
      <p className="text-sm text-medical-muted mb-6">账号须经管理员审核后方可使用</p>

      <Stepper steps={STEPS} current={step} />

      {/* Step 0：基本信息 */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-medical-text mb-1.5">姓名</label>
              <input
                type="text"
                placeholder="请输入真实姓名"
                className="input-field"
                value={form1.name}
                onChange={e => setForm1(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-medical-text mb-1.5">手机号</label>
              <input
                type="tel"
                placeholder="请输入手机号"
                className="input-field"
                value={form1.phone}
                onChange={e => setForm1(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-medical-text mb-1.5">短信验证码</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="请输入验证码"
                className="input-field"
                value={form1.code}
                onChange={e => setForm1(f => ({ ...f, code: e.target.value }))}
              />
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
          <div>
            <label className="block text-sm font-medium text-medical-text mb-1.5">设置密码</label>
            <input
              type="password"
              placeholder="8位以上，含数字与字母"
              className="input-field"
              value={form1.password}
              onChange={e => setForm1(f => ({ ...f, password: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-medical-text mb-1.5">确认密码</label>
            <input
              type="password"
              placeholder="再次输入密码"
              className="input-field"
              value={form1.confirm}
              onChange={e => setForm1(f => ({ ...f, confirm: e.target.value }))}
            />
          </div>
        </div>
      )}

      {/* Step 1：职业信息 */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-medical-text mb-1.5">工号</label>
              <input
                type="text"
                placeholder="如 EMP-10045"
                className="input-field"
                value={form2.employeeId}
                onChange={e => setForm2(f => ({ ...f, employeeId: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-medical-text mb-1.5">科室</label>
              <select
                className="input-field"
                value={form2.department}
                onChange={e => setForm2(f => ({ ...f, department: e.target.value }))}
              >
                <option>生殖医学科</option>
                <option>胚胎实验室</option>
                <option>妇科</option>
                <option>检验科</option>
                <option>信息技术部</option>
                <option>其他</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-medical-text mb-1.5">职称</label>
            <select
              className="input-field"
              value={form2.title}
              onChange={e => setForm2(f => ({ ...f, title: e.target.value }))}
            >
              <option value="">请选择职称</option>
              <option>住院医师</option>
              <option>主治医师</option>
              <option>副主任医师</option>
              <option>主任医师</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-medical-text mb-1.5">执业证书编号</label>
            <input
              type="text"
              placeholder="请输入执业医师证书编号"
              className="input-field"
              value={form2.licenseNo}
              onChange={e => setForm2(f => ({ ...f, licenseNo: e.target.value }))}
            />
          </div>
          {/* 执业证书上传 */}
          <div>
            <label className="block text-sm font-medium text-medical-text mb-1.5">上传执业证书</label>
            <div
              onClick={() => { setUploaded(true); showToast('文件上传成功', 'success') }}
              className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors
                ${uploaded
                  ? 'border-medical-green bg-green-50'
                  : 'border-medical-border bg-medical-bg hover:border-medical-blue hover:bg-medical-blue-light'}`}
            >
              {uploaded ? (
                <div className="flex items-center justify-center gap-2 text-medical-green">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">已上传：执业证书.jpg</span>
                </div>
              ) : (
                <>
                  <Upload className="w-7 h-7 text-medical-muted mx-auto mb-2" />
                  <p className="text-sm text-medical-muted">点击或拖拽上传执业证书</p>
                  <p className="text-xs text-medical-muted mt-1">支持 JPG、PNG，最大 5MB</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2：信息确认 */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-medical-bg rounded-lg p-4 space-y-2.5 text-sm">
            <p className="font-medium text-medical-text mb-1">请确认以下注册信息：</p>
            {[
              { label: '姓名',     value: form1.name     || '（未填写）' },
              { label: '手机号',   value: form1.phone    ? `${form1.phone.slice(0,3)}****${form1.phone.slice(-2)}（已验证）` : '（未填写）' },
              { label: '工号',     value: form2.employeeId || '（未填写）' },
              { label: '科室',     value: form2.department },
              { label: '职称',     value: form2.title    || '（未选择）' },
              { label: '执业证书', value: uploaded ? '已上传 ✓' : '未上传' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between border-b border-medical-border pb-2 last:border-0 last:pb-0">
                <span className="text-medical-muted">{row.label}</span>
                <span className="text-medical-text font-medium">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800">
            <p className="font-medium mb-1">审核说明</p>
            <ul className="space-y-1 list-disc list-inside text-orange-700 text-xs">
              <li>提交后将由管理员审核，预计 1 个工作日内完成</li>
              <li>审核结果将通过短信通知您</li>
              <li>如有疑问请联系信息科：ext. 8001</li>
            </ul>
          </div>
        </div>
      )}

      {/* 步骤导航按钮 */}
      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1">
            上一步
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} className="btn-primary flex-1">
            下一步
          </button>
        ) : (
          <button onClick={handleSubmit} className="btn-primary flex-1">
            提交审核
          </button>
        )}
      </div>

      <p className="text-center text-sm text-medical-muted mt-4">
        已有账号？
        <Link to="/login" className="text-medical-blue hover:underline ml-1">返回登录</Link>
      </p>
    </div>
  )
}
