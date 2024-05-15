import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";

const TMP_FOLDER = path.resolve("tmp");
const UPLOADS_FOLDER = path.resolve(TMP_FOLDER, "uploads");

const multerConfig = {
  storage: multer.diskStorage({
    destination: TMP_FOLDER,
    filename(request, file, callback) {
      const fileHash = crypto.randomBytes(10).toString("hex");
      const fileName = `${fileHash}-${file.originalname}`;

      return callback(null, fileName);
    },
  }),
};

