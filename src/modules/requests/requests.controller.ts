import { Request, Response, NextFunction } from "express";
import { RequestsService } from "./requests.service";
import { uploadToCloudinary } from "../../utils/cloudinary";

const service = new RequestsService();

const toPositiveNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export class RequestsController {
  async getOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const options = await service.getDriverFormOptions(req.user!.userId);
      res.status(200).json({ success: true, data: options });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      const softMaxImageMb = toPositiveNumber(process.env.IMAGE_MAX_SIZE_MB, 8);
      const softMaxImageBytes = softMaxImageMb * 1024 * 1024;

      const allowedFiles = files.filter(
        (file) => file.size <= softMaxImageBytes,
      );
      const oversizedSkipped = files.length - allowedFiles.length;

      const uploadResults = await Promise.allSettled(
        allowedFiles.map((file) => uploadToCloudinary(file.path)),
      );

      const imageUrls = uploadResults
        .filter(
          (result): result is PromiseFulfilledResult<string | null> =>
            result.status === "fulfilled",
        )
        .map((result) => result.value)
        .filter((url): url is string => Boolean(url));

      const failedUploads = allowedFiles.length - imageUrls.length;

      const request = await service.createRequest(
        req.user!.userId,
        req.body,
        imageUrls,
      );
      res.status(201).json({
        success: true,
        data: request,
        meta: {
          receivedImages: files.length,
          uploadedImages: imageUrls.length,
          failedUploads,
          oversizedSkipped,
          softMaxImageMb,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMy(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await service.getMyRequests(req.user!.userId);
      res.status(200).json({ success: true, data: requests });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getAllRequests(req.query);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await service.updateStatus(
        req.params.id,
        req.body.status,
      );
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      await service.markAsRead(req.params.id);
      res
        .status(200)
        .json({ success: true, message: "Уншсан төлөвт орууллаа." });
    } catch (error) {
      next(error);
    }
  }
}
