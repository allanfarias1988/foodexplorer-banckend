import "express-async-errors";
import express from "express";
import cors from "cors";
import AppError from "./src/utils/AppError.js";
import routes from "./src/routes/index.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/files", express.static("files"));
app.use(routes);

app.use((error, req, res, next) => {
    if(error instanceof AppError){
        return res.status(error.statusCode).json({
            status: "error",
            message: error.message
        })
    }

    return res.status(500).json({
        status: "error",
        message: "Internal server error"
    })
})



const PORT = 3333;

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));