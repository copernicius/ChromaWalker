import fs from "node:fs/promises";
import path from "node:path";
import type { Request, Response } from "express";
import { PALETTE_IDS } from "../lib/palette";
import { ErrCode, fail, ok } from "../lib/response";
import Bookmark from "../models/Bookmark";
import Comment from "../models/Comment";
import Like from "../models/Like";
import Photo, { type TaskType } from "../models/Photo";
import User from "../models/User";

const ALLOWED_TASK_TYPES = new Set<Exclude<TaskType, null>>([
	"daily",
	"solo",
	"team",
]);

// POST /api/photos/upload  (auth-gated; multipart/form-data)
export async function uploadPhoto(req: Request, res: Response): Promise<void> {
	try {
		if (!req.file) {
			fail(res, ErrCode.MISSING_PARAM, "No image file provided");
			return;
		}

		const userId = req.userId;
		if (!userId) {
			fail(res, ErrCode.AUTH_FAILED, "Authentication required");
			return;
		}

		const {
			color,
			location,
			taskType: rawTaskType,
			missionId,
			pointsAwarded: rawPoints,
			lat,
			lng,
			caption,
		} = req.body as {
			color?: string;
			location?: string;
			taskType?: string;
			missionId?: string;
			pointsAwarded?: string | number;
			lat?: string | number;
			lng?: string | number;
			caption?: string;
		};

		if (!color || !PALETTE_IDS.has(color)) {
			fail(res, ErrCode.INVALID_PARAM, "Invalid or missing color");
			return;
		}

		if (!location) {
			fail(res, ErrCode.MISSING_PARAM, "location is required");
			return;
		}

		// Empty string from FormData → null (free upload).
		let taskType: TaskType = null;
		if (rawTaskType && rawTaskType !== "") {
			if (!ALLOWED_TASK_TYPES.has(rawTaskType as Exclude<TaskType, null>)) {
				fail(res, ErrCode.INVALID_PARAM, "Invalid taskType");
				return;
			}
			taskType = rawTaskType as Exclude<TaskType, null>;
		}

		if ((taskType === "solo" || taskType === "team") && !missionId) {
			fail(
				res,
				ErrCode.MISSING_PARAM,
				"missionId is required for solo/team tasks",
			);
			return;
		}

		const points = Number(rawPoints);
		if (!Number.isFinite(points) || points < 0) {
			fail(res, ErrCode.INVALID_PARAM, "Invalid pointsAwarded");
			return;
		}

		const user = await User.findById(userId);
		if (!user) {
			fail(res, ErrCode.NOT_FOUND, "User not found");
			return;
		}

		const latNum = lat !== undefined && lat !== "" ? Number(lat) : 0;
		const lngNum = lng !== undefined && lng !== "" ? Number(lng) : 0;
		// Only build a GeoJSON point when we have meaningful coordinates;
		// (0, 0) is in the ocean and would pollute nearby queries.
		const hasCoords = latNum !== 0 && lngNum !== 0;

		const photo = await Photo.create({
			userId: user._id,
			imageUrl: `/tmp/${req.file.filename}`,
			color,
			taskType,
			missionId: missionId || undefined,
			pointsAwarded: points,
			location,
			lat: latNum,
			lng: lngNum,
			geo: hasCoords
				? { type: "Point", coordinates: [lngNum, latNum] }
				: undefined,
			caption: caption?.trim().slice(0, 500) ?? "",
			username: user.username,
			avatarUrl: user.avatarUrl,
		});

		user.points += points;
		user.photosUploaded += 1;
		if (taskType === "solo" || taskType === "team") {
			user.missionsCompleted += 1;
		}
		await user.save();

		ok(res, photo);
	} catch (err) {
		console.error("Upload failed:", err);
		res.status(500).json({ errno: 500, errmsg: "Upload failed" });
	}
}

