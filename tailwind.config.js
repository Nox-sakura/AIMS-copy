/**
 * tailwind.config.js — Tailwind CSS 配置
 *
 * 自定义 medical 色彩系统（全局 CSS token）：
 *   medical-blue       #1A6EBD  主色（按钮/链接/激活状态）
 *   medical-blue-light #E8F2FB  主色浅背景（选中行/标签背景）
 *   medical-blue-dark  #155A99  主色深（hover 深色）
 *   medical-green      #27AE60  成功/Grade 1
 *   medical-orange     #E67E22  警告/Grade 3
 *   medical-red        #E74C3C  错误/Grade 4/驳回
 *   medical-bg         #F5F7FA  页面灰背景
 *   medical-border     #DDE3EC  边框/分割线
 *   medical-text       #2C3E50  主文字色
 *   medical-muted      #7F8C8D  次要文字色
 *
 * 字体优先级：PingFang SC（macOS）> 微软雅黑（Windows）> Helvetica Neue > Arial
 * @type {import('tailwindcss').Config}
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          blue:    '#1A6EBD',
          'blue-light': '#E8F2FB',
          'blue-dark':  '#155A99',
          green:   '#27AE60',
          orange:  '#E67E22',
          red:     '#E74C3C',
          bg:      '#F5F7FA',
          border:  '#DDE3EC',
          text:    '#2C3E50',
          muted:   '#7F8C8D',
        },
      },
      fontFamily: {
        sans: [
          'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue',
          'Arial', 'sans-serif',
        ],
      },
      fontSize: {
        base: ['14px', '1.6'],
      },
    },
  },
  plugins: [],
}
