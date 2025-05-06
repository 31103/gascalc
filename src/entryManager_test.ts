import { assertEquals, assertNotEquals } from "https://deno.land/std@0.110.0/testing/asserts.ts";
import { EntryManager } from "./entryManager.ts";
import type { Entry } from "./types.ts";

Deno.test("EntryManager initializes with empty entries", () => {
  const manager = new EntryManager();
  assertEquals(manager.getEntries().length, 0);
});

Deno.test("EntryManager adds valid entries", () => {
  const manager = new EntryManager();
  
  // Add a valid entry
  const result1 = manager.addEntry("010900", "2", "", false);
  assertEquals(result1.success, true);
  assertEquals(manager.getEntries().length, 1);
  
  // Add another valid entry
  const result2 = manager.addEntry("011200", "3", "", false);
  assertEquals(result2.success, true);
  assertEquals(manager.getEntries().length, 2);
});

Deno.test("EntryManager handles invalid entries", () => {
  const manager = new EntryManager();
  
  // Missing dateTime
  const result1 = manager.addEntry("", "2", "", false);
  assertEquals(result1.success, false);
  assertEquals(manager.getEntries().length, 0);
  
  // Missing flow
  const result2 = manager.addEntry("010900", "", "", false);
  assertEquals(result2.success, false);
  assertEquals(manager.getEntries().length, 0);
  
  // Invalid dateTime
  const result3 = manager.addEntry("012500", "2", "", false); // 25th hour
  assertEquals(result3.success, false);
  assertEquals(manager.getEntries().length, 0);
  
  // Invalid flow
  const result4 = manager.addEntry("010900", "abc", "", false);
  assertEquals(result4.success, false);
  assertEquals(manager.getEntries().length, 0);
});

Deno.test("EntryManager handles FiO2 correctly", () => {
  const manager = new EntryManager();
  
  // Add valid entry with FiO2 mode off
  const result1 = manager.addEntry("010900", "2", "40", false);
  assertEquals(result1.success, true);
  assertEquals(manager.getEntries()[0].fio2, 21); // Default to 21 when FiO2 mode is off
  
  // Add valid entry with FiO2 mode on
  const result2 = manager.addEntry("011200", "3", "40", true);
  assertEquals(result2.success, true);
  assertEquals(manager.getEntries()[1].fio2, 40);
  
  // Invalid FiO2 when mode is on
  const result3 = manager.addEntry("011500", "2", "101", true); // Above 100
  assertEquals(result3.success, false);
  
  const result4 = manager.addEntry("011500", "2", "20", true); // Below 21
  assertEquals(result4.success, false);
});

Deno.test("EntryManager deletes entries correctly", () => {
  const manager = new EntryManager();
  
  // Add a few entries
  manager.addEntry("010900", "2", "", false);
  manager.addEntry("011200", "3", "", false);
  manager.addEntry("011500", "4", "", false);
  assertEquals(manager.getEntries().length, 3);
  
  // Delete an entry
  manager.deleteEntry(1);
  assertEquals(manager.getEntries().length, 2);
  assertEquals(manager.getEntries()[1].flow, 4); // The third entry is now at index 1
  
  // Delete non-existent entries (shouldn't error)
  manager.deleteEntry(5);
  assertEquals(manager.getEntries().length, 2);
});

Deno.test("EntryManager gets entry correctly", () => {
  const manager = new EntryManager();
  
  // Add entries
  manager.addEntry("010900", "2", "", false);
  manager.addEntry("011200", "3", "", false);
  
  // Get valid entry
  const entry = manager.getEntry(1);
  assertNotEquals(entry, null);
  assertEquals(entry?.flow, 3);
  
  // Get invalid entry
  const nullEntry = manager.getEntry(5);
  assertEquals(nullEntry, null);
});

Deno.test("EntryManager clears entries", () => {
  const manager = new EntryManager();
  
  // Add entries
  manager.addEntry("010900", "2", "", false);
  manager.addEntry("011200", "3", "", false);
  assertEquals(manager.getEntries().length, 2);
  
  // Clear entries
  manager.clearEntries();
  assertEquals(manager.getEntries().length, 0);
});

Deno.test("EntryManager sorts entries by date time", () => {
  const manager = new EntryManager();
  
  // Add entries out of order
  manager.addEntry("011200", "3", "", false);
  manager.addEntry("010900", "2", "", false);
  manager.addEntry("011500", "4", "", false);
  
  // Should be sorted
  const entries = manager.getEntries();
  assertEquals(entries[0].flow, 2); // 09:00
  assertEquals(entries[1].flow, 3); // 12:00
  assertEquals(entries[2].flow, 4); // 15:00
});