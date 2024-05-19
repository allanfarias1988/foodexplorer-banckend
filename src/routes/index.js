import { Router } from "express";
import sessionRoutes from "./session.routes.js";
import usersRouters from "./user.routes.js";

const routes = Router();

routes.use("/users", usersRouters);
routes.use("/sessions", sessionRoutes);

export default routes;
