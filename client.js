window.__ModuleLoader__.load({
  id: 'dsh-usage-stats',
  factory: (require) => {
    const module = { exports: {} }
    const React = require('react')
    const ReactDOM = require('react-dom')
    const h = React.createElement

    const API = '/dsh-usage/api/stats'
    const NS = 'dsh-usage-stats'
    const HEAT_DAYS = 365
    const PALETTE = ['#5b8dff', '#22c55e', '#a78bfa', '#f87171', '#fb923c', '#14b8a6', '#e879f9', '#facc15']

    const CSS = `
.dsh-usage-root{display:flex;flex-direction:column;gap:14px;max-width:660px;margin:0 auto;padding:4px 0 24px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5}
.dsh-usage-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.dsh-usage-title{display:flex;align-items:center;gap:8px;margin:0;font-size:20px;font-weight:650;letter-spacing:-.01em}
.dsh-usage-badge{font-size:11px;font-weight:500;color:var(--dsw-alias-label-secondary);border:.5px solid var(--dsw-alias-border-l2);border-radius:999px;padding:2px 8px;white-space:nowrap}
.dsh-usage-sub{margin:2px 0 0;font-size:12px;color:var(--dsw-alias-label-tertiary)}
.dsh-usage-refresh{flex:none;height:28px;padding:0 11px;border:.5px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}
.dsh-usage-refresh:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.1));color:var(--dsw-alias-label-primary)}
.dsh-usage-refresh:disabled{opacity:.55;cursor:default}
.dsh-usage-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
.dsh-usage-card{display:flex;flex-direction:column;gap:2px;min-width:0;padding:9px 10px;border:.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:12px;background:var(--dsw-alias-settings-card-fill,rgba(127,127,127,.06))}
.dsh-usage-label{font-size:10px;color:var(--dsw-alias-label-tertiary);white-space:nowrap}
.dsh-usage-value{font-size:16px;font-weight:650;font-variant-numeric:tabular-nums;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsh-usage-meta{font-size:9px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsh-usage-section{display:flex;flex-direction:column;gap:12px;padding:14px;border:.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:12px;background:var(--dsw-alias-settings-card-fill,rgba(127,127,127,.06))}
.dsh-usage-sectionHead{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap}
.dsh-usage-sectionTitle{font-weight:600}
.dsh-usage-sectionMeta{font-size:12px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}
.dsh-usage-ranges{display:inline-flex;gap:2px;padding:2px;border:.5px solid var(--dsw-alias-border-l2);border-radius:9px;align-self:flex-start}
.dsh-usage-range{height:26px;padding:0 10px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}
.dsh-usage-range:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.1))}
.dsh-usage-range[aria-pressed="true"]{background:#4d6bfe;color:#fff}
.dsh-usage-ranges-sm{padding:1px;border-radius:8px}
.dsh-usage-ranges-sm .dsh-usage-range{height:22px;padding:0 7px;font-size:11px}
.heatScroll{overflow-x:auto;overflow-y:hidden;padding-bottom:2px}
.heatGrid{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,8px);gap:2px;width:max-content}
.heatCell{border-radius:2px;background:rgba(127,127,127,.12)}
.heatCell.l1{background:rgba(91,141,255,.28)}
.heatCell.l2{background:rgba(91,141,255,.48)}
.heatCell.l3{background:rgba(91,141,255,.72)}
.heatCell.l4{background:#5b8dff}
.heatMonths{display:grid;gap:2px;margin-top:5px;font-size:8px;color:var(--dsw-alias-label-tertiary);line-height:1.2}
.heatMonths span{grid-row:1;white-space:nowrap}
.heatFoot{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:10px;color:var(--dsw-alias-label-tertiary)}
.heatLegend{display:flex;align-items:center;gap:3px}
.heatLegendCell{width:8px;height:8px;border-radius:2px;display:inline-block}
.heatLegendCell.l1{background:rgba(91,141,255,.28)}
.heatLegendCell.l2{background:rgba(91,141,255,.48)}
.heatLegendCell.l3{background:rgba(91,141,255,.72)}
.heatLegendCell.l4{background:#5b8dff}
.dsh-usage-empty{display:flex;align-items:center;justify-content:center;height:132px;color:var(--dsw-alias-label-tertiary);font-size:12px}
.trendLegend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.trendLegendItem{display:inline-flex;align-items:center;gap:5px;min-width:0;max-width:180px}
.trendLegendDot{width:7px;height:7px;border-radius:50%;flex:none}
.trendLegendName{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.trendSvg{display:block;width:100%;height:auto;overflow:visible;color:var(--dsw-alias-label-tertiary)}
.trendAxis{display:flex;justify-content:space-between;gap:4px;font-size:10px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;margin-top:-4px}
.donutWrap{display:flex;align-items:center;gap:22px;min-width:0}
.donut{position:relative;width:178px;height:178px;flex:none}
.donut svg{display:block;width:100%;height:100%}
.donutCenter{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;pointer-events:none}
.donutCenter strong{font-size:19px;font-weight:650;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.donutCenter span{font-size:10px;color:var(--dsw-alias-label-tertiary)}
.donutLegend{display:flex;flex-direction:column;gap:8px;flex:1;min-width:0}
.donutRow{display:grid;grid-template-columns:8px minmax(0,1fr) auto;align-items:center;gap:8px;font-size:12px}
.donutDot{width:8px;height:8px;border-radius:50%}
.donutName{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-secondary)}
.donutPercent{font-variant-numeric:tabular-nums;min-width:44px;text-align:right}
.donutDetail{grid-column:2 / 4;font-size:10px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;margin-top:-4px}
.dsh-usage-foot{display:flex;flex-direction:column;gap:3px;font-size:11px;color:var(--dsw-alias-label-tertiary)}
.dsh-usage-tip{position:fixed;z-index:2147483000;pointer-events:none;min-width:120px;max-width:280px;padding:8px 10px;border:.5px solid rgba(127,127,127,.28);border-radius:8px;background:var(--dsw-alias-bg-layer-2,#212124);box-shadow:0 8px 24px rgba(0,0,0,.28);color:var(--dsw-alias-label-primary);font-size:11px;line-height:1.5}
.dsh-usage-tipTitle{font-size:11px;font-weight:600;white-space:nowrap}
.dsh-usage-tipMeta{font-size:10px;color:var(--dsw-alias-label-secondary);white-space:nowrap;margin-top:1px}
.dsh-usage-tipRows{display:flex;flex-direction:column;gap:3px;margin-top:6px}
.dsh-usage-tipRow{display:grid;grid-template-columns:7px minmax(0,1fr) auto;align-items:center;gap:6px;font-size:10px}
.dsh-usage-tipDot{width:7px;height:7px;border-radius:50%}
.dsh-usage-tipName{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-secondary);max-width:150px}
.dsh-usage-tipValue{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);white-space:nowrap}
.dsh-usage-error{color:var(--dsw-alias-state-error-primary,#dc2626);font-size:12px}
.dsh-usage-loading{display:flex;flex-direction:column;gap:10px;padding:24px 14px;border:.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:12px;background:var(--dsw-alias-settings-card-fill,rgba(127,127,127,.06))}
.dsh-usage-skeleton{height:10px;border-radius:6px;background:linear-gradient(90deg,rgba(127,127,127,.12),rgba(127,127,127,.24),rgba(127,127,127,.12));background-size:200% 100%;animation:dsh-usage-shimmer 1.4s linear infinite}
@keyframes dsh-usage-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}
@media (max-width:560px){.dsh-usage-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.donutWrap{flex-direction:column;align-items:stretch}.donut{align-self:center}.dsh-usage-title{font-size:18px}}
@media (prefers-reduced-motion:reduce){.dsh-usage-skeleton{animation:none}}
`

    const zero = () => ({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 })

    const trim = (text) => text.replace(/\.0$/, '')

    function formatTokens(value) {
      if (!Number.isFinite(value) || value <= 0) return '0'
      if (value >= 1e8) return `${trim((value / 1e8).toFixed(1))} 亿`
      if (value >= 1e4) return `${trim((value / 1e4).toFixed(1))} 万`
      return Math.round(value).toLocaleString('zh-CN')
    }

    function exact(value) {
      return Math.round(value).toLocaleString('zh-CN')
    }

    function selfTime(timestamp) {
      if (!Number.isFinite(timestamp)) return ''
      return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }

    function shortDate(key) {
      return key === undefined ? '' : key.slice(5).replace('-', '/')
    }

    function longDate(key) {
      if (key === undefined || key === '') return '—'
      const [, month, day] = key.split('-')
      return `${Number(month)}月${Number(day)}日`
    }

    function fullDate(key) {
      if (key === undefined || key === '') return ''
      const [year, month, day] = key.split('-')
      return `${year}年${Number(month)}月${Number(day)}日`
    }

    const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum)

    function localKey(date) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

    function todayKey() {
      return localKey(new Date())
    }

    function addDays(date, delta) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta)
    }

    function formatDuration(ms) {
      const minutes = Math.max(0, Math.round((Number.isFinite(ms) ? ms : 0) / 60000))
      if (minutes < 60) return `${minutes} 分钟`
      const hours = Math.floor(minutes / 60)
      const rest = minutes % 60
      return rest === 0 ? `${hours} 小时` : `${hours} 小时 ${rest} 分钟`
    }

    function formatDurationShort(ms) {
      const minutes = Math.max(0, Math.round((Number.isFinite(ms) ? ms : 0) / 60000))
      if (minutes < 60) return `${minutes} 分钟`
      return `${trim((minutes / 60).toFixed(1))} 小时`
    }

    function addBuckets(target, source) {
      target.input += source.input
      target.output += source.output
      target.cacheRead += source.cacheRead
      target.cacheWrite += source.cacheWrite
      target.total += source.total
    }

    function fillRange(days, range) {
      if (range === 'all') return days
      const byDate = new Map(days.map((day) => [day.date, day]))
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const out = []
      for (let offset = range - 1; offset >= 0; offset -= 1) {
        const date = addDays(today, -offset)
        const key = localKey(date)
        out.push(byDate.get(key) ?? { date: key, ...zero() })
      }
      return out
    }

    function rangeTotal(days) {
      const total = zero()
      for (const day of days) addBuckets(total, day)
      return total
    }

    function computeStreaks(days) {
      const active = new Set(days.filter((day) => day.total > 0).map((day) => day.date))
      const sorted = [...active].sort()
      let longest = 0
      let run = 0
      let previous
      for (const date of sorted) {
        const current = new Date(`${date}T00:00:00`)
        run = previous !== undefined && Math.round((current - previous) / 86400000) === 1 ? run + 1 : 1
        longest = Math.max(longest, run)
        previous = current
      }
      let current = 0
      const cursor = new Date()
      cursor.setHours(0, 0, 0, 0)
      if (!active.has(localKey(cursor))) cursor.setDate(cursor.getDate() - 1)
      while (active.has(localKey(cursor))) {
        current += 1
        cursor.setDate(cursor.getDate() - 1)
      }
      return { current, longest }
    }

    function modelsInRange(modelDays, days) {
      const wanted = new Set(days.map((day) => day.date))
      const totals = new Map()
      for (const row of modelDays) {
        if (!wanted.has(row.date)) continue
        for (const entry of row.models) {
          totals.set(entry.model, (totals.get(entry.model) ?? 0) + entry.total)
        }
      }
      return [...totals]
        .map(([model, total]) => ({ model, total }))
        .filter((entry) => entry.total > 0)
        .sort((left, right) => right.total - left.total)
    }

    function heatData(days, mode) {
      const byDate = new Map(days.map((day) => [day.date, day]))
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      let start = addDays(today, -(HEAT_DAYS - 1))
      start = addDays(start, -start.getDay())
      const dates = []
      for (let date = start; date <= today; date = addDays(date, 1)) dates.push(date)
      const daily = dates.map((date) => byDate.get(localKey(date))?.total ?? 0)
      const dailyTurns = dates.map((date) => byDate.get(localKey(date))?.turns ?? 0)
      const weekTotals = new Map()
      const weekTurns = new Map()
      for (let index = 0; index < daily.length; index += 1) {
        const week = Math.floor(index / 7)
        weekTotals.set(week, (weekTotals.get(week) ?? 0) + daily[index])
        weekTurns.set(week, (weekTurns.get(week) ?? 0) + dailyTurns[index])
      }
      let cumulative = 0
      let cumulativeTurns = 0
      const cumulativeValues = daily.map((value) => {
        cumulative += value
        return cumulative
      })
      const cumulativeTurnValues = dailyTurns.map((value) => {
        cumulativeTurns += value
        return cumulativeTurns
      })
      const values = mode === 'week'
        ? dates.map((_, index) => weekTotals.get(Math.floor(index / 7)) ?? 0)
        : mode === 'total'
          ? cumulativeValues
          : daily
      const turns = mode === 'week'
        ? dates.map((_, index) => weekTurns.get(Math.floor(index / 7)) ?? 0)
        : mode === 'total'
          ? cumulativeTurnValues
          : dailyTurns
      const max = Math.max(1, ...values)
      const cells = dates.map((date, index) => {
        const value = values[index]
        const ratio = value / max
        const level = value === 0 ? 0 : ratio >= 0.75 ? 4 : ratio >= 0.5 ? 3 : ratio >= 0.25 ? 2 : 1
        return { date: localKey(date), value, turns: turns[index], level }
      })
      const months = []
      let lastMonth = -1
      for (let index = 0; index < dates.length; index += 1) {
        const date = dates[index]
        if (date.getMonth() === lastMonth) continue
        if (index === 0 || date.getDate() === 1) {
          lastMonth = date.getMonth()
          months.push({ column: Math.floor(index / 7) + 1, label: `${date.getMonth() + 1}月` })
        }
      }
      return { cells, columns: Math.ceil(cells.length / 7), months }
    }

    function Progress() {
      return h('div', { className: 'dsh-usage-loading' },
        h('div', { style: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)' } }, '正在统计全部会话…'),
        h('div', { className: 'dsh-usage-skeleton', style: { width: '88%' } }),
        h('div', { className: 'dsh-usage-skeleton', style: { width: '62%' } }),
        h('div', { className: 'dsh-usage-skeleton', style: { width: '74%' } }),
        h('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } },
          '首次打开需要扫描本机所有会话日志，几秒到几十秒不等。'))
    }

    function Card(props) {
      return h('div', { className: 'dsh-usage-card' },
        h('span', { className: 'dsh-usage-label' }, props.label),
        h('strong', { className: 'dsh-usage-value', title: props.exactValue }, props.value),
        h('span', { className: 'dsh-usage-meta', title: props.metaTitle ?? undefined }, props.meta))
    }

    function Heatmap(props) {
      const [mode, setMode] = React.useState('day')
      const [tip, setTip] = React.useState()
      const data = heatData(props.days, mode)
      const modes = [['day', '每日'], ['week', '每周'], ['total', '累计']]
      const showTip = (event, cell) => {
        if (cell.value === 0) {
          setTip(undefined)
          return
        }
        const rect = event.currentTarget.getBoundingClientRect()
        const dialog = event.currentTarget.closest('[role="dialog"]')
        const bounds = dialog?.getBoundingClientRect()
        const leftEdge = bounds?.left ?? 0
        const rightEdge = bounds?.right ?? (typeof window === 'undefined' ? 1280 : window.innerWidth)
        const topEdge = bounds?.top ?? 0
        const above = rect.top - 60 > topEdge
        const center = rect.left + rect.width / 2
        let left = center
        let transform = above ? 'translate(-50%,-100%)' : 'translate(-50%,0)'
        if (center + 90 > rightEdge - 8) {
          left = rect.left - 6
          transform = above ? 'translate(-100%,-100%)' : 'translate(-100%,0)'
        } else if (center - 90 < leftEdge + 8) {
          left = rect.right + 6
          transform = above ? 'translate(0,-100%)' : 'translate(0,0)'
        }
        setTip({
          cell,
          left,
          top: above ? rect.top - 8 : rect.bottom + 8,
          transform,
        })
      }
      const tipNode = tip === undefined ? null : ReactDOM.createPortal(h('div', {
        className: 'dsh-usage-tip',
        style: {
          left: tip.left,
          top: tip.top,
          transform: tip.transform,
        },
      },
      h('div', { className: 'dsh-usage-tipTitle' }, fullDate(tip.cell.date)),
      h('div', { className: 'dsh-usage-tipMeta' },
        `${mode === 'week' ? '本周 ' : mode === 'total' ? '截至 ' : ''}${formatTokens(tip.cell.value)} tokens${tip.cell.turns > 0 ? ` · ${tip.cell.turns} 轮消息` : ''}`)),
      document.body)
      const section = h('section', { className: 'dsh-usage-section' },
        h('div', { className: 'dsh-usage-sectionHead' },
          h('span', { className: 'dsh-usage-sectionTitle' }, 'Token 活动'),
          h('div', { className: 'dsh-usage-ranges dsh-usage-ranges-sm', role: 'group', 'aria-label': '活动聚合' },
            modes.map(([value, label]) => h('button', {
              key: value,
              type: 'button',
              className: 'dsh-usage-range',
              'aria-pressed': mode === value ? 'true' : 'false',
              onClick: () => setMode(value),
            }, label)))),
        h('div', { className: 'heatScroll' },
          h('div', {
            className: 'heatGrid',
            style: { gridTemplateColumns: `repeat(${data.columns}, 8px)` },
          }, data.cells.map((cell) => h('div', {
            key: cell.date,
            className: `heatCell${cell.level === 0 ? '' : ` l${cell.level}`}`,
            onMouseEnter: (event) => showTip(event, cell),
            onMouseLeave: () => setTip(undefined),
          })))),
        h('div', {
          className: 'heatMonths',
          style: { gridTemplateColumns: `repeat(${data.columns}, 8px)` },
        }, data.months.map((month) => h('span', {
          key: `${month.column}-${month.label}`,
          style: { gridColumnStart: month.column },
        }, month.label))),
        h('div', { className: 'heatFoot' },
          h('span', null, '近 12 个月'),
          h('div', { className: 'heatLegend' },
            h('span', null, '少'),
            [0, 1, 2, 3, 4].map((level) => h('span', {
              key: level,
              className: `heatLegendCell${level === 0 ? '' : ` l${level}`}`,
              style: { background: level === 0 ? 'rgba(127,127,127,.12)' : undefined },
            })),
            h('span', null, '多'))))
      return h(React.Fragment, null, section, tipNode)
    }

    function TrendChart(props) {
      const { days, models, modelDays, rangeLabel, colors } = props
      const lookup = new Map()
      for (const row of modelDays) {
        const values = new Map()
        for (const entry of row.models) values.set(entry.model, entry.total)
        lookup.set(row.date, values)
      }
      const top = models.slice(0, 5)
      const rest = models.slice(5)
      const series = top.map((entry, index) => ({
        name: entry.model,
        color: colors.get(entry.model) ?? PALETTE[index % PALETTE.length],
        values: days.map((day) => lookup.get(day.date)?.get(entry.model) ?? 0),
      }))
      if (rest.length > 0) {
        series.push({
          name: '其他',
          color: '#94a3b8',
          values: days.map((day) => {
            const values = lookup.get(day.date)
            if (values === undefined) return 0
            return rest.reduce((sum, entry) => sum + (values.get(entry.model) ?? 0), 0)
          }),
        })
      }
      const total = rangeTotal(days).total
      const max = Math.max(1, ...series.flatMap((entry) => entry.values))
      const width = 640
      const height = 168
      const pad = 8
      const plot = height - pad * 2
      const x = (index) => days.length <= 1 ? 0 : (index / (days.length - 1)) * width
      const y = (value) => pad + plot - (value / max) * plot
      const ticks = [...new Set([0, Math.floor((days.length - 1) / 4), Math.floor((days.length - 1) / 2), Math.floor(((days.length - 1) * 3) / 4), days.length - 1])].filter((index) => index >= 0)
      const [tip, setTip] = React.useState()

      const moveTip = (event) => {
        if (days.length === 0) return
        const rect = event.currentTarget.getBoundingClientRect()
        const ratio = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1)
        const index = days.length <= 1 ? 0 : Math.round(ratio * (days.length - 1))
        const day = days[index]
        if (day.total === 0) {
          setTip(undefined)
          return
        }
        const values = lookup.get(day.date)
        const rows = models
          .map((entry, position) => ({
            model: entry.model,
            value: values?.get(entry.model) ?? 0,
            color: colors.get(entry.model) ?? PALETTE[position % PALETTE.length],
          }))
          .filter((row) => row.value > 0)
          .sort((left, right) => right.value - left.value)
        const dialog = document.querySelector('[role="dialog"]')
        const bounds = dialog?.getBoundingClientRect()
        const leftEdge = bounds?.left ?? 8
        const rightEdge = bounds?.right ?? (typeof window === 'undefined' ? 1272 : window.innerWidth - 8)
        const topEdge = bounds?.top ?? 8
        const bottomEdge = bounds?.bottom ?? (typeof window === 'undefined' ? 892 : window.innerHeight - 8)
        const tipWidth = 260
        const tipHeight = 190
        let left = event.clientX + 14
        if (left + tipWidth > rightEdge - 8) left = event.clientX - tipWidth - 14
        left = clamp(left, leftEdge + 8, rightEdge - tipWidth - 8)
        let top = event.clientY + 14
        if (top + tipHeight > bottomEdge - 8) top = event.clientY - tipHeight - 14
        top = clamp(top, topEdge + 8, bottomEdge - tipHeight - 8)
        setTip({ index, left, top, date: day.date, total: day.total, rows })
      }

      let tipNode = null
      if (tip !== undefined) {
        const rows = tip.rows.slice(0, 6)
        const restRows = tip.rows.slice(6)
        if (restRows.length > 0) {
          rows.push({ model: '其他', value: restRows.reduce((sum, row) => sum + row.value, 0), color: '#94a3b8' })
        }
        tipNode = ReactDOM.createPortal(h('div', {
          className: 'dsh-usage-tip',
          style: {
            left: tip.left,
            top: tip.top,
          },
        },
        h('div', { className: 'dsh-usage-tipTitle' }, `${longDate(tip.date)} · ${formatTokens(tip.total)} tokens`),
        rows.length === 0
          ? h('div', { className: 'dsh-usage-tipMeta' }, '暂无模型明细')
          : h('div', { className: 'dsh-usage-tipRows' }, rows.map((row) => h('div', { className: 'dsh-usage-tipRow', key: row.model },
            h('span', { className: 'dsh-usage-tipDot', style: { background: row.color } }),
            h('span', { className: 'dsh-usage-tipName' }, row.model),
            h('span', { className: 'dsh-usage-tipValue' }, `${formatTokens(row.value)} tokens`))))),
        document.body)
      }

      const section = h('section', { className: 'dsh-usage-section' },
        h('div', { className: 'dsh-usage-sectionHead' },
          h('span', { className: 'dsh-usage-sectionTitle' }, '每日 Token 趋势图'),
          h('span', { className: 'dsh-usage-sectionMeta' }, `${rangeLabel} · ${formatTokens(total)}`)),
        series.length === 0
          ? h('div', { className: 'dsh-usage-empty' }, '这段时间还没有按模型区分的用量。')
          : h('div', { className: 'trendLegend' }, series.map((entry) => h('span', {
            key: entry.name,
            className: 'trendLegendItem',
            title: entry.name,
          }, h('span', { className: 'trendLegendDot', style: { background: entry.color } }),
          h('span', { className: 'trendLegendName' }, entry.name)))),
        series.length === 0 ? null : h('svg', {
          className: 'trendSvg',
          viewBox: `0 0 ${width} ${height}`,
          role: 'img',
          'aria-label': '每日 Token 趋势图',
        },
        [0, 0.25, 0.5, 0.75, 1].map((ratio) => h('line', {
          key: ratio,
          x1: 0,
          x2: width,
          y1: pad + plot * (1 - ratio),
          y2: pad + plot * (1 - ratio),
          stroke: 'currentColor',
          strokeOpacity: 0.08,
          strokeDasharray: '3 4',
        })),
        series.map((entry) => h('polyline', {
          key: entry.name,
          points: entry.values.map((value, index) => `${x(index)},${y(value)}`).join(' '),
          fill: 'none',
          stroke: entry.color,
          strokeWidth: 2,
          strokeLinejoin: 'round',
          strokeLinecap: 'round',
          vectorEffect: 'non-scaling-stroke',
        })),
        series.flatMap((entry) => entry.values.map((value, index) => value === 0 ? null : h('circle', {
          key: `${entry.name}-${index}`,
          cx: x(index),
          cy: y(value),
          r: tip !== undefined && tip.index === index ? 3.5 : 2,
          fill: entry.color,
          stroke: tip !== undefined && tip.index === index ? 'rgba(0,0,0,.35)' : 'none',
          strokeWidth: 1,
        }))),
        tip === undefined ? null : h('line', {
          x1: x(tip.index),
          x2: x(tip.index),
          y1: pad,
          y2: pad + plot,
          stroke: 'currentColor',
          strokeOpacity: 0.18,
          strokeDasharray: '3 3',
        }),
        h('rect', {
          key: 'hover',
          x: 0,
          y: 0,
          width,
          height,
          fill: 'transparent',
          onMouseMove: moveTip,
          onMouseLeave: () => setTip(undefined),
          style: { cursor: 'crosshair' },
        })),
        series.length === 0 ? null : h('div', { className: 'trendAxis' },
          ticks.map((index) => h('span', { key: index }, shortDate(days[index]?.date)))))
      return h(React.Fragment, null, section, tipNode)
    }

    function ModelDonut(props) {
      const { models, total, rangeLabel, colors } = props
      const entries = models.slice(0, 6)
      const rest = models.slice(6)
      if (rest.length > 0) {
        entries.push({ model: '其他', total: rest.reduce((sum, entry) => sum + entry.total, 0) })
      }
      const sum = entries.reduce((value, entry) => value + entry.total, 0)
      const radius = 62
      const circumference = 2 * Math.PI * radius
      let offset = 0
      const segments = entries.map((entry, index) => {
        const fraction = sum === 0 ? 0 : entry.total / sum
        const length = fraction * circumference
        const visible = Math.max(0, length - 1.5)
        const segment = {
          ...entry,
          color: entry.model === '其他' ? '#94a3b8' : (colors.get(entry.model) ?? PALETTE[index % PALETTE.length]),
          dash: `${visible} ${circumference - visible}`,
          offset: -offset,
          percent: sum === 0 ? 0 : fraction * 100,
        }
        offset += length
        return segment
      })
      const donut = h('div', { className: 'donut' },
        h('svg', { viewBox: '0 0 180 180', role: 'img', 'aria-label': '模型用量占比' },
          h('circle', { cx: 90, cy: 90, r: radius, fill: 'none', stroke: 'rgba(127,127,127,.12)', strokeWidth: 24 }),
          h('g', { transform: 'rotate(-90 90 90)' }, segments.map((segment) => h('circle', {
            key: segment.model,
            cx: 90,
            cy: 90,
            r: radius,
            fill: 'none',
            stroke: segment.color,
            strokeWidth: 24,
            strokeDasharray: segment.dash,
            strokeDashoffset: segment.offset,
          })))),
        h('div', { className: 'donutCenter' },
          h('strong', null, formatTokens(sum)),
          h('span', null, 'tokens')))
      const legend = h('div', { className: 'donutLegend' },
        segments.map((segment) => h('div', { className: 'donutRow', key: segment.model },
          h('span', { className: 'donutDot', style: { background: segment.color } }),
          h('span', { className: 'donutName', title: segment.model }, segment.model),
          h('span', { className: 'donutPercent' }, `${segment.percent >= 10 ? segment.percent.toFixed(0) : segment.percent.toFixed(1)}%`),
          h('span', { className: 'donutDetail' }, `${exact(segment.total)} tokens`))))
      return h('section', { className: 'dsh-usage-section' },
        h('div', { className: 'dsh-usage-sectionHead' },
          h('span', { className: 'dsh-usage-sectionTitle' }, '模型用量'),
          h('span', { className: 'dsh-usage-sectionMeta' }, `${rangeLabel} · ${formatTokens(sum)}`)),
        entries.length === 0
          ? h('div', { className: 'dsh-usage-empty' }, '这段时间还没有可展示的模型用量。')
          : h('div', { className: 'donutWrap' }, donut, legend))
    }

    function UsagePage() {
      const [state, setState] = React.useState({ phase: 'loading' })
      const [range, setRange] = React.useState(30)

      const load = React.useCallback(async (force) => {
        setState((previous) => ({ phase: 'loading', data: previous.data }))
        try {
          const response = await fetch(`${API}${force ? '?refresh=1' : ''}`, { cache: 'no-store' })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const data = await response.json()
          if (!Array.isArray(data?.days) || data?.totals === undefined) throw new Error('bad response')
          setState({ phase: 'ready', data })
        } catch (error) {
          setState({ phase: 'error', error: error instanceof Error ? error.message : String(error) })
        }
      }, [])

      React.useEffect(() => {
        void load(false)
      }, [load])

      if (state.phase === 'loading' && state.data === undefined) return h('div', { className: 'dsh-usage-root' }, h(Progress))

      const refreshButton = h('button', {
        type: 'button',
        className: 'dsh-usage-refresh',
        disabled: state.phase === 'loading',
        onClick: () => { void load(true) },
      }, state.phase === 'loading' ? '刷新中…' : '刷新')

      if (state.phase === 'error') {
        return h('div', { className: 'dsh-usage-root' },
          h('div', { className: 'dsh-usage-head' },
            h('div', null,
              h('h2', { className: 'dsh-usage-title' }, '使用统计', h('span', { className: 'dsh-usage-badge' }, '全部会话')),
              h('p', { className: 'dsh-usage-sub' }, '读取本机全部会话日志，汇总一段时间的 Token 用量。')),
            refreshButton),
          h('div', { className: 'dsh-usage-section' },
            h('div', { className: 'dsh-usage-error' }, `统计失败：${state.error}`),
            h('div', { className: 'dsh-usage-foot' }, '可以重试；若持续失败，请查看 Host 日志。')),
          h('button', { type: 'button', className: 'dsh-usage-refresh', onClick: () => { void load(true) } }, '重试'))
      }

      const data = state.data
      const days = data.days ?? []
      const modelDays = data.modelDays ?? []
      const all = data.totals ?? zero()
      const peak = days.reduce((best, day) => day.total > best.total ? day : best, { date: '', ...zero() })
      const today = days.find((day) => day.date === todayKey()) ?? { date: todayKey(), ...zero() }
      const streaks = computeStreaks(days)
      const selected = fillRange(days, range)
      const selectedTotals = rangeTotal(selected)
      const models = modelsInRange(modelDays, selected)
      const colors = new Map((data.models ?? []).map((entry, index) => [entry.model, PALETTE[index % PALETTE.length]]))
      const rangeLabel = range === 'all' ? '全部' : `近 ${range} 日`

      const head = h('div', { className: 'dsh-usage-head' },
        h('div', null,
          h('h2', { className: 'dsh-usage-title' },
            '使用统计',
            h('span', { className: 'dsh-usage-badge' }, '全部会话')),
          h('p', { className: 'dsh-usage-sub' },
            `已统计 ${data.sessions} 个会话${data.failed > 0 ? `（${data.failed} 个读取失败）` : ''} · ${days.length} 天有记录 · 今日 ${formatTokens(today.total)} · 更新于 ${selfTime(data.generatedAt)}`)),
        refreshButton)

      const cards = h('div', { className: 'dsh-usage-grid' },
        h(Card, { label: '累计 Token', value: formatTokens(all.total), exactValue: exact(all.total), meta: `${days.length} 天有记录` }),
        h(Card, { label: '峰值 Token', value: formatTokens(peak.total), exactValue: exact(peak.total), meta: longDate(peak.date) }),
        h(Card, { label: '最长聊天时长', value: formatDurationShort(data.longestChatMs), exactValue: formatDuration(data.longestChatMs), meta: formatDuration(data.longestChatMs) }),
        h(Card, { label: '当前连续天数', value: `${streaks.current} 天`, meta: streaks.current > 0 ? '含今日/昨日' : '今天还没用量' }),
        h(Card, { label: '最长连续天数', value: `${streaks.longest} 天`, meta: '历史最长' }))

      const ranges = h('div', { className: 'dsh-usage-ranges', role: 'group', 'aria-label': '时间范围' },
        [7, 30, 'all'].map((option) => h('button', {
          key: option,
          type: 'button',
          className: 'dsh-usage-range',
          'aria-pressed': range === option ? 'true' : 'false',
          onClick: () => setRange(option),
        }, option === 'all' ? '全部' : `近 ${option} 日`)))

      return h('div', { className: 'dsh-usage-root' },
        head,
        cards,
        ranges,
        h(Heatmap, { days }),
        h(TrendChart, { key: range, days: selected, models, modelDays, rangeLabel, colors }),
        h(ModelDonut, { models, total: selectedTotals.total, rangeLabel, colors }),
        h('div', { className: 'dsh-usage-foot' },
          h('span', null, '统计口径：输入 + 缓存读取 + 缓存写入 + 输出；父会话被 fork 继承的历史只计一次。'),
          h('span', null, '按模型归属取自每条 assistant 消息的 source.model；数据来自本机全部会话（含子会话）。')))
    }

    module.exports.inject = ['slots']
    module.exports.apply = (ctx) => {
      const style = document.createElement('style')
      style.dataset.plugin = NS
      style.textContent = CSS
      document.head.append(style)
      ctx.effect(() => () => style.remove(), 'usage-stats: styles')
      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: NS,
        order: 25,
        label: () => '使用统计',
      }, UsagePage))
    }

    return module.exports
  },
})
