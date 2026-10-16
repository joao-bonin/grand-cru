import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import HelloWorld from '../../app/pages/hello-world.vue'

const options = {
  global: {
    stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } },
  },
}

describe('Página Hello World', () => {
  it('exibe Hello World como único título principal dentro de main', () => {
    const wrapper = mount(HelloWorld, options)
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('main h1').text()).toBe('Hello World')
  })

  it('permite retornar à página inicial', () => {
    const wrapper = mount(HelloWorld, options)
    const link = wrapper.get('a')
    expect(link.attributes('href')).toBe('/')
    expect(link.text()).toBe('Voltar ao início')
  })
})
