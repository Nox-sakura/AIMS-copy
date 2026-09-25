/**
 * AppContext.jsx — 全局状态管理
 *
 * 提供：
 *   currentUser  — 当前登录用户对象（角色决定页面权限显示）
 *   toasts       — 全局 Toast 消息队列，3秒后自动移除
 *   showToast(message, type)  — 触发一条 Toast 通知
 *   dismissToast(id)          — 手动关闭某条 Toast
 *   switchRole(roleKey)       — 切换当前用户角色（演示用）
 *
 * 使用方式：任意子组件调用 useAppContext() 即可获取以上值。
 */
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { users } from '../mock/users'
import { reports as initialReports } from '../mock/reports'
import { assessments as initialAssessments } from '../mock/assessments'
import { operationLogs as initialLogs } from '../mock/operationLogs'

const AppContext = createContext(null)

// 角色快捷预设，对应 Login 页底部切换按钮
const ROLE_PRESETS = {
  doctor:   users.find(u => u.id === 'U-001'),  // 李明华（主任医师）
  director: users.find(u => u.id === 'U-002'),  // 王芳（副主任医师）
  admin:    users.find(u => u.role === 'admin'), // 系统管理员
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(ROLE_PRESETS.doctor)
  const [toasts, setToasts] = useState([])
  const toastIdRef = useRef(0)
  const [reports, setReports] = useState(initialReports)
  const [assessments, setAssessments] = useState(initialAssessments)
  const [agentOpen, setAgentOpen] = useState(false)
  const [logs, setLogs] = useState(initialLogs)
  const logIdRef = useRef(1000)

  const addLog = useCallback((entry) => {
    const id = `LOG-EDU-${++logIdRef.current}`
    setLogs(prev => [{ id, ...entry }, ...prev])
  }, [])

  const confirmReport = (reportId, doctorName) => {
    const today = new Date().toISOString().slice(0, 10)
    setReports(prev => prev.map(r =>
      r.id === reportId
        ? { ...r, status: 'approved', reviewDoctor: doctorName, reviewDate: today }
        : r
    ))
  }

  const rejectReport = (reportId, doctorName) => {
    const today = new Date().toISOString().slice(0, 10)
    setReports(prev => prev.map(r =>
      r.id === reportId
        ? { ...r, status: 'rejected', reviewDoctor: doctorName, reviewDate: today }
        : r
    ))
  }

  const modifyReportGrade = (reportId, newGrade) => {
    const gradeMap = {
      grade1: '一级胚胎',
      grade2: '二级胚胎',
      grade3: '三级胚胎',
      grade4: '四级胚胎',
    }
    setReports(prev => prev.map(r =>
      r.id === reportId
        ? { ...r, grade: newGrade, gradeLabel: gradeMap[newGrade] ?? newGrade }
        : r
    ))
    setAssessments(prev => prev.map(a => {
      const report = initialReports.find(r => r.assessmentId === a.id)
      if (report?.id === reportId) {
        return { ...a, grade: newGrade, gradeLabel: gradeMap[newGrade] ?? newGrade }
      }
      return a
    }))
  }

  const updateAssessmentStatus = (assessmentId, newStatus) => {
    setAssessments(prev => prev.map(a =>
      a.id === assessmentId ? { ...a, status: newStatus } : a
    ))
  }

  const showToast = useCallback((message, type = 'success') => {
    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const switchRole = useCallback((roleKey) => {
    const preset = ROLE_PRESETS[roleKey]
    if (preset) setCurrentUser(preset)
  }, [])

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser, toasts, showToast, dismissToast, switchRole,
      reports, assessments,
      confirmReport, rejectReport, modifyReportGrade, updateAssessmentStatus,
      agentOpen, setAgentOpen,
      logs, addLog,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}

// Alias for education module components
export function useAuth() {
  const { currentUser, setCurrentUser } = useAppContext()
  return { user: currentUser, setUser: setCurrentUser }
}
