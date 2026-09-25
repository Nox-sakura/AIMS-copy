/**
 * main.jsx — 应用入口
 * 挂载 React 根节点，AppProvider 包裹全局状态（用户/Toast）。
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AppProvider } from './context/AppContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
)
