import test from 'node:test'
import assert from 'node:assert/strict'
import { collectUsage, dayKey, foldSession, usageOf } from '../index.js'

const at = (year, month, day, hour = 12) => new Date(year, month - 1, day, hour).getTime()
const message = (time, turn, step, usage) => ({
  type: 'assistant/message',
  time,
  data: { turn, step, usage },
})

test('one settlement contributes its usage to its local day', () => {
  const days = new Map()
  const totals = foldSession([
    message(at(2026, 10, 19), 1, 1, { inputTokens: 100, outputTokens: 10, cacheReadTokens: 50 }),
  ], days)
  assert.deepEqual(totals, { input: 100, output: 10, cacheRead: 50, cacheWrite: 0 })
  assert.deepEqual(days.get('2026-10-19'), { input: 100, output: 10, cacheRead: 50, cacheWrite: 0 })
})

test('a later sample for the same attempt replaces, never adds', () => {
  const days = new Map()
  const totals = foldSession([
    message(at(2026, 10, 19), 1, 1, { inputTokens: 100, outputTokens: 10 }),
    message(at(2026, 10, 19), 1, 1, { inputTokens: 120, outputTokens: 15 }),
  ], days)
  assert.deepEqual(totals, { input: 120, output: 15, cacheRead: 0, cacheWrite: 0 })
  assert.deepEqual(days.get('2026-10-19'), { input: 120, output: 15, cacheRead: 0, cacheWrite: 0 })
})

test('a retry after llm/retry-started is billed as another attempt', () => {
  const days = new Map()
  const totals = foldSession([
    message(at(2026, 10, 19), 1, 1, { inputTokens: 100, outputTokens: 10 }),
    { type: 'llm/retry-started', time: at(2026, 10, 19), data: { turn: 1, step: 1 } },
    message(at(2026, 10, 19), 1, 1, { inputTokens: 100, outputTokens: 10 }),
  ], days)
  assert.deepEqual(totals, { input: 200, output: 20, cacheRead: 0, cacheWrite: 0 })
  assert.deepEqual(days.get('2026-10-19'), { input: 200, output: 20, cacheRead: 0, cacheWrite: 0 })
})

test('usage embedded in an attempt stream is counted', () => {
  const event = {
    type: 'assistant/attempt',
    time: at(2026, 10, 19),
    data: {
      turn: 1,
      step: 1,
      stream: [
        { type: 'chunk', chunk: { type: 'text-delta', text: 'hi' } },
        { type: 'chunk', chunk: { type: 'usage', usage: { inputTokens: 7, outputTokens: 3 } } },
      ],
    },
  }
  assert.deepEqual(usageOf(event), { inputTokens: 7, outputTokens: 3 })
  const days = new Map()
  assert.deepEqual(foldSession([event], days), { input: 7, output: 3, cacheRead: 0, cacheWrite: 0 })
})

test('malformed counts and unknown events are ignored', () => {
  const days = new Map()
  const totals = foldSession([
    { type: 'tool/call', time: at(2026, 10, 19), data: {} },
    message(at(2026, 10, 19), 1, 1, { inputTokens: -5, outputTokens: 1.5, cacheReadTokens: 'x' }),
  ], days)
  assert.deepEqual(totals, { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 })
  assert.deepEqual(days.get('2026-10-19'), { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 })
})

test('collectUsage merges sessions and survives one failed read', async () => {
  const sessionQuery = {
    listSessions: async () => [
      { header: { id: 'a' } },
      { header: { id: 'broken' } },
      { header: { id: 'b' } },
    ],
    readSession: async (id) => {
      if (id === 'broken') throw new Error('corrupt log')
      return {
        events: [message(at(2026, 10, 18), 1, 1, { inputTokens: 10, outputTokens: 1 })],
      }
    },
  }
  const stats = await collectUsage(sessionQuery)
  assert.equal(stats.sessions, 2)
  assert.equal(stats.failed, 1)
  assert.equal(stats.totals.total, 22)
  assert.equal(stats.days.length, 1)
  assert.equal(stats.days[0].total, 22)
})

