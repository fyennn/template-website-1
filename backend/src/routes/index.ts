import { Router } from "express";
import tableRouter from "./tables";
import productRouter from "./products";
import orderRouter from "./orders";

const router = Router();

router.use("/tables", tableRouter);
router.use("/products", productRouter);
router.use("/orders", orderRouter);

export default router;
