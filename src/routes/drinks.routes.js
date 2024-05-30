import { Router } from "express";
import DrinksController from "../controllers/DrinksController.js";
import verifyToken from "../middlewares/verifyToken.js";

const drinksRoutes = Router();
const drinksController = new DrinksController();

drinksRoutes.use(verifyToken);

drinksRoutes.post("/", drinksController.create);
drinksRoutes.get("/", drinksController.index);
drinksRoutes.get("/:id", drinksController.show);
drinksRoutes.put("/:id", drinksController.update);
drinksRoutes.delete("/:id", drinksController.delete);

export default drinksRoutes;
