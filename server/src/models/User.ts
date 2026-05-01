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
  },
  { timestamps: true },
);

export default mongoose.model<IUser>('User', userSchema);
