import { Router } from "express";
import { MerchService } from "./merch.service";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();
const service = new MerchService();

router.get("/", async (req, res, next) => {
  try {
    res.json({ success: true, data: await service.getAll() });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    res.json({ success: true, data: await service.getById(req.params.id) });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/",
  authenticate,
  authorize("TOKEN_MANAGER"),
  async (req, res, next) => {
    try {
      res
        .status(201)
        .json({ success: true, data: await service.create(req.body) });
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/:id",
  authenticate,
  authorize("TOKEN_MANAGER"),
  async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: await service.update(req.params.id, req.body),
      });
    } catch (e) {
      next(e);
    }
  },
);

router.delete(
  "/:id",
  authenticate,
  authorize("TOKEN_MANAGER"),
  async (req, res, next) => {
    try {
      await service.delete(req.params.id);
      res.json({ success: true, message: "Устгагдлаа." });
    } catch (e) {
      next(e);
    }
  },
);

export default router;
