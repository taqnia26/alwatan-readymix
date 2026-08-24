import { Router, type IRouter } from "express";
import alwatanRouter from "./alwatan";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(alwatanRouter);

export default router;
