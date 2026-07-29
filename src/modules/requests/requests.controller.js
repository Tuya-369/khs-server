"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestsController = void 0;
const requests_service_1 = require("./requests.service");
const cloudinary_1 = require("../../utils/cloudinary");
const service = new requests_service_1.RequestsService();
const toPositiveNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
class RequestsController {
    async getOptions(req, res, next) {
        try {
            const options = await service.getDriverFormOptions(req.user.userId);
            res.status(200).json({ success: true, data: options });
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const files = req.files || [];
            const softMaxImageMb = toPositiveNumber(process.env.IMAGE_MAX_SIZE_MB, 8);
            const softMaxImageBytes = softMaxImageMb * 1024 * 1024;
            const allowedFiles = files.filter((file) => file.size <= softMaxImageBytes);
            const oversizedSkipped = files.length - allowedFiles.length;
            const uploadResults = await Promise.allSettled(allowedFiles.map((file) => (0, cloudinary_1.uploadToCloudinary)(file.path)));
            const imageUrls = uploadResults
                .filter((result) => result.status === "fulfilled")
                .map((result) => result.value)
                .filter((url) => Boolean(url));
            const failedUploads = allowedFiles.length - imageUrls.length;
            const request = await service.createRequest(req.user.userId, req.body, imageUrls);
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
        }
        catch (error) {
            next(error);
        }
    }
    async getMy(req, res, next) {
        try {
            const requests = await service.getMyRequests(req.user.userId);
            res.status(200).json({ success: true, data: requests });
        }
        catch (error) {
            next(error);
        }
    }
    async getAll(req, res, next) {
        try {
            const result = await service.getAllRequests(req.query);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updateStatus(req, res, next) {
        try {
            const updated = await service.updateStatus(req.params.id, req.body.status);
            res.status(200).json({ success: true, data: updated });
        }
        catch (error) {
            next(error);
        }
    }
    async markRead(req, res, next) {
        try {
            await service.markAsRead(req.params.id);
            res
                .status(200)
                .json({ success: true, message: "Уншсан төлөвт орууллаа." });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RequestsController = RequestsController;
