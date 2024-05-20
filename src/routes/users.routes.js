import { Router } from "express";
import UsersController from "../controllers/UsersController.js";
import verifyToken from "../middlewares/verifyToken.js";

const userCreate = new UsersController();

const usersRouters = Router();

usersRouters.post("/", userCreate.create);
usersRouters.use(verifyToken);
usersRouters.get("/", userCreate.index);

export default usersRouters;
