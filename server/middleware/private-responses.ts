import { setHeader } from 'h3'

export default defineEventHandler(event => {
  if (event.path.startsWith('/api/auth/') || event.path === '/api/users' || event.path.startsWith('/api/users/')) {
    setHeader(event, 'Cache-Control', 'no-store')
  }
})
