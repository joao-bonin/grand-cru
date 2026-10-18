import { createSSRApp, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it, vi } from 'vitest'
import ReplenishmentList from '../../app/components/ReplenishmentList.vue'
import { recommendation } from '../fixtures/replenishment'

describe('Prontidão da seleção na reposição renderizada no servidor', () => {
  it('não oferece um checkbox ativo antes de haver eventos conectados', async () => {
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(ReplenishmentList, { items: [recommendation], canSelect: true }))
    const checkbox = container.querySelector<HTMLInputElement>('[name="select-p1-s1"]')!
    expect(checkbox.disabled).toBe(true)
    checkbox.click()
    expect(checkbox.checked).toBe(false)
  })

  it('libera a seleção após hidratar e entrega a identidade ao primeiro clique', async () => {
    const props = { items: [recommendation], canSelect: true, onSelection: vi.fn() }
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(ReplenishmentList, props))
    document.body.append(container)
    const application = createSSRApp(ReplenishmentList, props)
    try {
      application.mount(container)
      await nextTick()
      const checkbox = container.querySelector<HTMLInputElement>('[name="select-p1-s1"]')!
      expect(checkbox.disabled).toBe(false)
      checkbox.click()
      await nextTick()
      expect(checkbox.checked).toBe(true)
      expect(props.onSelection).toHaveBeenLastCalledWith([{ productId: 'p1', storeId: 's1' }])
    } finally {
      application.unmount()
      container.remove()
    }
  })
})
