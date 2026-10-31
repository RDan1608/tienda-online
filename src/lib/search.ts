/** "Joyería Mínimal" → "joyeria minimal": buscar sin importar tildes ni mayúsculas. */
export function normalizeText(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}
