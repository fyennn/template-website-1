import { Router } from "express";

const router = Router();

const orders = new Map<string, any>();

router.get("/", (_req, res) => {
  res.json({ data: Array.from(orders.values()) });
});

router.post("/", (req, res) => {
  const { id, tableId, items = [], total } = req.body ?? {};
  if (!id) {
    return res.status(400).json({ message: "id wajib diisi" });
  }
  const payload = { id, tableId, items, total, createdAt: new Date().toISOString() };
  orders.set(id, payload);
  res.status(201).json({ message: "Pesanan dibuat", order: payload });
});

export default router;
