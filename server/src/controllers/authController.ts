import fs from "node:fs/promises";
import path from "node:path";
import type { Request, Response } from "express";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import mongoose from "mongoose";
import { ErrCode, fail, ok } from "../lib/response";
import { signToken } from "../middleware/auth";
import Photo from "../models/Photo";
import User from "../models/User";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// POST /api/auth/google
export async function googleLogin(req: Request, res: Response): Promise<void> {
	try {
		const { credential } = req.body as { credential?: string };
		if (!credential) {
			fail(res, ErrCode.MISSING_PARAM, "Missing credential");
			return;
		}

		let payload: TokenPayload | undefined;
		try {
			const ticket = await client.verifyIdToken({
				idToken: credential,
				audience: GOOGLE_CLIENT_ID,
			});
			payload = ticket.getPayload();
		} catch {
			fail(res, ErrCode.AUTH_FAILED, "Invalid Google token");
			return;
		}

		if (!payload) {
			fail(res, ErrCode.AUTH_FAILED, "Invalid Google token");
			return;
		}

		const { sub: googleId, email, name, picture } = payload;

		let user = await User.findOne({ googleId });
		if (!user) {
			user = await User.create({
				googleId,
				email,
				username: name,
				avatarUrl: picture || "",
			});
		}

		const token = signToken(String(user._id));

		ok(res, {
			user: {
				_id: user._id,
				googleId: user.googleId,
				email: user.email,
				username: user.username,
				avatarUrl: user.avatarUrl,
				level: user.level,
				points: user.points,
				nextLevelPoints: user.nextLevelPoints,
				photosUploaded: user.photosUploaded,
				missionsCompleted: user.missionsCompleted,
			},
			token,
		});
	} catch (err) {
		console.error("Google login failed:", err);
		res.status(500).json({ errno: 500, errmsg: "Login failed" });
	}
}

// GET /api/auth/me
export async function getMe(req: Request, res: Response): Promise<void> {
	try {
		const user = await User.findById(req.userId).select("-__v");
		if (!user) {
			fail(res, ErrCode.NOT_FOUND, "User not found");
			return;
		}
		ok(res, user);
	} catch (err) {
		console.error("Failed to get user:", err);
		res.status(500).json({ errno: 500, errmsg: "Failed to get user" });
	}
}

// PATCH /api/auth/me  (auth-gated; multipart/form-data)
// Accepts optional `username` (text) and optional `avatar` (file). Cascades
// the new username/avatarUrl onto the user's existing photos so the gallery
// stays consistent.
export async function updateMe(req: Request, res: Response): Promise<void> {
	try {
		const userId = req.userId;
		if (!userId) {
			fail(res, ErrCode.AUTH_FAILED, "Authentication required");
			return;
		}

		const user = await User.findById(userId);
		if (!user) {
			fail(res, ErrCode.NOT_FOUND, "User not found");
			return;
		}

		const { username } = req.body as { username?: string };
		let changed = false;

		if (username !== undefined) {
			const trimmed = username.trim();
			if (trimmed.length === 0 || trimmed.length > 50) {
				fail(res, ErrCode.INVALID_PARAM, "Username must be 1–50 characters");
				return;
			}
			if (trimmed !== user.username) {
				user.username = trimmed;
				changed = true;
			}
		}

		if (req.file) {
			// Best-effort: delete the previous avatar file if it lives in our tmp
			// directory. Google CDN URLs are left alone.
			if (user.avatarUrl?.startsWith("/tmp/")) {
				const oldName = user.avatarUrl.replace(/^\/tmp\//, "");
				const oldPath = path.join(__dirname, "..", "..", "tmp", oldName);
				fs.unlink(oldPath).catch(() => {});
			}
			user.avatarUrl = `/tmp/${req.file.filename}`;
			changed = true;
		}

		if (changed) {
			await user.save();
			await Photo.updateMany(
				{ userId: user._id },
				{ $set: { username: user.username, avatarUrl: user.avatarUrl } },
			);
		}

		ok(res, {
			_id: user._id,
			googleId: user.googleId,
			email: user.email,
			username: user.username,
			avatarUrl: user.avatarUrl,
			level: user.level,
			points: user.points,
			nextLevelPoints: user.nextLevelPoints,
			photosUploaded: user.photosUploaded,
			missionsCompleted: user.missionsCompleted,
		});
	} catch (err) {
		console.error("Update profile failed:", err);
		res.status(500).json({ errno: 500, errmsg: "Update failed" });
	}
}

// GET /api/auth/me/unlocked-colors  (auth-gated)
// Returns the distinct color ids the user has ever uploaded — drives the
// "Unlocked colors" achievements grid on the profile.
export async function getMyUnlockedColors(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		const userId = req.userId;
		if (!userId) {
			fail(res, ErrCode.AUTH_FAILED, "Authentication required");
			return;
		}
		const colors = await Photo.distinct("color", {
			userId: new mongoose.Types.ObjectId(userId),
		});
		ok(res, colors);
	} catch (err) {
		console.error("Failed to fetch unlocked colors:", err);
		res
			.status(500)
			.json({ errno: 500, errmsg: "Failed to fetch unlocked colors" });
	}
}
