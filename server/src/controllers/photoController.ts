import type { Request, Response } from "express";
import { PALETTE_IDS } from "../lib/palette";
import { ErrCode, fail, ok } from "../lib/response";
import mongoose from "mongoose";
import { evaluateCatalogUpload } from "../lib/missionProgress";
import { findCatalogMission } from "../lib/missions";
import { emitToTeam } from "../lib/realtime";
import { r2DeleteObject, r2PublicUrl } from "../lib/storage";
import { validateContribution } from "../lib/taskValidation";
import Bookmark from "../models/Bookmark";
import Comment from "../models/Comment";
import Like from "../models/Like";
import Photo, { type TaskType } from "../models/Photo";
import TeamMission from "../models/TeamMission";
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

		// Task constraint validation. v1 = color only. Look up the task by
		// missionId across both catalog (daily/solo) and DB (team), then
		// run the shared validator. Free uploads (no missionId) skip this.
		if (missionId) {
			let taskColor: string | null = null;
			if (taskType === "daily" || taskType === "solo") {
				const cfg = findCatalogMission(missionId);
				if (cfg) taskColor = cfg.color;
			} else if (taskType === "team") {
				if (mongoose.isValidObjectId(missionId)) {
					const team = await TeamMission.findById(missionId);
					if (team) taskColor = team.color;
				}
			}

			if (taskColor !== null) {
				const result = validateContribution({ color: taskColor }, color);
				if (!result.ok) {
					fail(
						res,
						ErrCode.INVALID_PARAM,
						`Photo color does not match the task (failed: ${result.failures.join(", ")})`,
					);
					return;
				}
			}
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

		// Compute the *effective* points for this photo and whether it
		// finishes a mission.
		//   • team:        always 0 — pool is split on team completion below.
		//   • solo/daily:  0 per contribution; full reward only on the upload
		//                  that crosses the mission's target.
		//   • free upload: trust client (default 10).
		const isTeamUpload = taskType === "team" && !!missionId;
		const isCatalogUpload =
			(taskType === "solo" || taskType === "daily") && !!missionId;
		let effectivePoints = points;
		let completesCatalogMission = false;

		if (isTeamUpload) {
			effectivePoints = 0;
		} else if (isCatalogUpload) {
			const cfg = findCatalogMission(missionId);
			if (cfg) {
				const existing = await Photo.countDocuments({
					userId: user._id,
					taskType,
					missionId,
				});
				const evalResult = evaluateCatalogUpload(
					user,
					taskType as "solo" | "daily",
					cfg,
					existing,
				);
				effectivePoints = evalResult.pointsAwarded;
				completesCatalogMission = evalResult.completesNow;
			}
		}

		// multer-s3 attaches `key` to req.file. We construct the browser-facing
		// URL from R2_PUBLIC_URL — multer-s3's `location` field points at the
		// management endpoint (private), not the R2.dev / custom domain URL
		// that the browser actually needs.
		const fileWithKey = req.file as Express.Multer.File & { key?: string };
		const objectKey = fileWithKey.key;
		if (!objectKey) {
			fail(res, ErrCode.INVALID_PARAM, "Upload did not return a storage key");
			return;
		}
		const imageUrl = r2PublicUrl(objectKey);

		const photo = await Photo.create({
			userId: user._id,
			imageUrl,
			color,
			taskType,
			missionId: missionId || undefined,
			pointsAwarded: effectivePoints,
			location: location ?? '',
			lat: latNum,
			lng: lngNum,
			geo: hasCoords
				? { type: "Point", coordinates: [lngNum, latNum] }
				: undefined,
			caption: caption?.trim().slice(0, 500) ?? "",
			username: user.username,
			avatarUrl: user.avatarUrl,
		});

		user.points += effectivePoints;
		user.photosUploaded += 1;
		// missionsCompleted now means "missions you actually finished," not
		// "contribution events." Team completion is handled inside the
		// team-progression block below.
		if (completesCatalogMission) {
			user.missionsCompleted += 1;
			// Pin solo completions permanently so a later delete-then-reupload
			// can't unlock the reward again. (missionId is guaranteed truthy
			// inside the completesCatalogMission branch above.)
			if (taskType === "solo" && missionId) {
				if (!user.completedMissionIds) user.completedMissionIds = [];
				user.completedMissionIds.push(missionId);
			}
		}
		await user.save();

		// Team mission progression — only after the photo + user are saved.
		// Skipped silently if the mission doesn't exist, isn't in progress, or
		// the user isn't a member (e.g. stale missionId from the client).
		if (isTeamUpload && mongoose.isValidObjectId(missionId)) {
			const team = await TeamMission.findById(missionId);
			if (team && team.status === "in_progress") {
				const member = team.members.find((m) => String(m.userId) === userId);
				if (member) {
					member.contribution += 1;
					team.currentProgress += 1;

					if (team.currentProgress >= team.target) {
						team.status = "completed";
						team.completedAt = new Date();
						const share = Math.floor(team.reward / team.members.length);
						const memberIds = team.members.map((m) => m.userId);
						// Single $inc per member: bump missionsCompleted (every
						// member finished the mission) and award their share if
						// it's a positive amount.
						const inc: Record<string, number> = { missionsCompleted: 1 };
						if (share > 0) inc.points = share;
						await User.updateMany(
							{ _id: { $in: memberIds } },
							{ $inc: inc },
						);
					}

					await team.save();

					// Broadcast the new state to every connected member of this
					// team — the uploader's own client invalidates locally; this
					// is what keeps everyone else's view from going stale.
					emitToTeam(String(team._id), "team:updated", team.toJSON());
				}
			}
		}

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

		// Best-effort R2 cleanup. We log but don't fail the request — the DB
		// row is the source of truth, and orphans can be swept by an R2
		// lifecycle rule. r2DeleteObject is a no-op for non-R2 URLs (e.g.
		// pre-migration /tmp paths or external CDNs).
		void r2DeleteObject(photo.imageUrl);

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
