import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import categoriesRouter from "./categories.js";
import vendorsRouter from "./vendors.js";
import vendorProductsRouter from "./vendorProducts.js";
import productsRouter from "./products.js";
import cartRouter from "./cart.js";
import ordersRouter from "./orders.js";
import inventoryRouter from "./inventory.js";
import analyticsRouter from "./analytics.js";
import notificationsRouter from "./notifications.js";
import wishlistRouter from "./wishlist.js";
import kycRouter from "./kyc.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/categories", categoriesRouter);
router.use("/vendors", vendorsRouter);
router.use("/vendor/products", vendorProductsRouter);
router.use("/products", productsRouter);
router.use("/cart", cartRouter);
router.use("/orders", ordersRouter);
router.use("/inventory", inventoryRouter);
router.use("/analytics", analyticsRouter);
router.use("/notifications", notificationsRouter);
router.use("/wishlist", wishlistRouter);
router.use("/kyc", kycRouter);

export default router;
