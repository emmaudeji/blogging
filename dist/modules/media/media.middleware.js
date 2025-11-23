"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinary_1 = require("../../config/cloudinary");
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.cloudinary,
    params: async (req, file) => {
        let folder = "blog_media";
        let resource_type = "image";
        if (file.mimetype === "application/pdf")
            resource_type = "raw";
        else if (!file.mimetype.startsWith("image/"))
            resource_type = "raw";
        return {
            folder,
            resource_type,
            public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
        };
    },
});
exports.upload = (0, multer_1.default)({ storage });