// GET /api/photos
export async function getPhotos(req: Request, res: Response): Promise<void> {
	try {
		const { color, username } = req.query as {
			color?: string;
			username?: string;
		};
		const filter: Record<string, string> = {};
		if (color) filter.color = color;
		if (username) filter.username = username;

		const photos = await Photo.find(filter).sort({ createdAt: -1 });
		ok(res, photos);
	} catch (err) {
		console.error("Failed to fetch photos:", err);
		res.status(500).json({ errno: 500, errmsg: "Failed to fetch photos" });
	}
}

// GET /api/photos/nearby?lat=&lng=&radius=  (radius in meters; default 5000)
// Uses the 2dsphere index on `geo` for an efficient $nearSphere query —
// results come back sorted by distance to the query point.
export async function getNearbyPhotos(req: Request, res: Response): Promise<void> {
	try {
		const { lat, lng, radius } = req.query as {
			lat?: string;
			lng?: string;
			radius?: string;
		};

		const latNum = Number(lat);
		const lngNum = Number(lng);
		if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
			fail(res, ErrCode.INVALID_PARAM, "lat and lng are required");
			return;
		}

		const radiusMeters = Math.min(50_000, Math.max(1, Number(radius) || 5000));

		const photos = await Photo.find({
			geo: {
				$nearSphere: {
					$geometry: { type: "Point", coordinates: [lngNum, latNum] },
					$maxDistance: radiusMeters,
				},
			},
		});

		ok(res, photos);
	} catch (err) {
		console.error("Failed to fetch nearby photos:", err);
		res.status(500).json({ errno: 500, errmsg: "Failed to fetch nearby photos" });
	}
}

// GET /api/photos/:id
export async function getPhotoById(req: Request, res: Response): Promise<void> {
	try {
		const photo = await Photo.findById(req.params.id);
		if (!photo) {
			fail(res, ErrCode.NOT_FOUND, "Photo not found");
			return;
		}
		ok(res, photo);
	} catch (err) {
		console.error("Failed to fetch photo:", err);
		res.status(500).json({ errno: 500, errmsg: "Failed to fetch photo" });
	}
}

// DELETE /api/photos/:id  (auth-gated; only the owner may delete)
export async function deletePhoto(req: Request, res: Response): Promise<void> {
	try {
		const userId = req.userId;
		if (!userId) {
			fail(res, ErrCode.AUTH_FAILED, "Authentication required");
			return;
		}

		const photo = await Photo.findById(req.params.id);
		if (!photo) {
			fail(res, ErrCode.NOT_FOUND, "Photo not found");
			return;
		}

		if (String(photo.userId) !== userId) {
			fail(res, ErrCode.AUTH_FAILED, "You can only delete your own photos");
			return;
		}

		// Best-effort file cleanup on disk. We log but don't fail the request if
		// the file is already missing — the DB row is the source of truth.
		if (photo.imageUrl.startsWith("/tmp/")) {
			const filename = photo.imageUrl.replace(/^\/tmp\//, "");
			const filePath = path.join(__dirname, "..", "..", "tmp", filename);
			fs.unlink(filePath).catch((err) => {
				if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
					console.warn("Failed to remove tmp file:", filePath, err);
				}
			});
		}

		// Reverse the counter increments from upload.
		const user = await User.findById(userId);
		if (user) {
			user.points = Math.max(0, user.points - photo.pointsAwarded);
			user.photosUploaded = Math.max(0, user.photosUploaded - 1);
			if (photo.taskType === "solo" || photo.taskType === "team") {
				user.missionsCompleted = Math.max(0, user.missionsCompleted - 1);
			}
			await user.save();
		}

		await photo.deleteOne();
		// Clean up dangling likes / comments / bookmarks for the deleted photo.
		await Like.deleteMany({ photoId: photo._id });
		await Comment.deleteMany({ photoId: photo._id });
		await Bookmark.deleteMany({ photoId: photo._id });

		ok(res, { id: req.params.id });
	} catch (err) {
		console.error("Delete failed:", err);
		res.status(500).json({ errno: 500, errmsg: "Delete failed" });
	}
}
