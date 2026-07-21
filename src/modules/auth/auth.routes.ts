import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import {
  createUserByAdminSchema,
  registerSchema,
  loginSchema,
} from "./auth.validation";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();
const controller = new AuthController();

router.post("/register", validate(registerSchema), controller.register);
router.post(
  "/admin/create-user",
  authenticate,
  authorize("ADMIN"),
  validate(createUserByAdminSchema),
  controller.createByAdmin,
);
router.post("/login", validate(loginSchema), controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);
router.get("/me", authenticate, controller.me);

export default router;
