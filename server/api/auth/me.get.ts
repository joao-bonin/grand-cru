import { currentUser, authEndpoint } from '../../utils/auth'
import { publicUser } from '../../services/auth'

export default defineEventHandler(event => authEndpoint(async () => ({ user: publicUser(await currentUser(event)) })))
