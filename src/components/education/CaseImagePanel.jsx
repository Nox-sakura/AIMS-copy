/**
 * CaseImagePanel.jsx — 胚胎图像展示面板
 * 被 CaseAgent 和 TrainingGround 共同复用
 */
import { useState } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, X, Microscope } from 'lucide-react'

function InfoItem({ label, value, valueClass = 'text-gray-700' }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-xs font-medium ${valueClass}`}>{value}</span>
    </div>
  )
}

function ImageZoomModal({ imageUrl, caseId, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/80 hover:text-white
                     flex items-center gap-1.5 text-sm transition-colors"
        >
          <X className="w-5 h-5" />
          关闭
        </button>
        <span className="absolute top-2 left-2 z-10 bg-yellow-400 text-yellow-900
                         text-xs font-semibold px-2 py-1 rounded-br-lg">
          训练用脱敏图像 · 非真实患者记录
        </span>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`胚胎图像放大 ${caseId}`}
            className="w-full h-full object-contain rounded-lg"
          />
        ) : (
          <div className="aspect-[3/2] bg-gray-800 rounded-lg flex flex-col
                          items-center justify-center gap-3">
            <Microscope className="w-16 h-16 text-gray-500" />
            <p className="text-gray-400 text-sm">Day 3 胚胎图像 · {caseId}</p>
          </div>
        )}
        <p className="text-center text-white/50 text-xs mt-3">
          点击图像外区域或右上角关闭 · 图像仅供训练参考
        </p>
      </div>
    </div>
  )
}

export default function CaseImagePanel({ caseData, onPrev, onNext, showNavigation = true }) {
  const [zoomed, setZoomed] = useState(false)

  if (!caseData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center h-full shadow-sm">
        <p className="text-sm text-gray-400">暂无案例数据</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col gap-3">
      {/* 图像展示区 */}
      <div
        className="relative aspect-[3/2] bg-gray-100 border border-gray-200 rounded-lg overflow-hidden cursor-zoom-in group"
        onClick={() => setZoomed(true)}
        title="点击放大查看"
      >
        {/* 脱敏角标（固定显示，不可关闭） */}
        <span className="absolute top-0 left-0 z-10
                         bg-yellow-400 text-yellow-900 text-xs font-semibold
                         px-2 py-1 rounded-br-lg">
          训练用脱敏图像 · 非真实患者记录
        </span>

        {/* 放大图标悬浮提示 */}
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100
                        transition-opacity bg-black/50 rounded-md p-1">
          <ZoomIn className="w-4 h-4 text-white" />
        </div>

        {caseData.imageUrl ? (
          <img
            src={caseData.imageUrl}
            alt={`胚胎图像 ${caseData.id}`}
            className="w-full h-full object-cover"
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        ) : null}

      </div>

      {/* 放大提示小字 */}
      <p className="text-[10px] text-gray-400 text-center -mt-1 flex items-center justify-center gap-1">
        <ZoomIn className="w-3 h-3" />
        点击图像可放大查看细节
      </p>

      {/* 元信息栏 */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <InfoItem label="胚胎类型" value="Day 3 卵裂期胚胎" />
        <InfoItem label="图像编号" value={caseData.id} />
        <InfoItem label="脱敏状态" value="已脱敏 ✓" valueClass="text-green-600" />
        <InfoItem label="匿名状态" value="已匿名化 ✓" valueClass="text-green-600" />
      </div>

      {/* 案例切换按钮 */}
      {showNavigation && (
        <div className="flex gap-2">
          <button
            onClick={onPrev}
            className="flex-1 flex items-center justify-center gap-1
                       px-3 py-2 border rounded-lg text-sm text-gray-600
                       hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            上一案例
          </button>
          <button
            onClick={onNext}
            className="flex-1 flex items-center justify-center gap-1
                       px-3 py-2 border rounded-lg text-sm text-gray-600
                       hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            下一案例
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {zoomed && (
        <ImageZoomModal
          imageUrl={caseData.imageUrl}
          caseId={caseData.id}
          onClose={() => setZoomed(false)}
        />
      )}
    </div>
  )
}
