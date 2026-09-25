/**
 * MockImagePlaceholder — 图像占位块
 * 用于替代真实显微镜图像，标注尺寸与用途。
 *
 * Props:
 *   width   {string}  CSS 宽度，默认 '100%'
 *   height  {string}  CSS 高度，默认 '200px'
 *   label   {string}  用途说明文字
 *   tag     {string}  右上角标签（如 '原图' / '热力图' / '修正图'）
 *   variant {'dark'|'light'}  配色变体，默认 'light'
 *   processed {bool}  是否显示"图像已处理"标注（医疗合规要求）
 */
export default function MockImagePlaceholder({
  width = '100%',
  height = '200px',
  label = '图像占位',
  tag,
  variant = 'light',
  processed = false,
}) {
  const bg = variant === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
  const border = variant === 'dark' ? 'border-gray-700' : 'border-medical-border'
  const textColor = variant === 'dark' ? 'text-gray-400' : 'text-medical-muted'
  const iconColor = variant === 'dark' ? 'text-gray-600' : 'text-gray-300'

  return (
    <div
      className={`relative rounded-lg border-2 border-dashed ${bg} ${border} flex flex-col items-center justify-center overflow-hidden`}
      style={{ width, height }}
    >
      {/* 右上角类型标签 */}
      {tag && (
        <span className="absolute top-2 right-2 text-xs bg-medical-blue text-white px-2 py-0.5 rounded">
          {tag}
        </span>
      )}

      {/* 图像已处理合规标注 */}
      {processed && (
        <span className="absolute top-2 left-2 text-xs bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          图像已处理
        </span>
      )}

      {/* 图像图标 */}
      <svg className={`w-12 h-12 ${iconColor} mb-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>

      {/* 用途说明 */}
      <p className={`text-sm ${textColor}`}>{label}</p>
      <p className={`text-xs ${textColor} mt-0.5 opacity-60`}>{width} × {height}</p>
    </div>
  )
}
