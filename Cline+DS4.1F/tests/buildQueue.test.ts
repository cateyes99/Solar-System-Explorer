import test from 'node:test'
import assert from 'node:assert/strict'
import { createBuildQueue } from '../src/utils/buildQueue.ts'

/**
 * The single-flight build queue behind live quality changes. Run with `npm test`.
 *
 * The cases that matter are the ones a viewer can actually cause by clicking
 * through the quality buttons faster than a map set finishes building.
 */

/** A controllable build: each call parks until `release` is called. */
function harness() {
  const calls: string[] = []
  const resolvers: Array<() => void> = []
  const run = (target: string, onProgress: (progress: number) => void): Promise<void> => {
    calls.push(target)
    onProgress(0.5)
    return new Promise<void>((resolve) => {
      resolvers.push(resolve)
    })
  }
  const release = (): void => {
    resolvers.shift()?.()
  }
  return { run, calls, release }
}

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

test('a build runs once and reports the target it finished', async () => {
  const { run, calls, release } = harness()
  const queue = createBuildQueue<string, number>(run)
  const done = queue.ensure('a', () => {})
  assert.deepEqual(calls, ['a'])
  release()
  await done
  assert.equal(queue.built(), 'a')
})

test('a target that is already built is not rebuilt', async () => {
  const { run, calls, release } = harness()
  const queue = createBuildQueue<string, number>(run)
  const first = queue.ensure('a', () => {})
  release()
  await first
  await queue.ensure('a', () => {})
  assert.deepEqual(calls, ['a'])
})

test('duplicate requests for the same target share one build', async () => {
  const { run, calls, release } = harness()
  const queue = createBuildQueue<string, number>(run)
  const a = queue.ensure('a', () => {})
  const b = queue.ensure('a', () => {})
  assert.deepEqual(calls, ['a'])
  release()
  await Promise.all([a, b])
  assert.deepEqual(calls, ['a'])
})

test('a request that arrives mid-build supersedes the one in flight', async () => {
  const { run, calls, release } = harness()
  const queue = createBuildQueue<string, number>(run)
  const first = queue.ensure('a', () => {})
  const second = queue.ensure('b', () => {})
  release() // finish 'a'; the queue should now build 'b'
  await tick()
  assert.deepEqual(calls, ['a', 'b'])
  release()
  await Promise.all([first, second])
  assert.equal(queue.built(), 'b')
})

test('changing the target twice mid-build collapses to the newest', async () => {
  const { run, calls, release } = harness()
  const queue = createBuildQueue<string, number>(run)
  const first = queue.ensure('a', () => {})
  const second = queue.ensure('b', () => {})
  const third = queue.ensure('a', () => {})
  release() // finish 'a'; the newest target is 'a', so nothing else is built
  await Promise.all([first, second, third])
  assert.deepEqual(calls, ['a'])
  assert.equal(queue.built(), 'a')
})

test('a failing build rejects the waiting caller and does not record the target', async () => {
  let attempts = 0
  const queue = createBuildQueue<string, number>(async () => {
    attempts += 1
    throw new Error('boom')
  })
  await assert.rejects(queue.ensure('a', () => {}), /boom/)
  assert.equal(queue.built(), null)
  // The failure was not cached: asking again tries once more.
  await assert.rejects(queue.ensure('a', () => {}), /boom/)
  assert.equal(attempts, 2)
})

test('reset forgets the built target', async () => {
  const { run, calls, release } = harness()
  const queue = createBuildQueue<string, number>(run)
  const first = queue.ensure('a', () => {})
  release()
  await first
  queue.reset()
  assert.equal(queue.built(), null)
  const second = queue.ensure('a', () => {})
  release()
  await second
  assert.deepEqual(calls, ['a', 'a'])
})
