import { useState } from "react";
import type { ProductImage as ProductImageT } from "../lib/types";

interface Props {
  image?: ProductImageT;
  name: string;
  fit?: "cover" | "contain";
  showBadge?: boolean;
  className?: string;
}

/** Image container: gradient bg, skeleton, lazy load, broken-image fallback, placeholder badge. */
export function ProductImage({ image, name, fit = "cover", showBadge = true, className = "" }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const isPlaceholder = !image || image.fallback_used || image.image_type.includes("placeholder");
  const realFit = isPlaceholder ? "contain" : fit;
  const src = error || !image ? "" : image.image_url;

  return (
    <div className={`pimg ${className}`}>
      {!loaded && !error && <div className="pimg-skeleton" />}
      {src ? (
        <img
          src={src}
          alt={image?.image_alt_text || name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => { setError(true); setLoaded(true); }}
          style={{ objectFit: realFit, opacity: loaded ? 1 : 0 }}
        />
      ) : (
        <div className="pimg-broken"><span>{name}</span></div>
      )}
      {showBadge && isPlaceholder && !error && <span className="pimg-badge">Illustration</span>}
      {showBadge && image && !isPlaceholder && <span className="pimg-badge real">{image.image_source_name}</span>}
    </div>
  );
}
