import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  googleId: string;
  email: string;
  username: string;
  avatarUrl: string;
  level: number;
  points: number;
  nextLevelPoints: number;
  photosUploaded: number;
  missionsCompleted: number;
  // Permanent record of solo missions the user has finished. Once an id
  // lands here it stays — deleting contribution photos doesn't un-complete
  // the mission and doesn't allow re-rewarding. Daily ids are NOT tracked
  // here (they're date-scoped and re-completion is bounded to ±1 reward).
  completedMissionIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    level: { type: Number, default: 1 },
    points: { type: Number, default: 0 },
    nextLevelPoints: { type: Number, default: 100 },
    photosUploaded: { type: Number, default: 0 },
    missionsCompleted: { type: Number, default: 0 },
    completedMissionIds: { type: [String], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model<IUser>('User', userSchema);
