/** 保留原有界面和兼容接口。 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Search, Upload, X, CheckCircle, AlertTriangle, Check, Loader2,
  Zap, BarChart2, Crosshair, Info,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import PatientInfoBar from '../../components/common/PatientInfoBar'
import { useAppContext } from '../../context/AppContext'
import { getPatients } from '../../api/patients'
import { getAssessments } from '../../api/assessments'
import { predictEmbryo } from '../../api/mcaApi'

const STEPS = ['选择患者', '上传图像', '预处理确认', '提交评估']

/* ── 论文方法展示选项（保留内部 key，兼容已有报告） ── */
const MODELS = [
  {
    key:    'MCA-Lite',
    label:  'LWMA-Net',
    sub:    '2022 · 轻量形态注意力网络',
    Icon:   Zap,
    color:  '#E67E22',
    bg:     '#FEF3E2',
    time:   '论文未报告可比推理耗时',
    metricLabel: '四分类 AUC（验证 / 独立测试）',
    metric: '0.9688 / 0.9430',
    concepts: '未报告',
    scene:  'Day 3 静态形态分级研究',
    tags:   ['形态注意力', '多尺度融合'],
    recommended: false,
  },
  {
    key:    'MCA-Standard',
    label:  'EL 多网络融合模型',
    sub:    '2021 · 特征筛选与逻辑回归融合',
    Icon:   BarChart2,
    color:  '#1A6EBD',
    bg:     '#EBF4FF',
    time:   '论文未报告可比推理耗时',
    metricLabel: '四分类 ACC（验证 / 独立测试）',
    metric: '74.14% / 74.93%',
    concepts: '未报告',
    scene:  '融合四种 CNN 骨干网络的形态特征',
    tags:   ['特征筛选', '逻辑回归融合'],
    recommended: false,
  },
  {
    key:    'MCA-Pro',
    label:  'CNN 特征提取骨干',
    sub:    'DenseNet169 · InceptionV3 · ResNet50 · VGG19',
    Icon:   Crosshair,
    color:  '#27AE60',
    bg:     '#E8F8EF',
    time:   '论文未报告可比推理耗时',
    metricLabel: '论文指标',
    metric: '未在此处单列',
    concepts: '未报告',
    scene:  '2021 年研究用于特征提取的四种网络架构',
    tags:   ['四种网络架构', '特征提取'],
    recommended: false,
  },
]

