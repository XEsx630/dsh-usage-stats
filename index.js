/**
 * All-session token usage for the DSH web client.
 *
 * The Host replays every durable session log through `sessionQuery`, folds the
 * same usage samples `dsh-token-meter` counts (an `assistant/message` or an
 * `assistant/attempt` stream, with in-attempt replacement and retry handling),
 * and buckets the deltas by local day. The browser page fetches one JSON
 * snapshot from `/dsh-usage/api/stats`.
 */

export const name = 'usage-stats'
export const inject = ['webServer', 'sessionQuery']

const API_PREFIX = '/dsh-usage/api'
const API_PATH = `${API_PREFIX}/stats`
const CACHE_MS = 5 * 60_000
// A chat stops being "active" after an hour without an event; this keeps a
// session left open overnight from reporting a multi-day conversation.
const CHAT_GAP_MS = 60 * 60_000

const empty = () => ({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0 })
const totalOf = (buckets) => buckets.input + buckets.output + buckets.cacheRead + buckets.cacheWrite

/** Reject malformed provider counts instead of letting them poison the totals. */
function count(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0
}

/**
 * The usage one durable Assistant settlement reported, if any.
 * @param {object} event - a session event.
 * @returns {object | undefined} provider usage.
 */
export function usageOf(event) {
  if (event.type === 'assistant/message' && event.data?.usage !== undefined) return event.data.usage
  if (event.type !== 'assistant/message' && event.type !== 'assistant/attempt') return undefined
  const stream = event.data?.stream
  if (!Array.isArray(stream)) return undefined
  for (let index = stream.length - 1; index >= 0; index -= 1) {
    const chunk = stream[index]?.chunk
    if (chunk?.type === 'usage') return chunk.usage
  }
  return undefined
}

