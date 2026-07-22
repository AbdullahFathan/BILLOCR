import { ReceiptItem } from "@/types";

export interface DinerBreakdown {
  name: string;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  items: Array<{
    itemName: string;
    qty: number;
    price: number;
    shareCost: number;
  }>;
}

/**
 * Calculates per-diner breakdown (subtotal, proportional tax/service, total)
 * from a list of receipt items, assignments, and shared charges.
 *
 * Single source of truth — used by BillSummaryCard, page.tsx (Settle tab),
 * and handleCopyRecap.
 */
export function calcDinerBreakdowns(
  diners: string[],
  items: ReceiptItem[],
  assignments: Record<string, Record<string, number>>,
  tax: number,
  serviceCharge: number,
): DinerBreakdown[] {
  const overallSubtotal = items.reduce(
    (sum, item) => sum + item.qty * item.price,
    0,
  );

  return diners.map((dinerName) => {
    let dinerSubtotal = 0;
    const itemizedList: DinerBreakdown["items"] = [];

    items.forEach((item) => {
      const assignedQty = (assignments[item.id] || {})[dinerName] || 0;
      if (assignedQty > 0) {
        const shareCost = assignedQty * item.price;
        dinerSubtotal += shareCost;
        itemizedList.push({
          itemName: item.name,
          qty: assignedQty,
          price: item.price,
          shareCost,
        });
      }
    });

    const dinerTax =
      overallSubtotal > 0 ? (dinerSubtotal / overallSubtotal) * tax : 0;
    const dinerServiceCharge =
      overallSubtotal > 0
        ? (dinerSubtotal / overallSubtotal) * serviceCharge
        : 0;
    const dinerTotal = Math.round(dinerSubtotal + dinerTax + dinerServiceCharge);

    return {
      name: dinerName,
      subtotal: dinerSubtotal,
      tax: dinerTax,
      serviceCharge: dinerServiceCharge,
      total: dinerTotal,
      items: itemizedList,
    };
  });
}
