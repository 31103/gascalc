import { assertEquals, assertNull } from "https://deno.land/std@0.110.0/testing/asserts.ts";
import { parseDateTime, formatDate, formatDateForInput } from "./utils.ts";

Deno.test("parseDateTime handles valid input", () => {
  const referenceDate = new Date(2024, 0, 1); // January 1, 2024
  
  // Test with day, hour, minute
  const result1 = parseDateTime("020304", referenceDate);
  assertEquals(result1?.getDate(), 2);
  assertEquals(result1?.getHours(), 3);
  assertEquals(result1?.getMinutes(), 4);
  
  // Test with only hour and minute - inherit day from reference date
  const result2 = parseDateTime("0304", referenceDate);
  assertEquals(result2?.getDate(), 1); // Inherits from reference date
  assertEquals(result2?.getHours(), 3);
  assertEquals(result2?.getMinutes(), 4);
});

Deno.test("parseDateTime handles invalid input", () => {
  const referenceDate = new Date(2024, 0, 1);
  
  // Invalid day
  assertNull(parseDateTime("320101", referenceDate));
  
  // Invalid hour
  assertNull(parseDateTime("012501", referenceDate));
  
  // Invalid minute
  assertNull(parseDateTime("010160", referenceDate));
});

Deno.test("parseDateTime inherits day from reference date", () => {
  const referenceDate = new Date(2024, 0, 15); // January 15, 2024
  
  const result = parseDateTime("000304", referenceDate);
  assertEquals(result?.getDate(), 15); // Should inherit day 15
  assertEquals(result?.getHours(), 3);
  assertEquals(result?.getMinutes(), 4);
});

Deno.test("formatDate formats date correctly", () => {
  const date = new Date(2024, 0, 15, 9, 30);
  assertEquals(formatDate(date), "15日09時30分");
  
  const date2 = new Date(2024, 0, 5, 3, 5);
  assertEquals(formatDate(date2), "5日03時05分");
});

Deno.test("formatDateForInput formats date correctly", () => {
  const date = new Date(2024, 0, 15, 9, 30);
  assertEquals(formatDateForInput(date), "150930");
  
  const date2 = new Date(2024, 0, 5, 3, 5);
  assertEquals(formatDateForInput(date2), "50305");
});