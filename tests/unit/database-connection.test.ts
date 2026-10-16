import { describe, expect, it } from 'vitest'
import { databasePoolOptions } from '../../server/db/connection'

describe('conexão PostgreSQL', () => {
  it('recusa JDBC e outros motores', () => {
    expect(() => databasePoolOptions('mysql://localhost/db')).toThrow('PostgreSQL')
    expect(() => databasePoolOptions('jdbc:postgresql://localhost/db')).toThrow('PostgreSQL')
  })
  it('permite banco local isolado sem TLS', () => {
    expect(databasePoolOptions('postgresql://localhost/test').ssl).toBe(false)
  })
  it('exige TLS verificado em conexões remotas mesmo se a URI pedir desativação', () => {
    const options = databasePoolOptions('postgresql://user:password@example.com/db?sslmode=disable', 'certificate')
    expect(options.ssl).toEqual({ rejectUnauthorized: true, ca: 'certificate' })
    expect(options.connectionString).not.toContain('sslmode')
    expect(options.max).toBe(3)
  })
})
