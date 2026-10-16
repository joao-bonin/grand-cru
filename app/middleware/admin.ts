export default defineNuxtRouteMiddleware(() => {
  if (useAuth().user.value?.role !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Acesso restrito a administradores.' })
})
