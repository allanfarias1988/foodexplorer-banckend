import { Router } from "express";
import SessionsControllers from "../controllers/SessionsController.js";

const sessionsController = new SessionsControllers();
const sessionsRoutes = Router();

sessionsRoutes.post("/", sessionsController.create);

export default sessionsRoutes;
