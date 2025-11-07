import { NextResponse } from "next/server";

import { getPackages } from "@/lib/queries";

export async function GET() {
  const packages = await getPackages();

  return NextResponse.json({
    data: packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      features: pkg.features,
      price_original_idr: pkg.priceOriginalIdr,
      discount_percent: pkg.discountPercent,
      discount_active: pkg.discountActive,
      discount_start_at: null,
      discount_end_at: null,
      computed: {
        is_discount_active: pkg.computed.isDiscountActive,
        price_final_idr: pkg.computed.priceFinalIdr,
      },
    })),
  });
}
