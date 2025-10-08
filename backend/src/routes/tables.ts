import { Router } from "express";

const router = Router();

// Placeholder in-memory store.
const tables = new Map<string, { slug: string; name: string; active: boolean }>();

router.get("/", (_req, res) => {
  res.json({ data: Array.from(tables.values()) });
});

router.post("/", (req, res) => {
  const { slug, name, active = true } = req.body ?? {};
  if (!slug || !name) {
    return res.status(400).json({ message: "slug dan name wajib diisi" });
  }
  tables.set(slug, { slug, name, active });
  return res.status(201).json({ message: "Meja ditambahkan", table: tables.get(slug) });
});

router.patch("/:slug", (req, res) => {
  const { slug } = req.params;
  const existing = tables.get(slug);
  if (!existing) {
    return res.status(404).json({ message: "Meja tidak ditemukan" });
  }
  const next = { ...existing, ...req.body };
  tables.set(slug, next);
  return res.json({ message: "Meja diperbarui", table: next });
});

router.delete("/:slug", (req, res) => {
  const { slug } = req.params;
  tables.delete(slug);
  return res.json({ message: "Meja dihapus" });
});

export default router;
