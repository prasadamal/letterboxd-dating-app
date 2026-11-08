import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

test('auth migration executes: rotation/reset are atomic and stale sessions cannot be reissued', async () => {
  const db = new PGlite()
  const user = '00000000-0000-4000-8000-000000000001'
  const expiry = '2099-01-01T00:00:00Z'
  const scalar = async (sql, args = []) => (await db.query(sql, args)).rows[0]?.result
  try {
    // Minimal schema for the real migration; PGlite runs PostgreSQL, including PL/pgSQL and rollback.
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE TABLE users(id uuid PRIMARY KEY, password_hash text, is_active boolean DEFAULT true, deleted_at timestamptz);
      CREATE TABLE refresh_tokens(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id), token_hash text UNIQUE, expires_at timestamptz, revoked_at timestamptz);
      CREATE TABLE auth_tokens(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id), token_hash text UNIQUE, purpose text, expires_at timestamptz, consumed_at timestamptz);
    `)
    const migration = await readFile(new URL('../../supabase/migrations/20261108120000_atomic_auth_sessions.sql', import.meta.url), 'utf8')
    await db.exec(migration)
    await db.exec(migration) // Safe to reapply.
    await db.query('INSERT INTO users(id, password_hash) VALUES ($1, $2)', [user, 'original'])
    const issue = (version, hash) => scalar('SELECT issue_refresh_token($1, $2, $3, $4) AS result', [user, version, hash, expiry])
    const rotate = (old, next) => db.query('SELECT * FROM rotate_refresh_token($1, $2, $3)', [old, next, expiry])
    const reset = token => scalar('SELECT reset_password_with_token($1, $2) AS result', [token, 'new-password-hash'])
    assert.equal(await issue(0, 'original-refresh'), true)
    assert.equal((await rotate('original-refresh', 'rotated')).rows[0].auth_version, 0)
    assert.equal((await rotate('original-refresh', 'replay')).rows.length, 0)

    // Replacement insertion fails: the old token must stay usable after rollback.
    await assert.rejects(rotate('rotated', 'original-refresh'), /duplicate key/)
    assert.equal((await rotate('rotated', 'after-failure')).rows.length, 1)

    await db.query(`INSERT INTO auth_tokens(user_id, token_hash, purpose, expires_at) VALUES
      ($1, 'reset-a', 'password_reset', $2), ($1, 'reset-b', 'password_reset', $2),
      ($1, 'verification', 'email_verify', $2)`, [user, expiry])
    assert.equal(await reset('verification'), false)
    assert.equal(await reset('reset-a'), true)
    assert.equal(await reset('reset-a'), false)
    assert.equal(await reset('reset-b'), false)
    assert.equal((await rotate('after-failure', 'after-reset')).rows.length, 0)
    assert.equal(await issue(0, 'stale-login'), false)
    assert.equal(await issue(1, 'fresh-login'), true)
    assert.equal((await db.query('SELECT password_hash, auth_version FROM users')).rows[0].auth_version, 1)

    // A database failure midway through reset rolls back link consumption and password changes.
    await db.query("INSERT INTO auth_tokens(user_id, token_hash, purpose, expires_at) VALUES ($1, 'rollback-reset', 'password_reset', $2)", [user, expiry])
    await db.exec(`CREATE FUNCTION reject_revoke() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'simulated outage'; END; $$;
      CREATE TRIGGER fail_revoke BEFORE UPDATE ON refresh_tokens FOR EACH ROW EXECUTE FUNCTION reject_revoke();`)
    await assert.rejects(reset('rollback-reset'), /simulated outage/)
    assert.equal((await db.query("SELECT consumed_at FROM auth_tokens WHERE token_hash = 'rollback-reset'")).rows[0].consumed_at, null)
    assert.equal((await db.query('SELECT auth_version FROM users')).rows[0].auth_version, 1)
    await db.exec('DROP TRIGGER fail_revoke ON refresh_tokens')
    assert.equal(await reset('rollback-reset'), true)

    await db.query('UPDATE users SET is_active = false WHERE id = $1', [user])
    assert.equal(await issue(2, 'suspended'), false)
    const privilege = await scalar("SELECT has_function_privilege('anon', 'public.reset_password_with_token(text,text)', 'EXECUTE') AS result")
    assert.equal(privilege, false)
    assert.equal(await scalar("SELECT has_function_privilege('authenticated', 'public.rotate_refresh_token(text,text,timestamp with time zone)', 'EXECUTE') AS result"), false)
    assert.equal(await scalar("SELECT has_function_privilege('service_role', 'public.reset_password_with_token(text,text)', 'EXECUTE') AS result"), true)
  } finally { await db.close() }
})
