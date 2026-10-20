import type { Recommendation } from '../types/replenishment'

export function canSelectRecommendation(item: Recommendation): boolean {
  return Boolean(item.policy) && item.suggested !== null && Number.isFinite(item.suggested)
    && item.suggested >= 0 && item.issues.length === 0
}

export function recommendationSelectionIssues(item: Recommendation): string[] {
  if (canSelectRecommendation(item)) return []
  const issues = new Set(item.issues)
  if (!item.policy) issues.add('Política de reposição não configurada')
  if (!issues.size) issues.add('Sugestão de compra indisponível')
  return [...issues]
}
