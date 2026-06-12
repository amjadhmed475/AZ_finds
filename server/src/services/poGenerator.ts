export interface POItem { product_name: string; asin?: string; qty: number; unit_price: number; }
export interface PORequest {
  po_number: string;
  supplier_name: string;
  contact_email?: string;
  items: POItem[];
  payment_terms?: string;
  expected_delivery?: string;
  notes?: string;
}

export function generatePO(req: PORequest): string {
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const subtotal = req.items.reduce((s, i) => s + i.qty * i.unit_price, 0);
  const shipping = Math.round(subtotal * 0.08 * 100) / 100;
  const total = Math.round((subtotal + shipping) * 100) / 100;
  const deposit = Math.round(total * 0.3 * 100) / 100;
  const balance = Math.round((total - deposit) * 100) / 100;

  const itemLines = req.items.map((item, i) => {
    const lineTotal = Math.round(item.qty * item.unit_price * 100) / 100;
    return `  ${i + 1}. ${item.product_name}${item.asin ? ` (${item.asin})` : ""}
     ${item.qty} units @ $${item.unit_price.toFixed(2)}/unit = $${lineTotal.toFixed(2)}`;
  }).join("\n");

  return `PURCHASE ORDER #${req.po_number}
${"═".repeat(50)}
Date:     ${date}
To:       ${req.supplier_name}${req.contact_email ? `\n          ${req.contact_email}` : ""}
From:     Yamari Group | amjadhmed475@gmail.com

ITEMS:
${itemLines}

${"─".repeat(50)}
Subtotal:         $${subtotal.toFixed(2)}
Shipping (est.):  $${shipping.toFixed(2)}
TOTAL:            $${total.toFixed(2)}
${"─".repeat(50)}
Payment Terms:    ${req.payment_terms ?? "30% deposit on confirmation, 70% before shipment"}
Deposit Due:      $${deposit.toFixed(2)}
Balance Due:      $${balance.toFixed(2)}
Expected Delivery: ${req.expected_delivery ?? "TBD"}
${req.notes ? `\nNotes: ${req.notes}` : ""}

${"═".repeat(50)}
Please confirm receipt and stock availability within 48 hours.
Authorized by: Yamari Group`;
}
