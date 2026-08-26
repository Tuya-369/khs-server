import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import {
  createUserByAdminSchema,
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  updateMeSchema,
  forgotPasswordSchema,
  verifyForgotOtpSchema,
  resetPasswordSchema,
  requestRegistrationOtpSchema,
  verifyRegistrationOtpSchema,
} from "./auth.validation";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { upload } from "../../middlewares/upload.middleware";

const router = Router();
const controller = new AuthController();

router.post(
  "/register",
  validate(registerSchema),
  controller.requestRegistrationOtp,
);
router.post(
  "/register/request-otp",
  validate(requestRegistrationOtpSchema),
  controller.requestRegistrationOtp,
);
router.post(
  "/register/verify-otp",
  validate(verifyRegistrationOtpSchema),
  controller.verifyRegistrationOtp,
);
router.post(
  "/admin/create-user",
  authenticate,
  authorize("ADMIN"),
  validate(createUserByAdminSchema),
  controller.createByAdmin,
);
router.post("/login", validate(loginSchema), controller.login);
router.post("/verify-otp", validate(verifyOtpSchema), controller.verifyOtp);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  controller.forgotPassword,
);
router.post(
  "/verify-forgot-otp",
  validate(verifyForgotOtpSchema),
  controller.verifyForgotOtp,
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  controller.resetPassword,
);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);
router.get("/me", authenticate, controller.me);
router.patch(
  "/me",
  authenticate,
  upload.single("profileImage"),
  validate(updateMeSchema),
  controller.updateMe,
);

export default router;
