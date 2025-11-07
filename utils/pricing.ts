export type DiscountSource = {
  discountPercent?: number | null;
  discountActive?: boolean | null;
  discountStartAt?: string | number | Date | null;
  discountEndAt?: string | number | Date | null;
};

function toDate(value: DiscountSource["discountStartAt"]) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isDiscountActive(source?: DiscountSource | null) {
  if (!source) return false;
  const percent = Number(source.discountPercent ?? 0);
  if (!Number.isFinite(percent) || percent <= 0) return false;

  if (source.discountActive !== undefined && source.discountActive !== null) {
    return Boolean(source.discountActive);
  }

  const now = new Date();
  const startOk = (() => {
    const start = toDate(source.discountStartAt);
    return !start || start <= now;
  })();
  const endOk = (() => {
    const end = toDate(source.discountEndAt);
    return !end || now <= end;
  })();

  return startOk && endOk;
}

export function computeFinalPrice(priceOriginal: number, discountPercent: number) {
  const original = Number.isFinite(priceOriginal) ? priceOriginal : 0;
  const percent = Number.isFinite(discountPercent) ? discountPercent : 0;
  const raw = Math.floor((original * (100 - percent)) / 100);
  return Math.max(0, raw);
}

export function formatIDR(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