test('usage is attributed to the model reported by the message', () => {
  const days = new Map()
  const modelDays = new Map()
  const totals = foldSession([{
    type: 'assistant/message',
    time: at(2026, 10, 19),
    data: {
      turn: 1,
      step: 1,
      usage: { inputTokens: 100, outputTokens: 10 },
      message: { source: { kind: 'model', provider: 'ltyi', model: 'deepseek' } },
    },
  }], days, modelDays)
  assert.deepEqual(totals, { input: 100, output: 10, cacheRead: 0, cacheWrite: 0 })
  assert.deepEqual(modelDays.get('2026-10-19').get('deepseek'), {
    input: 100, output: 10, cacheRead: 0, cacheWrite: 0,
  })
})

test('a replacement that switches model moves the tokens', () => {
  const days = new Map()
  const modelDays = new Map()
  const event = (model) => ({
    type: 'assistant/message',
    time: at(2026, 10, 19),
    data: {
      turn: 1,
      step: 1,
      usage: { inputTokens: 100, outputTokens: 10 },
      message: { source: { kind: 'model', model } },
    },
  })
  const totals = foldSession([event('a'), event('b')], days, modelDays)
  assert.deepEqual(totals, { input: 100, output: 10, cacheRead: 0, cacheWrite: 0 })
  assert.equal(modelDays.get('2026-10-19').get('a').input, 0)
  assert.equal(modelDays.get('2026-10-19').get('b').input, 100)
})

test('an attempt without a settled message falls back to the request model', () => {
  const days = new Map()
  const modelDays = new Map()
  foldSession([
    { type: 'request/header', time: at(2026, 10, 19), data: { header: { config: { provider: 'p', model: 'm' } } } },
    {
      type: 'assistant/attempt',
      time: at(2026, 10, 19),
      data: { turn: 1, step: 1, stream: [{ type: 'chunk', chunk: { type: 'usage', usage: { inputTokens: 5, outputTokens: 1 } } }] },
    },
  ], days, modelDays)
  assert.equal(modelDays.get('2026-10-19').get('m').input, 5)
})

test('turn starts are counted per day', () => {
  const days = new Map()
  const turnDays = new Map()
  foldSession([
    { type: 'turn/start', time: at(2026, 10, 19), data: { turn: 1 } },
    message(at(2026, 10, 19), 1, 1, { inputTokens: 10, outputTokens: 1 }),
    { type: 'turn/start', time: at(2026, 10, 19), data: { turn: 2 } },
  ], days, new Map(), turnDays)
  assert.equal(turnDays.get('2026-10-19'), 2)
})

test('collectUsage ignores a fork parent\'s inherited prefix', async () => {
  const inherited = message(at(2026, 10, 18), 1, 1, { inputTokens: 1000, outputTokens: 100 })
  const own = message(at(2026, 10, 19), 2, 1, { inputTokens: 10, outputTokens: 1 })
  const sessionQuery = {
    listSessions: async () => [{ header: { id: 'fork' } }],
    readSession: async () => ({ events: [inherited, own], inheritedEventCount: 1 }),
  }
  const stats = await collectUsage(sessionQuery)
  assert.equal(stats.totals.input, 10)
  assert.equal(stats.totals.output, 1)
  assert.equal(stats.totals.total, 11)
  assert.deepEqual(stats.days.map((day) => day.date), ['2026-10-19'])
})

test('collectUsage reports model totals and active chat time', async () => {
  const start = at(2026, 10, 19, 10)
  const withModel = (time, model, input, step) => ({
    type: 'assistant/message',
    time,
    data: {
      turn: 1,
      step,
      usage: { inputTokens: input, outputTokens: 1 },
      message: { source: { kind: 'model', model } },
    },
  })
  const sessionQuery = {
    listSessions: async () => [{ header: { id: 'chat' } }],
    readSession: async () => ({
      events: [
        withModel(start, 'a', 10, 1),
        withModel(start + 30 * 60_000, 'b', 10, 2),
        withModel(start + 3 * 60 * 60_000, 'a', 10, 3),
      ],
      inheritedEventCount: 0,
    }),
  }
  const stats = await collectUsage(sessionQuery)
  assert.deepEqual(stats.models.map((entry) => [entry.model, entry.total]), [['a', 22], ['b', 11]])
  assert.equal(stats.modelDays.length, 1)
  assert.equal(stats.longestChatMs, 30 * 60_000)
})

test('dayKey uses the local calendar', () => {
  assert.equal(dayKey(at(2026, 1, 2, 3)), '2026-01-02')
  assert.equal(dayKey(Number.NaN), undefined)
})
