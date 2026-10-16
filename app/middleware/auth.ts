export default defineNuxtRouteMiddleware(async () => {
  try { await useAuth().refresh() }
  catch (error) {
    const status = (error as { statusCode?: number, status?: number }).statusCode ?? (error as { status?: number }).status
    if (status === 401) return navigateTo('/login')
    throw createError({ statusCode: 503, statusMessage: 'Não foi possível verificar sua sessão. Tente novamente.' })
  }
})
