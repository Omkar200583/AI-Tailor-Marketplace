import { Router } from "express";
import { protect } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { uploadImages } from "../../middleware/upload";
import { addressSchema, updateProfileSchema } from "../../validators/user.validator";
import * as c from "./user.controller";

const router = Router();
router.use(protect);

router.get("/me", c.getProfile);
router.put("/me", validate({ body: updateProfileSchema }), c.updateProfile);
router.post("/me/image", uploadImages.single("image"), c.uploadProfileImage);

router.get("/me/addresses", c.listAddresses);
router.post("/me/addresses", validate({ body: addressSchema }), c.addAddress);
router.put("/me/addresses/:id", validate({ body: addressSchema.partial() }), c.updateAddress);
router.delete("/me/addresses/:id", c.deleteAddress);

router.get("/me/photos", c.listPhotos);
router.post("/me/photos", uploadImages.array("photos", 5), c.uploadPhotos);
router.delete("/me/photos/:id", c.deletePhoto);

export default router;
