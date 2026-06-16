export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT:'#1a5e3a', dark:'#134a2d', light:'#2d8a50' },
        forest: { 50:'#eef7f0',100:'#d6ecda',200:'#afdab8',300:'#7dc292',400:'#4da86e',500:'#2d8a50',600:'#1e6e3c',700:'#165530',800:'#0f3d22',900:'#082714' },
        accent:  { DEFAULT:'#0ea5e9', dark:'#0284c7', light:'#38bdf8' },
      },
      fontFamily: {
        sans:    ['"DM Sans"','system-ui','sans-serif'],
        body:    ['"DM Sans"','system-ui','sans-serif'],
        display: ['"DM Sans"','system-ui','sans-serif'],
        mono:    ['"JetBrains Mono"','monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0/0.06),0 1px 2px -1px rgb(0 0 0/0.06)',
        lift: '0 4px 16px -2px rgb(0 0 0/0.10),0 2px 6px -2px rgb(0 0 0/0.06)',
      },
    },
  },
  plugins: [],
}
