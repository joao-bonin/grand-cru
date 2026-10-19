import type { ChannelClassification, SalesChannel } from '../../../shared/types/b2b'

/** Uses only exact, explicitly supplied mappings; customer/seller metadata is not inferred. */
export function classifySalesChannel(sourceChannel: string | null | undefined, channels: ReadonlyMap<string, SalesChannel>): ChannelClassification {
  if (sourceChannel == null || sourceChannel.trim() === '') {
    return { state: 'unclassified', sourceChannel: sourceChannel ?? null, channel: null, reason: 'missing_channel' }
  }
  const channel = channels.get(sourceChannel)
  if (channel !== 'store' && channel !== 'b2b') {
    return { state: 'unclassified', sourceChannel, channel: null, reason: 'unmapped_channel' }
  }
  return { state: 'classified', sourceChannel, channel }
}
