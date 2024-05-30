import { Router } from "express";
import dessertsRoutes from "./desserts.routes.js";
import drinksRoutes from "./drinks.routes.js";
import foodsRoutes from "./foods.routes.js";
import sessionsRoutes from "./sessions.routes.js";
import usersRouters from "./users.routes.js";

const routes = Router();

routes.use("/users", usersRouters);
routes.use("/sessions", sessionsRoutes);
routes.use("/foods", foodsRoutes);
routes.use("/drinks", drinksRoutes);
routes.use("/desserts", dessertsRoutes);

export default routes;
