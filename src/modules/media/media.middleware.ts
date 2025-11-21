import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "../../config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "blog_media";
    let resource_type: "image" | "raw" = "image";

    if (file.mimetype === "application/pdf") resource_type = "raw";
    else if (!file.mimetype.startsWith("image/")) resource_type = "raw";

    return {
      folder,
      resource_type,
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
    };
  },
});

export const upload = multer({ storage });
