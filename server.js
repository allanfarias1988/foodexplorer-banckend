import "express-async-errors";
import "dotenv/config";
import cors from "cors";
import express from "express";
import routes from "./src/routes/index.js";
import AppError from "./src/utils/AppError.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use("/files", express.static("files"));
app.use(routes);

app.use((error, req, res, next) => {
	if (error instanceof AppError) {
		return res.status(error.statusCode).json({
			status: "error",
			message: error.message,
		});
	}

	return res.status(500).json({
		status: "error",
		message: "Internal server error",
	});
});

const PORT = process.env.SERVER_PORT;

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
