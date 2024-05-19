import { Router } from "express";
import UserController from "../controllers/UserController.js";
import verifyToken from "../middlewares/verifyToken.js";

const userCreate = new UserController();

const usersRouters = Router();

usersRouters.post("/", userCreate.create);
usersRouters.get("/", verifyToken, userCreate.index);

export default usersRouters;
