import { Router } from "express";
import UserController from "../controllers/UserController.js";

const userCreate = new UserController();

const usersRouters = Router();

usersRouters.post("/", userCreate.create);

export default usersRouters;
