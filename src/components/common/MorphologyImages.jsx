import { linkedRegion } from '../../utils/morphologyEvidence'
export default function MorphologyImages({ record, selected, compact = false }) {
  const img = record.image
  const box = linkedRegion(record, selected)
  return <div className="grid grid-cols-2 gap-4">
    {[{ src: img?.heatmap?.imageId === img?.id ? img?.heatmap?.src : null, label: img?.source === 'demo' ? '示例热图 · 分级关注区域' : '分级关注区域' }, { src: img?.src, label: img?.source === 'demo' ? '示例图像' : '原始显微镜图像', original: true }].map(item => <div key={item.label}>
      <div style={compact ? {height: 170} : undefined} className={`${compact ? '' : 'aspect-[4/3]'} rounded-lg border border-medical-border overflow-hidden bg-gray-100 relative flex items-center justify-center`}>
        {item.src ? <div className="relative"><img src={item.src} alt={item.label} style={{maxHeight: compact ? 170 : 256}} className="max-w-full object-contain" />{item.original && box && <div className="absolute border-2 border-medical-blue" style={{ left: `${box[0]*100}%`, top: `${box[1]*100}%`, width: `${box[2]*100}%`, height: `${box[3]*100}%` }} />}</div> : <span className="text-xs text-medical-muted">暂无{item.original ? '关联图像' : '关注区域图'}</span>}
      </div><p className="text-xs text-medical-muted text-center mt-1.5">{item.label}</p>
      {item.original && selected && <p className="text-xs text-medical-blue text-center mt-1.5">{selected.name}：{box ? '已关联区域标注' : '该项暂无区域标注'}</p>}
    </div>)}
  </div>
}
