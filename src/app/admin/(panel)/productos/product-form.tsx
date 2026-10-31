"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, ImagePlus, LoaderCircle, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { storageUrl } from "@/lib/env";
import { toWebp } from "@/lib/image-compress";
import type { Category } from "@/lib/types";
import { useSubmit } from "@/lib/use-submit";
import { deleteProduct, saveProduct, type ProductState } from "./actions";

export type FormProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string | null;
  tags: string[];
  is_active: boolean;
  is_featured: boolean;
  images: { path: string; alt: string }[];
};

const field =
  "w-full rounded-xl border border-border bg-surface px-4 text-[15px] outline-none transition focus:border-steel focus:ring-4 focus:ring-powder";
const MAX_IMAGES = 8;

export function ProductForm({
  product,
  newId,
  categories,
  justCreated,
}: {
  product: FormProduct | null;
  newId?: string;
  categories: Category[];
  justCreated?: boolean;
}) {
  // Un producto nuevo recibe su id desde ya: las fotos se suben a su carpeta antes de guardar.
  const [id] = useState(() => product?.id ?? newId ?? crypto.randomUUID());
  const [images, setImages] = useState(product?.images ?? []);
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [state, action, pending] = useActionState<ProductState, FormData>(saveProduct, { status: "idle" });
  const onSubmit = useSubmit(action);
  const err = (name: string) => (state.status === "error" ? state.fields?.[name] : undefined);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploadError(null);
    const room = MAX_IMAGES - images.length;
    const picked = [...files].slice(0, room);
    if (files.length > room) setUploadError(`Máximo ${MAX_IMAGES} fotos; se subieron las primeras ${room}.`);

    const supabase = createClient();
    setUploading((n) => n + picked.length);
    for (const file of picked) {
      try {
        const blob = await toWebp(file);
        const path = `${id}/${crypto.randomUUID()}.webp`;
        const { error } = await supabase.storage
          .from("products")
          .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
        if (error) throw new Error("No se pudo subir la foto. Revisa tu conexión.");
        setImages((prev) => [...prev, { path, alt: "" }]);
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Error al subir la foto.");
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  const move = (i: number, dir: -1 | 1) =>
    setImages((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div>
      <form onSubmit={onSubmit} className="space-y-8" noValidate>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="images" value={JSON.stringify(images)} />

        {/* Fotos */}
        <section aria-labelledby="fotos">
          <h2 id="fotos" className="mb-1 font-serif text-2xl font-medium">Fotos</h2>
          <p className="mb-4 text-sm text-muted">
            La primera es la portada. Se optimizan automáticamente. Hasta {MAX_IMAGES}.
          </p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((img, i) => (
              <li key={img.path} className="group relative">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-powder">
                  <Image src={storageUrl(img.path)} alt={img.alt || `Foto ${i + 1}`} fill sizes="25vw" className="object-cover" />
                  {i === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-navy px-2 py-0.5 text-[11px] text-ivory">
                      Portada
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <div className="flex">
                    <IconBtn label="Mover antes" onClick={() => move(i, -1)} disabled={i === 0}>
                      <ArrowLeft className="size-4" />
                    </IconBtn>
                    <IconBtn label="Mover después" onClick={() => move(i, 1)} disabled={i === images.length - 1}>
                      <ArrowRight className="size-4" />
                    </IconBtn>
                  </div>
                  <IconBtn label="Quitar foto" onClick={() => setImages((p) => p.filter((_, k) => k !== i))}>
                    <X className="size-4" />
                  </IconBtn>
                </div>
              </li>
            ))}
            {Array.from({ length: uploading }, (_, i) => (
              <li key={`up-${i}`} className="grid aspect-[4/5] place-items-center rounded-xl bg-powder/70">
                <LoaderCircle className="size-6 animate-spin text-steel" />
              </li>
            ))}
            {images.length + uploading < MAX_IMAGES && (
              <li>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="grid aspect-[4/5] w-full place-items-center rounded-xl border-2 border-dashed border-dusty text-muted transition hover:border-steel hover:text-navy"
                >
                  <span className="flex flex-col items-center gap-1.5 text-sm">
                    <ImagePlus className="size-6" strokeWidth={1.5} /> Agregar
                  </span>
                </button>
              </li>
            )}
          </ul>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          {uploadError && <p role="alert" className="mt-3 text-sm text-red-700">{uploadError}</p>}
          {err("images") && <p role="alert" className="mt-3 text-sm text-red-700">{err("images")}</p>}
        </section>

        {/* Datos */}
        <section aria-labelledby="datos" className="space-y-4">
          <h2 id="datos" className="font-serif text-2xl font-medium">Datos</h2>

          <Labeled label="Nombre" error={err("name")}>
            <input name="name" defaultValue={product?.name} maxLength={120} required className={`${field} h-12`} />
          </Labeled>

          <div className="grid gap-4 sm:grid-cols-2">
            <Labeled label="Precio (L)" error={err("price")}>
              <input
                name="price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                defaultValue={product?.price}
                required
                className={`${field} h-12`}
              />
            </Labeled>
            <Labeled label="Categoría">
              <select name="category_id" defaultValue={product?.category_id ?? ""} className={`${field} h-12`}>
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Labeled>
          </div>

          <Labeled label="Descripción" error={err("description")}>
            <textarea name="description" rows={4} defaultValue={product?.description} maxLength={2000} className={`${field} resize-y py-3`} />
          </Labeled>

          <Labeled label="Etiquetas" hint="Separadas por coma. Aparecen como filtros de estilo: kawaii, dorado, regalo" error={err("tags")}>
            <input name="tags" defaultValue={product?.tags.join(", ")} className={`${field} h-12`} />
          </Labeled>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:gap-8">
            <Check2 name="is_active" label="Visible en la tienda" defaultChecked={product?.is_active ?? true} />
            <Check2 name="is_featured" label="Destacado (sale en Más vendidos al inicio)" defaultChecked={product?.is_featured ?? false} />
          </div>
        </section>

        {/* Barra de acciones */}
        <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t border-border bg-ivory/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
          <button
            type="submit"
            disabled={pending || uploading > 0}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-navy text-sm font-medium text-ivory transition hover:bg-navy/90 active:scale-[0.98] disabled:opacity-60 sm:flex-none sm:px-10"
          >
            {pending ? <LoaderCircle className="size-[18px] animate-spin" /> : null}
            {pending ? "Guardando…" : uploading > 0 ? "Subiendo fotos…" : product ? "Guardar cambios" : "Crear producto"}
          </button>
          <p role="status" className="text-sm">
            {state.status === "saved" && (
              <span className="inline-flex items-center gap-1 text-navy"><Check className="size-4" /> Guardado</span>
            )}
            {state.status === "idle" && justCreated && (
              <span className="inline-flex items-center gap-1 text-navy"><Check className="size-4" /> Producto creado</span>
            )}
            {state.status === "error" && <span className="text-red-700">{state.message}</span>}
          </p>
        </div>
      </form>

      {product && (
        <form action={deleteProduct} className="mt-10 border-t border-border pt-6">
          <input type="hidden" name="id" value={product.id} />
          {confirmDelete ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm">¿Eliminar para siempre? Los pedidos anteriores se conservan.</p>
              <button className="h-10 rounded-full bg-red-700 px-5 text-sm text-white">Sí, eliminar</button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="h-10 px-3 text-sm text-muted hover:text-navy">
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-red-700"
            >
              <Trash2 className="size-4" /> Eliminar producto
            </button>
          )}
        </form>
      )}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-powder hover:text-navy disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function Labeled({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-sm text-red-700">{error}</span>}
    </label>
  );
}

function Check2({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-5 rounded accent-navy" />
      {label}
    </label>
  );
}
