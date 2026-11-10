import { NextFunction, Request, Response, Router } from "express";
import { protect, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { categorySchema } from "../../validators/category.validator";
import * as c from "./category.controller";

const router = Router();

// optional auth so admins also see inactive categories
const softAuth = (req: Request, res: Response, next: NextFunction) =>
  req.headers.authorization || req.cookies?.token ? protect(req, res, (err?: any) => next()) : next();

router.get("/", softAuth, c.listCategories);
router.get("/:id", c.getCategory);
router.post("/", protect, authorize("admin"), validate({ body: categorySchema }), c.createCategory);
router.put("/:id", protect, authorize("admin"), validate({ body: categorySchema.partial() }), c.updateCategory);
router.delete("/:id", protect, authorize("admin"), c.deleteCategory);

export default router;
