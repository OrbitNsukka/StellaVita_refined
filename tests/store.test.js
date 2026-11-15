// On-device storage, against a small in-memory stand-in for IndexedDB. The
// real IndexedDB is exercised in the browser test.
import test from "node:test";
import assert from "node:assert/strict";
import { DB_NAME, STORES, openStore } from "../app/js/store.js";
import { createFakeIndexedDB } from "./helpers/fake-indexeddb.js";

const reading = (id, profileId, extra = {}) => ({ id, profileId, indicator: "sleep_hours", date: "2026-11-01", time: "07:00", symptoms: [], note: "", value: 7.5, ...extra });

test("the database has its own name and the four object stores", async () => {
  const factory = createFakeIndexedDB();
  const store = await openStore(factory);
  assert.deepEqual(factory.names(), [DB_NAME]);
  assert.equal(DB_NAME, "stellavita-refined");
  assert.deepEqual(Object.values(STORES).sort(), ["meta", "profiles", "readings", "settings"]);
  store.close();
});

test("no storage in the browser: opening fails with a plain message", async () => {
  await assert.rejects(() => openStore(null), /no on-device storage/);
});

test("profiles are stored and read back", async () => {
  const store = await openStore(createFakeIndexedDB());
  assert.deepEqual(await store.getProfiles(), []);
  await store.putProfiles([
    { id: "SYN-B", label: "Astronaut B (synthetic)", createdAt: "t", thresholdsVersion: "0.4.0" },
    { id: "SYN-A", label: "Astronaut A (synthetic)", createdAt: "t", thresholdsVersion: "0.4.0" },
  ]);
  assert.deepEqual((await store.getProfiles()).map((p) => p.id), ["SYN-A", "SYN-B"]);
  assert.equal((await store.getProfile("SYN-B")).label, "Astronaut B (synthetic)");
  assert.equal(await store.getProfile("SYN-Z"), null);
});

test("readings are kept per astronaut, replaced by id, deleted one by one and wiped", async () => {
  const store = await openStore(createFakeIndexedDB());
  await store.putReadings([reading("a1", "SYN-A"), reading("a2", "SYN-A"), reading("b1", "SYN-B")]);
  await store.putReading(reading("b2", "SYN-B", { value: 5.5 }));
  assert.deepEqual((await store.getReadings("SYN-A")).map((r) => r.id), ["a1", "a2"]);
  assert.deepEqual((await store.getReadings("SYN-B")).map((r) => r.id), ["b1", "b2"]);
  assert.equal((await store.getAllReadings()).length, 4);

  await store.putReading(reading("a1", "SYN-A", { value: 8.2 }));
  assert.equal((await store.getReadings("SYN-A")).find((r) => r.id === "a1").value, 8.2);
  assert.equal((await store.getAllReadings()).length, 4);

  await store.deleteReading("a2");
  assert.deepEqual((await store.getReadings("SYN-A")).map((r) => r.id), ["a1"]);

  await store.clearReadings();
  assert.deepEqual(await store.getAllReadings(), []);
});

test("what is stored is a copy: changing the object afterwards changes nothing on the device", async () => {
  const store = await openStore(createFakeIndexedDB());
  const mine = reading("a1", "SYN-A", { symptoms: ["dizziness"] });
  await store.putReading(mine);
  mine.symptoms.push("changed later");
  mine.value = 1;
  const [back] = await store.getReadings("SYN-A");
  assert.deepEqual(back.symptoms, ["dizziness"]);
  assert.equal(back.value, 7.5);
});

test("settings are cached one copy per version", async () => {
  const store = await openStore(createFakeIndexedDB());
  assert.equal(await store.getSettings("0.4.0"), null);
  await store.putSettings({ version: "0.4.0", loadedAt: "t1", json: { meta: { version: "0.4.0" } } });
  await store.putSettings({ version: "0.5.0", loadedAt: "t2", json: { meta: { version: "0.5.0" } } });
  await store.putSettings({ version: "0.4.0", loadedAt: "t3", json: { meta: { version: "0.4.0" } } });
  assert.equal((await store.listSettings()).length, 2);
  assert.equal((await store.getSettings("0.4.0")).loadedAt, "t3");
});

test("device notes: the chosen astronaut and 'limits statement seen'", async () => {
  const store = await openStore(createFakeIndexedDB());
  assert.equal(await store.getMeta("profile"), null);
  await store.setMeta("profile", "SYN-B");
  await store.setMeta("limitsSeen", true);
  assert.equal(await store.getMeta("profile"), "SYN-B");
  assert.equal(await store.getMeta("limitsSeen"), true);
});

test("data survives closing and opening again", async () => {
  const factory = createFakeIndexedDB();
  const first = await openStore(factory);
  await first.putReading(reading("a1", "SYN-A"));
  await first.setMeta("profile", "SYN-A");
  first.close();
  const second = await openStore(factory);
  assert.equal((await second.getAllReadings()).length, 1);
  assert.equal(await second.getMeta("profile"), "SYN-A");
});
