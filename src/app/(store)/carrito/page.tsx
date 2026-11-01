import type { Metadata } from "next";
import { CartView } from "./cart-view";

export const metadata: Metadata = { title: "Carrito", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-10">
      <h1 className="font-display text-[2rem] font-extrabold leading-none tracking-[-0.04em] sm:text-5xl">Tu pedido</h1>
      <CartView />
    </div>
  );
}
