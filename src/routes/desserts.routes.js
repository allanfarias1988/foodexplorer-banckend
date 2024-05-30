import { Router } from "express";
import DessertsController from "../controllers/DessertsController.js";
import verifyToken from "../middlewares/verifyToken.js";

const dessertsRoutes = Router();
const dessertsController = new DessertsController();

dessertsRoutes.use(verifyToken);

dessertsRoutes.post("/", dessertsController.create);
dessertsRoutes.get("/", dessertsController.index);
dessertsRoutes.get("/:id", dessertsController.show);
dessertsRoutes.put("/:id", dessertsController.update);
dessertsRoutes.delete("/:id", dessertsController.delete);

export default dessertsRoutes;
