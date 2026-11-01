// Se muestra al instante al cambiar de pestaña, mientras llegan los datos.
export default function PanelLoading() {
  return (
    <div aria-busy="true" aria-label="Cargando">
      <div className="shimmer h-9 w-40 rounded-xl" />
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="shimmer h-28 rounded-3xl" />
        <div className="shimmer h-28 rounded-3xl" />
      </div>
      <div className="mt-8 space-y-3">
        <div className="shimmer h-36 rounded-3xl" />
        <div className="shimmer h-36 rounded-3xl" />
        <div className="shimmer h-36 rounded-3xl" />
      </div>
    </div>
  );
}
