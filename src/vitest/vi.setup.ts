import { expect } from "vitest"
import { toEqualRows } from "@/vitest/matchers/row_equals_matcher"
import { toBeUnique } from "@/vitest/matchers/column_unique_matcher"
import { toEqualColumns } from "@/vitest/matchers/column_equals_matcher"

expect.extend({ toEqualRows, toEqualColumns, toBeUnique })