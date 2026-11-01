-- Etapas del pedido para compras por lote: ... confirmado -> pedido al proveedor -> en camino -> listo -> entregado.
-- (preparando se muestra como "Pedido realizado"). Va en su propio archivo: un valor nuevo de enum
-- no se puede usar en la misma transacción en que se crea.
alter type public.order_status add value if not exists 'en_camino' before 'entregado';
alter type public.order_status add value if not exists 'listo' before 'entregado';