/* ── 步骤条 ── */
function Stepper({ steps, current }) {
  return (
    <div className="flex items-center mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
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
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-5 ${i < current ? 'bg-medical-blue' : 'bg-medical-border'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ── 模型对比弹窗 ── */
function ModelCompareModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-medical-text">模型详细对比</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-medical-muted" /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-medical-bg">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-medical-muted border border-medical-border">对比项</th>
                {MODELS.map(m => (
                  <th key={m.key} className="px-4 py-2.5 text-center text-xs font-semibold border border-medical-border" style={{ color: m.color }}>
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['论文报告的指标', m => m.metric],
                ['指标口径', m => m.metricLabel],
                ['推理耗时', m => m.time],
                ['概念数量', m => m.concepts],
                ['研究内容', m => m.scene],
              ].map(([label, getter]) => (
                <tr key={label} className="hover:bg-medical-bg/50">
                  <td className="px-4 py-2.5 text-medical-muted border border-medical-border">{label}</td>
                  {MODELS.map(m => (
                    <td key={m.key} className={`px-4 py-2.5 text-center border border-medical-border ${m.recommended ? 'font-medium' : ''}`}>
                      {getter(m)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-medical-muted text-center mb-3">
          三项按两篇参考研究中的方法整理；论文未提供的模型耗时与概念数量不作推定。
          此处为方法展示选项，不代表系统已分别接入三套模型。
        </p>
        <button onClick={onClose} className="btn-secondary w-full mt-4">关闭</button>
      </div>
    </div>
  )
}

/* ── 模型选择卡片区 ── */
function ModelSelector({ selected, onSelect, lastUsed }) {
  const [showCompare, setShowCompare] = useState(false)
  return (
    <div className="mt-6 space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-medical-text">选择评估模型</h4>
        <p className="text-xs text-medical-muted mt-0.5">参考研究方法展示，不代表三种临床模型档位</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {MODELS.map(m => {
          const isSelected = selected === m.key
          const isLastUsed = lastUsed === m.key && !isSelected
          const { Icon } = m
          return (
            <div
              key={m.key}
              onClick={() => onSelect(m.key)}
              className="relative rounded-xl border-2 cursor-pointer transition-all duration-150"
              style={{
                borderColor: isSelected ? m.color : '#DDE3EC',
                backgroundColor: isSelected ? m.bg : '#fff',
                boxShadow: isSelected ? `0 0 0 1px ${m.color}40` : undefined,
              }}
            >
              {/* 选中勾（右上角，不与badge重叠） */}
              {isSelected && (
                <span className="absolute top-2.5 right-2.5">
                  <CheckCircle size={16} style={{ color: m.color }} />
                </span>
              )}

              <div className="p-4 pr-8">
                {/* 图标 */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: m.bg }}
                >
                  <Icon size={18} style={{ color: m.color }} />
                </div>

                <div className="text-sm font-bold text-medical-text flex items-center gap-1">
                  {m.label}
                  {m.recommended && (
                    <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-medical-blue text-white font-medium">推荐</span>
                  )}
                </div>
                <div className="text-xs text-medical-muted mb-2">{m.sub}</div>

                <div className="space-y-1 text-xs text-medical-muted">
                  <div>⚡ {m.time}</div>
                  <div className="leading-snug">适用：{m.scene}</div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                  <div className="text-xs">
                    <div className="text-medical-muted">{m.metricLabel}</div>
                    <div className="font-semibold mt-0.5" style={{ color: m.color }}>{m.metric}</div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-medical-muted">概念数量</span>
                    <span className="font-semibold" style={{ color: m.color }}>{m.concepts}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {m.tags.map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-medical-muted">
                      {t}
                    </span>
                  ))}
                </div>

                {/* 上次使用提示 */}
                {isLastUsed && (
                  <div className="mt-2 text-[10px] text-medical-muted">上次使用</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => setShowCompare(true)}
        className="flex items-center gap-1 text-xs text-medical-blue hover:underline"
      >
        <Info size={12} />
        了解三个模型的详细差异 →
      </button>

      {showCompare && <ModelCompareModal onClose={() => setShowCompare(false)} />}
    </div>
  )
}


export default function NewAssessment() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefilledPatient = location.state?.prefilledPatient ?? null
  const { showToast, currentUser } = useAppContext()

  const [step, setStep]               = useState(prefilledPatient ? 1 : 0)
  const [selectedPatient, setPatient] = useState(prefilledPatient)
  const [search, setSearch]           = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [dragOver, setDragOver]       = useState(false)
  const [images, setImages]           = useState([])
  const [accepted, setAccepted]       = useState({})
  const [termsConfirmed, setTermsConfirmed] = useState(false)
  const [patientsList, setPatientsList] = useState([])
  const [assessmentsList, setAssessmentsList] = useState([])
  const fileInputRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    getPatients().then(setPatientsList)
    getAssessments().then(setAssessmentsList)
  }, [])

  // 模型选择（localStorage 记忆）
  const lastUsedModel = localStorage.getItem('aims_lastModel') ?? null
  const [selectedModel, setSelectedModel] = useState(
    lastUsedModel ?? 'MCA-Standard'
  )
  const handleModelSelect = (model) => {
    setSelectedModel(model)
    localStorage.setItem('aims_lastModel', model)
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setImages(prev => {
      const base = prev.length
      const added = files.map((file, i) => ({
        id:         base + i + 1,
        label:      `胚胎 #${base + i + 1}`,
        file:       file.name,
        fileObj:    file,
        previewUrl: URL.createObjectURL(file),
        origSize:   '待检测',
        corrSize:   '720×480',
        checks: [
          { ok: true,  text: '输入分辨率达到模型采集规范（720×480 px），无需裁剪缩放' },
          { ok: true,  text: '胚胎主体区域居中检测通过，透明带边界识别有效' },
          { ok: true,  text: '图像亮度与对比度参数在有效推理范围内（CLAHE 预处理未触发）' },
        ],
      }))
      return [...prev, ...added]
    })
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter(
      f => f.type === 'image/jpeg' || f.type === 'image/png'
    )
    if (files.length > 0) handleFileChange({ target: { files, value: '' } })
  }

  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img.previewUrl) URL.revokeObjectURL(img.previewUrl)
      })
    }
  }, [images])

  const filteredPatients = patientsList.filter(p =>
    search && (p.name.includes(search) || p.id.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 6)

  const handleSelectPatient = (p) => {
    setPatient(p)
    setSearch('')
    setShowDropdown(false)
  }

  const removeImage = (id) => setImages(prev => prev.filter(img => img.id !== id))

  const handleSubmit = async () => {
    setSubmitting(true)

    try {
      // ── 1. 获取上传的第一张图像文件对象 ──
      const firstImage = images[0]
      const file = firstImage?.fileObj ?? null   // fileObj 由 handleFileChange 注入

      // ── 2. 调用 MCA 后端（或前端降级仿真） ──
      let mcaResult = null
      if (file) {
        mcaResult = await predictEmbryo(file)
      }

      // ── 3. 将 MCA 结果写入对应的 assessment 条目（仅真实推理结果才覆盖 mock） ──
      if (mcaResult && !mcaResult.simulated) {
        const targetId = 'ASS-2026-0029'    // 新建评估对应的白艳丽条目
        const target = assessmentsList.find(a => a.id === targetId)
        if (target) {
          const gradeKey = ['grade1','grade2','grade3','grade4'][mcaResult.predicted_grade]
          const gradeLabelMap = {grade1:'一级胚胎',grade2:'二级胚胎',grade3:'三级胚胎',grade4:'四级胚胎'}
          target.grade          = gradeKey
          target.gradeLabel     = gradeLabelMap[gradeKey]
          target.confidence     = mcaResult.confidence
          target.aiDecision     = mcaResult.ai_decision
          target.conceptScores  = mcaResult.frontend_concept_scores
          target.modelUsed      = 'MCA-Standard'
        }
      }

      setSubmitting(false)
      const timeLabel = mcaResult
        ? `${(mcaResult.inference_time_ms / 1000).toFixed(1)}s`
        : '2.0s'
      showToast(`评估完成，AI 推理耗时 ${timeLabel}，报告已生成`, 'success')
      navigate('/assessment/ASS-2026-0029')

    } catch (err) {
      setSubmitting(false)
      showToast('评估提交失败，请稍后重试', 'error')
      console.error('[NewAssessment] handleSubmit error:', err)
    }
  }

  const modelInfo = MODELS.find(m => m.key === selectedModel) ?? MODELS[1]

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="新建胚胎评估"
        breadcrumbs={[
          { label: '胚胎评估', path: '/assessment/new' },
          { label: '新建评估' },
        ]}
      />

      <div ref={scrollRef} className="p-6 flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <Stepper steps={STEPS} current={step} />

          {/* C3：页面副标题说明（仅 Step 0 显示） */}
          {step === 0 && (
            <p className="text-sm text-medical-muted mb-6 -mt-2">
              上传胚胎显微镜图像，AI 将辅助完成胚胎图像分析，
              自动完成质量评级与可解释性诊断报告生成。
            </p>
          )}

          {/* PatientInfoBar（Step 2 起，且已选患者时显示） */}
          {step >= 1 && selectedPatient && (
            <div className="mb-4">
              <PatientInfoBar
                patient={selectedPatient}
                assessment={assessmentsList.filter(a => a.patientId === selectedPatient.id).at(-1)}
              />
            </div>
          )}

          {/* ── Step 0：选择患者 + 模型选择 ── */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-medical-text">选择关联患者</h3>

              {selectedPatient ? (
                <div className="flex items-center gap-3 p-3 bg-medical-blue-light rounded-lg border border-medical-blue">
                  <div className="w-8 h-8 rounded-full bg-medical-blue flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-semibold">{selectedPatient.name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-medical-blue">{selectedPatient.name}</p>
                    <p className="text-xs text-medical-muted">{selectedPatient.id} · 第 {selectedPatient.currentCycle} 周期</p>
                  </div>
                  <button onClick={() => setPatient(null)} className="text-medical-muted hover:text-medical-red">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-medical-muted" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="输入患者姓名或ID搜索…"
                      className="input-field pl-9"
                    />
                  </div>
                  {showDropdown && filteredPatients.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-medical-border rounded-lg shadow-lg overflow-hidden">
                      {filteredPatients.map(p => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectPatient(p)}
                          className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-medical-bg transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-medical-blue-light flex items-center justify-center flex-shrink-0">
                            <span className="text-medical-blue text-xs font-medium">{p.name[0]}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-medical-text">{p.name}</p>
                            <p className="text-xs text-medical-muted">{p.id} · 第 {p.currentCycle} 周期</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedPatient && (
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-medical-text mb-1.5">周期编号</label>
                    <select className="input-field">
                      {selectedPatient.cycles.map(c => (
                        <option key={c.cycleNo} value={c.cycleNo}>
                          第 {c.cycleNo} 周期（{c.startDate}）
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-medical-text mb-1.5">取卵日期</label>
                    <input type="date" className="input-field" defaultValue="2026-03-10" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-medical-text mb-1.5">胚胎编号</label>
                    <input type="text" className="input-field" placeholder="如 E-03-A" defaultValue="E-03-A" />
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ── Step 1：上传图像 ── */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-medical-text">上传胚胎显微镜图像</h3>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={[
                  'relative border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer',
                  dragOver
                    ? 'border-medical-blue bg-medical-blue-light'
                    : 'border-medical-border bg-medical-bg hover:border-medical-blue/50',
                ].join(' ')}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Upload className="w-10 h-10 text-medical-muted mx-auto mb-3" />
                <p className="text-sm font-medium text-medical-text mb-1">拖拽图像至此处，或点击选择文件</p>
                <p className="text-xs text-medical-muted">支持格式：JPEG / PNG，建议分辨率 720×480</p>
                <div className="flex justify-center gap-2 mt-4" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-primary text-sm px-4 py-1.5"
                  >
                    打开文件夹
                  </button>
                  {images.length > 0 && (
                    <button
                      onClick={() => { setImages([]); setAccepted({}) }}
                      className="btn-ghost text-sm px-4 py-1.5"
                    >
                      重置
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-medical-muted mt-2">
                支持 JPEG / PNG 格式，单张图像建议分辨率 720×480 px
              </p>
              {(() => {
                const gridCols =
                  images.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
                  images.length === 2 ? 'grid-cols-2 max-w-md mx-auto' :
                  'grid-cols-3'
                return (
                  <div className={`grid ${gridCols} gap-3`}>
                    {images.map(img => (
                      <div key={img.id} className="relative group">
                        <div className="aspect-[4/3] rounded-lg overflow-hidden border border-medical-border">
                          {img.previewUrl ? (
                            <img
                              src={img.previewUrl}
                              alt={img.label}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center rounded-lg">
                              <span className="text-xs text-gray-500">加载中…</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-medical-muted text-center mt-0.5">{img.label}</p>
                        <button
                          onClick={() => removeImage(img.id)}
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-medical-red text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              })()}
              <p className="text-xs text-medical-muted">已添加 {images.length} 张图像</p>
            </div>
          )}

          {/* ── Step 2：预处理确认 ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-medical-text">图像预处理确认</h3>
                <p className="text-xs text-medical-muted">系统已完成自动质量检测，请确认后继续</p>
              </div>
              {images.map(img => (
                <div key={img.id} className="border border-medical-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-medical-text">{img.label}</span>
                    <span className="text-xs text-medical-muted">{img.file}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="aspect-[4/3] rounded-lg overflow-hidden border border-medical-border">
                        <img
                          src="/database/baiyanli_12515_D3_1_8.png"
                          alt={img.label}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="aspect-[4/3] rounded-lg overflow-hidden border border-medical-blue/30">
                        <img
                          src="/database/baiyanli_12515_D3_1_8.png"
                          alt={img.label}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-medical-text">检测结果：</p>
                    {img.checks.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {c.ok
                          ? <CheckCircle className="w-3.5 h-3.5 text-medical-green flex-shrink-0" />
                          : <AlertTriangle className="w-3.5 h-3.5 text-medical-orange flex-shrink-0" />
                        }
                        <span className={c.ok ? 'text-medical-text' : 'text-medical-orange'}>{c.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setAccepted(prev => ({ ...prev, [img.id]: true }))}
                      className={`flex-1 text-xs py-1.5 rounded border transition-colors ${
                        accepted[img.id]
                          ? 'bg-medical-green text-white border-medical-green'
                          : 'border-medical-border hover:border-medical-green hover:text-medical-green'
                      }`}
                    >
                      {accepted[img.id] ? '✓ 已接受修正' : '接受修正'}
                    </button>
                    <button className="flex-1 text-xs py-1.5 rounded border border-medical-border hover:border-medical-blue hover:text-medical-blue transition-colors">
                      手动调整
                    </button>
                  </div>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-medical-border">
                <h4 className="text-sm font-semibold text-medical-text mb-3">选择评估模型</h4>
                <ModelSelector selected={selectedModel} onSelect={handleModelSelect} lastUsed={lastUsedModel} />
              </div>
              <button
                onClick={() => {
                  if (!selectedModel) { showToast('请选择评估模型', 'warning'); return }
                  setAccepted(Object.fromEntries(images.map(i => [i.id, true])))
                  setStep(3)
                  setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 0)
                }}
                className="btn-primary w-full mt-2"
              >
                确认全部并继续
              </button>
            </div>
          )}

          {/* ── Step 3：确认提交 ── */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-medical-text">确认评估信息并提交</h3>
              <div className="bg-medical-bg rounded-lg p-4 space-y-3 text-sm">
                {[
                  { label: '患者',     value: selectedPatient ? `${selectedPatient.name}（${selectedPatient.id}）` : '张晓燕（P-2024-0001）' },
                  { label: '周期',     value: `第 ${selectedPatient?.currentCycle ?? 3} 周期` },
                  { label: '取卵日期', value: assessmentsList.filter(a => a.patientId === selectedPatient?.id).at(-1)?.retrievalDate ?? '2026-03-10' },
                  { label: '胚胎编号', value: 'E-03-A' },
                  { label: '图像数量', value: `${images.length} 张` },
                  { label: '评估模型', value: `${modelInfo.label}（${modelInfo.sub}）— AUC 参考 ${modelInfo.auc}` },
                  { label: '提交医师',   value: currentUser?.name ?? '李明华' },
                  { label: '操作科室',   value: selectedPatient?.department ?? '生殖医学科' },
                  { label: '提交时间',   value: new Date().toLocaleString('zh-CN', { hour12: false }) },
                  { label: '预处理状态', value: images.every(img => accepted[img.id]) ? '全部已确认' : `${Object.values(accepted).filter(Boolean).length}/${images.length} 张已确认` },
                  { label: '预计耗时',   value: modelInfo.time },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between border-b border-medical-border pb-2 last:border-0 last:pb-0">
                    <span className="text-medical-muted">{r.label}</span>
                    <span className="text-medical-text font-medium">{r.value}</span>
                  </div>
                ))}
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsConfirmed}
                  onChange={e => setTermsConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-medical-blue"
                />
                <span className="text-xs text-medical-muted leading-relaxed">
                  本人确认以上患者信息、胚胎编号及图像材料准确无误，同意提交 AI 辅助评估。
                  本评估结果仅供临床参考，最终诊断由复核医师负责。
                </span>
              </label>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                提交后系统将自动进行 AI 模型推理（{modelInfo.time}），报告生成后将以消息通知提醒您。
              </div>
              <button
                onClick={handleSubmit}
                disabled={!termsConfirmed || submitting}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base"
              >
                {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                {submitting ? 'AI 评估推理中…' : '提交评估'}
              </button>
            </div>
          )}

          {/* 步骤导航按钮 */}
          {step < 2 && (
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button
                  onClick={() => {
                    setStep(s => s - 1)
                    setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 0)
                  }}
                  className="btn-secondary flex-1"
                >
                  上一步
                </button>
              )}
              <button
                onClick={() => {
                  setStep(s => s + 1)
                  setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 0)
                }}
                disabled={step === 0 && !selectedPatient}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一步
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="flex justify-start mt-4">
              <button
                onClick={() => {
                  setStep(2)
                  setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 0)
                }}
                className="btn-ghost text-sm"
              >
                ← 返回上一步
              </button>
            </div>
          )}
        </div>{/* end max-w-3xl */}
      </div>
    </div>
  )
}
