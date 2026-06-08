import { findSuppliers, type SupplierSearchParams } from "../services/supplierService.js";
import type { SupplierOption } from "../types/supplier.js";

/** Tool wrapper for search_supplier_matches. */
export async function searchSuppliers(input: SupplierSearchParams): Promise<SupplierOption[]> {
  return findSuppliers(input);
}
