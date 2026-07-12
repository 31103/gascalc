import type { Entry } from "../types/entry.ts";
import {
  compareBillingDateTime,
  isSameBillingDateTime,
} from "./billingDateTime.ts";

export function upsertEntry(entries: Entry[], entry: Entry): Entry[] {
  return entries
    .filter(
      (current) => !isSameBillingDateTime(current.dateTime, entry.dateTime),
    )
    .concat(entry)
    .sort((left, right) =>
      compareBillingDateTime(left.dateTime, right.dateTime),
    );
}
