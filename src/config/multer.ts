import { v4 as uuid } from "uuid";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = uuid();
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

export default upload;
