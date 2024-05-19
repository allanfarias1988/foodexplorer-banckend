import { Router } from "express";
import usersRouters from "./user.routes.js";

const routes = Router();

routes.use("/users", usersRouters);

export default routes;
