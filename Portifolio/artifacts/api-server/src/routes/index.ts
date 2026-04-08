import { Router, type IRouter } from "express";
import githubRouter from "./github";

const router: IRouter = Router();

router.use(githubRouter);

export default router;