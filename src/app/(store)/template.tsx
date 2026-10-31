// A diferencia del layout, el template se vuelve a montar en cada navegación:
// cada página entra con un fundido corto en vez de aparecer de golpe.
export default function StoreTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
