import { useEffect } from 'react'

/**
 * ConfirmModal — 二次确认弹窗
 *
 * Props:
 *   open      {bool}    是否显示
 *   title     {string}  弹窗标题
 *   message   {string|node}  提示内容
 *   confirmLabel {string}   确认按钮文字，默认"确认"
 *   cancelLabel  {string}   取消按钮文字，默认"取消"
 *   danger    {bool}    确认按钮是否为危险操作样式（红色）
 *   onConfirm {func}    确认回调
 *   onCancel  {func}    取消回调
 */
export default function ConfirmModal({
  open,
  title = '请确认操作',
  message,
  confirmLabel = '确认',
  cancelLabel  = '取消',
  danger = false,
  onConfirm,
  onCancel,
}) {
  // 打开时锁定 body 滚动
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else       document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 蒙层 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* 弹窗卡片 */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 z-10">
        {/* 标题行 */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
            danger ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            {danger ? (
              <svg className="w-5 h-5 text-medical-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-medical-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-medical-text">{title}</h3>
            {message && (
              <p className="text-sm text-medical-muted mt-1 leading-relaxed">{message}</p>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={onCancel} className="btn-ghost">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={danger ? 'btn-danger' : 'btn-primary'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