/** Local calendar day for a millisecond timestamp, e.g. `2026-10-19`. */
export function dayKey(time) {
  const date = new Date(time)
  if (!Number.isFinite(date.getTime())) return undefined
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

const same = (left, right) => left.input === right.input
  && left.output === right.output
  && left.cacheRead === right.cacheRead
  && left.cacheWrite === right.cacheWrite

/** The model a request header names, if any. */
function modelOfHeader(event) {
  const config = event.data?.header?.config ?? event.data?.config
  return typeof config?.model === 'string' ? config.model : undefined
}

/** The model a settled assistant message reports, if any. */
function modelOfMessage(event) {
  const source = event.data?.message?.source
  return source?.kind === 'model' && typeof source.model === 'string' ? source.model : undefined
}

const addInto = (target, buckets, sign) => {
  target.input += buckets.input * sign
  target.output += buckets.output * sign
  target.cacheRead += buckets.cacheRead * sign
  target.cacheWrite += buckets.cacheWrite * sign
}

/**
 * Fold one session's events into per-day and per-model buckets.
 *
 * A repeated sample for the same turn/step replaces the previous one, exactly
 * like the `tokenUsage` projection; `llm/retry-started` closes that slot so a
 * retried attempt is billed as another contribution. A replacement is removed
 * from its previous day/model first, so a retry that switches models does not
 * leave tokens under the old model.
 *
 * @param {object[]} events - owned logical events (inherited prefix already cut).
 * @param {Map<string, object>} days - accumulator keyed by local day.
 * @param {Map<string, Map<string, object>>} [modelDays] - per-day, per-model accumulator.
 * @param {Map<string, number>} [turnDays] - per-day turn starts.
 * @returns {{input:number,output:number,cacheRead:number,cacheWrite:number}} session totals.
 */
export function foldSession(events, days, modelDays = new Map(), turnDays = new Map()) {
  const totals = empty()
  let last
  let activeModel
  for (const event of events) {
    if (event === null || typeof event !== 'object') continue
    const data = event.data
    if (event.type === 'turn/start') {
      const day = dayKey(event.time)
      if (day !== undefined) turnDays.set(day, (turnDays.get(day) ?? 0) + 1)
      continue
    }
    if (event.type === 'request/header') {
      activeModel = modelOfHeader(event) ?? activeModel
      continue
    }
    if (event.type === 'llm/retry-started') {
      if (last !== undefined && last.turn === data?.turn && last.step === data?.step) last = undefined
      continue
    }
    if (event.type !== 'assistant/message' && event.type !== 'assistant/attempt') continue
    const usage = usageOf(event)
    if (usage === undefined) continue
    const current = {
      input: count(usage.inputTokens),
      output: count(usage.outputTokens),
      cacheRead: count(usage.cacheReadTokens),
      cacheWrite: count(usage.cacheWriteTokens),
    }
    const previous = last !== undefined && last.turn === data?.turn && last.step === data?.step
      ? last
      : undefined
    const day = dayKey(event.time) ?? previous?.day ?? dayKey(Date.now())
    if (day === undefined) continue
    const model = modelOfMessage(event) ?? activeModel ?? '未知模型'
    if (previous !== undefined && previous.model === model && same(previous.buckets, current)) continue
    if (previous !== undefined) {
      addInto(totals, previous.buckets, -1)
      const previousDay = days.get(previous.day)
      if (previousDay !== undefined) addInto(previousDay, previous.buckets, -1)
      const previousModels = modelDays.get(previous.day)
      const previousModel = previousModels?.get(previous.model)
      if (previousModel !== undefined) addInto(previousModel, previous.buckets, -1)
    }
    const dayBucket = days.get(day) ?? empty()
    addInto(dayBucket, current, 1)
    days.set(day, dayBucket)
    const dayModels = modelDays.get(day) ?? new Map()
    const modelBucket = dayModels.get(model) ?? empty()
    addInto(modelBucket, current, 1)
    dayModels.set(model, modelBucket)
    modelDays.set(day, dayModels)
    addInto(totals, current, 1)
    last = { turn: data?.turn, step: data?.step, buckets: current, day, model }
    activeModel = model
  }
  return totals
}

/**
 * Replay the whole corpus once.
 * @param {object} sessionQuery - the Host session query service.
 * @param {object} [logger] - the Host logger.
 * @returns {Promise<object>} the stats snapshot served to the browser.
 */
export async function collectUsage(sessionQuery, logger) {
  const records = await sessionQuery.listSessions()
  const days = new Map()
  const modelDays = new Map()
  const turnDays = new Map()
  const totals = empty()
  let sessions = 0
  let failed = 0
  let longestChatMs = 0
  for (const record of records) {
    const id = record?.header?.id
    if (typeof id !== 'string') continue
    try {
      const { events, inheritedEventCount } = await sessionQuery.readSession(id)
      // A forked session physically stores its parent's prefix; those tokens
      // were already billed under the parent. Only the child-owned tail counts.
      const ownEvents = inheritedEventCount > 0 ? events.slice(inheritedEventCount) : events
      const sessionTotals = foldSession(ownEvents, days, modelDays, turnDays)
      totals.input += sessionTotals.input
      totals.output += sessionTotals.output
      totals.cacheRead += sessionTotals.cacheRead
      totals.cacheWrite += sessionTotals.cacheWrite
      let previousTime
      let activeMs = 0
      for (const event of ownEvents) {
        if (!Number.isFinite(event?.time)) continue
        if (previousTime !== undefined) {
          const gap = event.time - previousTime
          if (gap > 0 && gap <= CHAT_GAP_MS) activeMs += gap
        }
        if (previousTime === undefined || event.time > previousTime) previousTime = event.time
      }
      longestChatMs = Math.max(longestChatMs, activeMs)
      sessions += 1
    } catch (error) {
      failed += 1
      logger?.warn?.(error)
    }
    // A session log can be tens of megabytes; let the Host process breathe.
    await new Promise((resolve) => setImmediate(resolve))
  }
  const daily = [...days]
    .map(([date, buckets]) => ({ date, ...buckets, turns: turnDays.get(date) ?? 0, total: totalOf(buckets) }))
    .filter((day) => day.total > 0)
    .sort((left, right) => left.date.localeCompare(right.date))
  const modelTotals = new Map()
  for (const byModel of modelDays.values()) {
    for (const [model, buckets] of byModel) {
      const target = modelTotals.get(model) ?? empty()
      addInto(target, buckets, 1)
      modelTotals.set(model, target)
    }
  }
  const models = [...modelTotals]
    .map(([model, buckets]) => ({ model, ...buckets, total: totalOf(buckets) }))
    .filter((entry) => entry.total > 0)
    .sort((left, right) => right.total - left.total)
  const modelDaily = [...modelDays]
    .map(([date, byModel]) => ({
      date,
      models: [...byModel]
        .map(([model, buckets]) => ({ model, total: totalOf(buckets) }))
        .filter((entry) => entry.total > 0),
    }))
    .filter((row) => row.models.length > 0)
    .sort((left, right) => left.date.localeCompare(right.date))
  return {
    generatedAt: Date.now(),
    sessions,
    failed,
    totals: { ...totals, total: totalOf(totals) },
    days: daily,
    models,
    modelDays: modelDaily,
    longestChatMs,
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(body))
}

function isLocalRequest(req) {
  const host = String(req.headers?.host ?? '').replace(/:\d+$/, '').toLowerCase()
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1'
}

export function apply(ctx) {
  let cache
  let inflight

  const refresh = () => {
    if (inflight === undefined) {
      inflight = collectUsage(ctx.sessionQuery, ctx.logger)
        .then((snapshot) => {
          cache = snapshot
          return snapshot
        })
        .finally(() => {
          inflight = undefined
        })
    }
    return inflight
  }

  /**
   * Serve a cached snapshot immediately; refresh behind a stale response so
   * the settings page never waits on a full replay it did not force.
   */
  const snapshot = async (force) => {
    if (cache !== undefined && force !== true) {
      if (Date.now() - cache.generatedAt > CACHE_MS && inflight === undefined) {
        void refresh().catch(() => {})
      }
      return cache
    }
    return refresh()
  }

  const handler = async (req, res) => {
    try {
      if (!isLocalRequest(req)) return sendJson(res, 403, { error: 'forbidden host' })
      if (req.method !== 'GET') return sendJson(res, 405, { error: 'method not allowed' })
      const url = new URL(req.url ?? '/', 'http://dsh.local')
      if (url.pathname !== API_PATH) return sendJson(res, 404, { error: 'not found' })
      const data = await snapshot(url.searchParams.get('refresh') === '1')
      return sendJson(res, 200, data)
    } catch (error) {
      ctx.logger?.error?.(error)
      return sendJson(res, 500, { error: 'usage statistics are temporarily unavailable' })
    }
  }

  ctx.effect(
    () => ctx.webServer.register({ kind: 'prefix', path: API_PREFIX, handler }),
    'usage-stats: api',
  )
}
