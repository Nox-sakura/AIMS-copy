/**
 * PatientPortal.jsx — 患者助手页面（单视角，无 Tab 切换）
 *
 * 直接渲染医生管理视角内容，移除双视角路由结构。
 */
import DoctorView from './patientPortal/DoctorView'

export default function PatientPortal() {
  return (
    <div className="flex flex-col bg-white" style={{ height: 'calc(100vh - 56px)' }}>
      <div className="flex-shrink-0 border-b border-medical-border bg-white px-6 pt-4 pb-3">
        <h1 className="text-base font-semibold text-medical-text">患者助手管理</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <DoctorView />
      </div>
    </div>
  )
}
