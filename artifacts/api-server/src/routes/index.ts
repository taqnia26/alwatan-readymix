import { Router, type IRouter } from "express";
import alwatanRouter from "./alwatan";
import healthRouter from "./health";
import authRouter from "./auth";
import adminManagementRouter from "./admin-management";
import storageRouter from "./storage";
import studioRouter from "./studio";
import insightsRouter from "./insights";
import webChatRouter from "./web-chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(alwatanRouter);
router.use(adminManagementRouter);
router.use(storageRouter);
router.use(studioRouter);
router.use(insightsRouter);
router.use(webChatRouter);

export default router;
