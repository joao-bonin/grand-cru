export default defineAppConfig({
  ui: {
    colors: { primary: 'wine', neutral: 'stone' },
    button: {
      slots: { base: 'min-h-11 min-w-11 rounded-[var(--gc-radius-control)]' },
    },
    input: {
      slots: { base: 'min-h-11 rounded-[var(--gc-radius-control)]' },
    },
    select: {
      slots: {
        base: 'min-h-11 rounded-[var(--gc-radius-control)]',
        item: 'min-h-11 items-center',
      },
    },
  },
})
