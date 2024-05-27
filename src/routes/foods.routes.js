import { Router } from "express";
import FoodsController from "../controllers/FoodsController.js";
import verifyToken from "../middlewares/verifyToken.js";

const foodsRoutes = Router();
const foodsController = new FoodsController();

foodsRoutes.use(verifyToken);

foodsRoutes.post("/", foodsController.create);
foodsRoutes.get("/", foodsController.index);
foodsRoutes.get("/:id", foodsController.show);
foodsRoutes.put("/", foodsController.update);

export default foodsRoutes;
