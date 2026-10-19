import { describe, expect, it } from 'vitest'
import { classifySalesChannel } from '../../server/domain/b2b/channel'
import type { SalesChannel } from '../../shared/types/b2b'

const channels = new Map<string, SalesChannel>([['channel-1', 'store'], ['channel-2', 'b2b']])

describe('CV-12 explicit sales channel mapping', () => {
  it('classifies only the source values supplied in the map', () => {
    expect(classifySalesChannel('channel-1', channels)).toEqual({ state: 'classified', channel: 'store', sourceChannel: 'channel-1' })
    expect(classifySalesChannel('channel-2', channels)).toEqual({ state: 'classified', channel: 'b2b', sourceChannel: 'channel-2' })
  })

  it.each([null, undefined, '', '   '])('leaves missing channel %s unclassified', (sourceChannel) => {
    expect(classifySalesChannel(sourceChannel, channels)).toMatchObject({ state: 'unclassified', channel: null, reason: 'missing_channel' })
  })

  it.each(['B2B', 'CNPJ', 'seller-1', 'channel-3', ' channel-2 '])('does not infer classification from %s', (sourceChannel) => {
    expect(classifySalesChannel(sourceChannel, channels)).toEqual({ state: 'unclassified', channel: null, sourceChannel, reason: 'unmapped_channel' })
  })

  it('keeps a channel unclassified until a mapping is explicitly provided', () => {
    expect(classifySalesChannel('channel-2', new Map()).channel).toBeNull()
    expect(classifySalesChannel('channel-2', channels).channel).toBe('b2b')
  })
})
