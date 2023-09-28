import { Config } from "@config/index";
import { FirebaseApp, initializeApp } from "firebase/app";
import { FirebaseStorage, deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

import fs from "fs";
import { BusinessError } from "@helper/handleError";
import { ErrorType } from "@enum/index";

export class FirebaseService {
    private app: FirebaseApp;
    private storage: FirebaseStorage;
    constructor() {
        const config = new Config();
        const firebaseConfig = {
            apiKey: "AIzaSyC4zINB4NU9Lflmgc2WaD4keD5EGoyEGpI",
            authDomain: "gasskeun-topup.firebaseapp.com",
            projectId: "gasskeun-topup",
            storageBucket: "gasskeun-topup.appspot.com",
            messagingSenderId: "1010278938250",
            appId: "1:1010278938250:web:012c47a8798d838e601f73",
            measurementId: "G-KHDQDR5EBG",
        };

        this.app = initializeApp(firebaseConfig);
        this.storage = getStorage();
    }

    async uploadImg(localFilePath: string, destinationPath: string): Promise<any> {
        try {
            const storageRef = ref(this.storage, "assets/" + destinationPath);

            const imgBuffer = fs.readFileSync(localFilePath);
            const upload = await uploadBytes(storageRef, imgBuffer, {
                contentType: "image/png",
                cacheControl: "public, max-age=31536000",
            });

            console.log(upload);

            const downloadUrl = await getDownloadURL(upload.ref);
            fs.unlinkSync(localFilePath);
            return downloadUrl;
        } catch (error) {
            console.log(error.message);
            throw new BusinessError(
                "Tampaknya ada masalah ketika upload file, cobalah beberapa saat lagi",
                ErrorType.Internal,
            );
        }
    }

    async deleteImg(currentUrlImg: string): Promise<any> {
        const parsedUrl = new URL(currentUrlImg);
        const path = parsedUrl.pathname.split("/o/")[1].split("?")[0];
        const decodedPath = decodeURIComponent(path);
        const storageRef = ref(this.storage, decodedPath);
        const del = await deleteObject(storageRef);
        return del;
    }

    async updateImg(localFilePath: string, currentUrlImg: string, newDestinationPath: string): Promise<any> {
        await this.deleteImg(currentUrlImg);
        const newImg = await this.uploadImg(localFilePath, newDestinationPath);
        return newImg;
    }
}
