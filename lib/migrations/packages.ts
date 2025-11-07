import { sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";

const PACKAGES_TABLE = "packages";
const PRICE_ORIGINAL_COLUMN = "price_original_idr";
const PRICE_ORIGINAL_DEFINITION = "integer NOT NULL DEFAULT 0";
const DISCOUNT_PERCENT_COLUMN = "discount_percent";
const DISCOUNT_PERCENT_DEFINITION = "integer NOT NULL DEFAULT 0";
const DISCOUNT_ACTIVE_COLUMN = "discount_active";
const DISCOUNT_ACTIVE_DEFINITION = "integer NOT NULL DEFAULT 0";

export async function ensurePackagesPriceColumns(db: LibSQLDatabase) {
  const result = await db.all(sql`PRAGMA table_info(${sql.raw(PACKAGES_TABLE)});`);

  const rows = Array.isArray(result)
    ? result
    : Array.isArray((result as any)?.rows)
      ? (result as any).rows
      : [];

  const hasPriceOriginal = rows.some((row: any) => row?.name === PRICE_ORIGINAL_COLUMN);
  const hasDiscountPercent = rows.some((row: any) => row?.name === DISCOUNT_PERCENT_COLUMN);
  const hasDiscountActive = rows.some((row: any) => row?.name === DISCOUNT_ACTIVE_COLUMN);

  if (!hasPriceOriginal) {
    await addColumnIfMissing(db, PRICE_ORIGINAL_COLUMN, PRICE_ORIGINAL_DEFINITION);
  }

  if (!hasDiscountPercent) {
    await addColumnIfMissing(db, DISCOUNT_PERCENT_COLUMN, DISCOUNT_PERCENT_DEFINITION);
  }

  if (!hasDiscountActive) {
    await addColumnIfMissing(db, DISCOUNT_ACTIVE_COLUMN, DISCOUNT_ACTIVE_DEFINITION);
  }
}

export function isMissingPackagesPriceColumnError(error: unknown) {
  return includesMessage(error, `no such column: ${PRICE_ORIGINAL_COLUMN}`) ||
    includesMessage(error, `no column named ${PRICE_ORIGINAL_COLUMN}`) ||
    includesMessage(error, `no such column: ${DISCOUNT_PERCENT_COLUMN}`) ||
    includesMessage(error, `no column named ${DISCOUNT_PERCENT_COLUMN}`) ||
    includesMessage(error, `no such column: ${DISCOUNT_ACTIVE_COLUMN}`) ||
    includesMessage(error, `no column named ${DISCOUNT_ACTIVE_COLUMN}`);
}

async function addColumnIfMissing(db: LibSQLDatabase, column: string, definition: string) {
  try {
    await db.run(sql.raw(`ALTER TABLE ${PACKAGES_TABLE} ADD COLUMN ${column} ${definition}`));
  } catch (error) {
    if (!isColumnAlreadyExistsError(error, column)) {
      throw error;
    }
  }
}

function isColumnAlreadyExistsError(error: unknown, column: string) {
  return includesMessage(error, `duplicate column name: ${column}`);
}

function includesMessage(error: unknown, text: string) {
  if (!error) return false;
  const message = extractMessage(error);
  if (message.includes(text)) {
    return true;
  }

  const cause = (error as any)?.cause;
  if (!cause) return false;
  return extractMessage(cause).includes(text);
}

function extractMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    return error.message ?? "";
  }
  if (error && typeof error === "object" && "message" in error && typeof (error as any).message === "string") {
    return (error as any).message as string;
  }
  return "";
}
