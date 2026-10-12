import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { upload } from "../../middlewares/upload.middleware";
import { MerchPartnerService } from "./merch-partner.service";

const router = Router();
const service = new MerchPartnerService();

router.get("/", async (_req, res, next) => {
  try {
    res.set("Cache-Control", "public, max-age=60, s-maxage=300");
    res.json({ success: true, data: await service.getAll() });
  } catch (error) {
    next(error);
  }
});

export const adminMerchPartnerRoutes = Router();

adminMerchPartnerRoutes.patch(
  "/:id",
  authenticate,
  authorize("SUPERADMIN"),
  upload.single("logo"),
  async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: await service.update(req.params.id, req.body, req.file),
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
