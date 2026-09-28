import { afterEach, describe, expect, it } from 'vitest'
import ts from 'typescript'
import i18n, { resolveLanguage } from './i18n'
import zh from './locales/zh-CN.json'
import { bodies, tourStops } from './data/planets'
import { lessons, phases, seasons } from './data/lessons'
import { formatDate } from './utils/astronomy'

const uiSources = import.meta.glob<string>(['./App.tsx', './components/ui/*.tsx', './scenes/SolarSystemScene.tsx'], { query: '?raw', import: 'default', eager: true })
const catalog: Record<string, string> = zh

afterEach(async () => { await i18n.changeLanguage('en') })

describe('localization', () => {
  it('normalizes browser languages and falls back to English', () => {
    for (const locale of ['zh', 'zh-CN', 'zh-SG', 'zh-TW', 'ZH-Hant']) expect(resolveLanguage(locale)).toBe('zh-CN')
    for (const locale of ['en-GB', 'fr', '', null, undefined]) expect(resolveLanguage(locale)).toBe('en')
  })

  it('switches translations and retains English fallback for missing messages', async () => {
    await i18n.changeLanguage('zh-CN')
    expect(i18n.t('Earth')).toBe('地球')
    expect(i18n.t('Explore {{value1}}', { value1: i18n.t('Earth') })).toBe('探索地球')
    expect(i18n.t('A future untranslated message.')).toBe('A future untranslated message.')
    await i18n.changeLanguage('en')
    expect(i18n.t('Earth')).toBe('Earth')
  })

  it('formats dates in the selected locale while retaining UTC', () => {
    expect(formatDate(0, 'en')).toBe('26 Sept 2026')
    expect(formatDate(0, 'zh-CN')).toBe('2026年9月26日')
    expect(formatDate(0)).toBe(formatDate(0, 'en'))
  })

  it('covers UI messages and all educational content in Chinese', () => {
    const messages = new Set<string>(['Orbit Atlas | An interactive solar system', 'New', 'Crescent', 'Quarter', 'Gibbous', 'Full'])
    const addValues = (values: string[]) => values.forEach(value => messages.add(value))
    for (const body of bodies) addValues([body.name, body.kind, body.description, body.moons, body.temperature, ...body.facts])
    for (const stop of tourStops) addValues([stop.title, stop.text])
    for (const lesson of lessons) addValues([lesson.title, lesson.subtitle, lesson.explanation, lesson.takeaway])
    for (const season of seasons) addValues([season.title, season.north, season.south, season.note])
    addValues(phases)
    for (const [path, source] of Object.entries(uiSources)) {
      const tree = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
      const addExpression = (node: ts.Node) => {
        if (ts.isStringLiteral(node)) messages.add(node.text)
        if (ts.isConditionalExpression(node)) { addExpression(node.whenTrue); addExpression(node.whenFalse) }
      }
      const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node) && node.expression.getText(tree) === 't' && node.arguments[0]) addExpression(node.arguments[0])
        if (ts.isPropertyAssignment(node) && ['label', 'title', 'text', 'name', 'description'].includes(node.name.getText(tree))) addExpression(node.initializer)
        if (ts.isCallExpression(node) && node.expression.getText(tree) === 'setError' && node.arguments[0]) addExpression(node.arguments[0])
        ts.forEachChild(node, visit)
      }
      visit(tree)
    }
    expect([...messages].filter(message => /[a-zA-Z]/.test(message) && !catalog[message])).toEqual([])
  })

  it('preserves interpolation placeholders and provides nonempty translations', () => {
    const placeholders = (value: string) => value.match(/\{\{[^}]+\}\}/g)?.sort() ?? []
    for (const [english, chinese] of Object.entries(catalog)) {
      expect(chinese.trim(), english).not.toBe('')
      expect(placeholders(chinese), english).toEqual(placeholders(english))
    }
  })
})