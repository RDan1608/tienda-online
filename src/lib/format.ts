const hnl = new Intl.NumberFormat("es-HN", {
  style: "currency",
  currency: "HNL",
  minimumFractionDigits: 2,
});

/** 250 → "L 250.00" */
export function formatPrice(value: number | string) {
  return hnl.format(Number(value));
}
