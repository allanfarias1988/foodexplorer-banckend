import { Router } from "express";
import foodsRoutes from "./foods.routes.js";
import sessionsRoutes from "./sessions.routes.js";
import usersRouters from "./users.routes.js";

const routes = Router();

routes.use("/users", usersRouters);
routes.use("/sessions", sessionsRoutes);
routes.use("/foods", foodsRoutes);

export default routes;
