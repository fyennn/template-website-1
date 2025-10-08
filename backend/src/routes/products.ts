import { Router } from "express";

const router = Router();

const products = new Map<string, any>();

router.get("/", (_req, res) => {
  res.json({ data: Array.from(products.values()) });
});

router.post("/", (req, res) => {
  const { id, name, price } = req.body ?? {};
  if (!id || !name || typeof price !== "number") {
    return res.status(400).json({ message: "id, name, price wajib diisi" });
  }
  const payload = { id, name, price };
  products.set(id, payload);
  res.status(201).json({ message: "Produk ditambahkan", product: payload });
});

export default router;
