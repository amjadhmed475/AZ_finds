import { useEffect } from "react";
import type { DashProduct, MarketingStrategy } from "../lib/types";
import { ProductDetail } from "./ProductDetail";

export function ProductDetailModal({ product, marketing, onClose, initialTab }: { product: DashProduct | null; marketing?: MarketingStrategy; onClose: () => void; initialTab?: string }) {
  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [product, onClose]);

  if (!product) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <ProductDetail key={product.id} product={product} marketing={marketing} initialTab={initialTab} />
      </div>
    </div>
  );
}
