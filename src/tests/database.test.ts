import { PGlite } from "@electric-sql/pglite";
import { readdir, readFile } from "node:fs/promises";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
let db: PGlite;
const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated; insert into auth.users values ('${alice}'),('${bob}');`,
  );
  const migrations = (await readdir("supabase/migrations"))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  for (const name of migrations) {
    await db.exec(await readFile(`supabase/migrations/${name}`, "utf8"));
  }
}, 30000);
afterAll(async () => {
  await db.close();
});
async function asUser<T>(id: string, fn: () => Promise<T>) {
  await db.exec(
    `set role authenticated; select set_config('request.jwt.claim.sub','${id}',false);`,
  );
  try {
    return await fn();
  } finally {
    await db.exec("reset role;");
  }
}
describe("database security", () => {
  it("isolates projects between users and prevents owner reassignment", async () => {
    await asUser(alice, async () => {
      await db.query(
        "insert into public.projects(user_id,name) values ($1,$2)",
        [alice, "Alice project"],
      );
      const rows = await db.query("select * from public.projects");
      expect(rows.rows.length).toBe(1);
    });
    await asUser(bob, async () => {
      expect(
        (await db.query("select * from public.projects")).rows,
      ).toHaveLength(0);
      await expect(
        db.query("insert into public.projects(user_id,name) values ($1,$2)", [
          alice,
          "Forged owner",
        ]),
      ).rejects.toThrow();
    });
    await asUser(alice, async () => {
      await expect(
        db.query("update public.projects set user_id=$1", [bob]),
      ).rejects.toThrow();
    });
  });
  it("blocks anonymous project access", async () => {
    await db.exec("set role anon;");
    try {
      await expect(db.query("select * from public.projects")).rejects.toThrow();
    } finally {
      await db.exec("reset role;");
    }
  });
  it("enforces a durable per-user AI quota", async () => {
    await asUser(alice, async () => {
      for (let i = 0; i < 20; i++) {
        const result = await db.query<{ allowed: boolean }>(
          "select public.consume_ai_quota() as allowed",
        );
        expect(result.rows[0].allowed).toBe(true);
      }
      expect(
        (
          await db.query<{ allowed: boolean }>(
            "select public.consume_ai_quota() as allowed",
          )
        ).rows[0].allowed,
      ).toBe(false);
      await expect(db.query("delete from public.ai_usage")).rejects.toThrow();
    });
    await asUser(bob, async () => {
      expect(
        (
          await db.query<{ allowed: boolean }>(
            "select public.consume_ai_quota() as allowed",
          )
        ).rows[0].allowed,
      ).toBe(true);
    });
  });
});
