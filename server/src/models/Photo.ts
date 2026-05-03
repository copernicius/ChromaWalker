import mongoose, { Schema, Document, Types } from 'mongoose';

export type TaskType = 'daily' | 'solo' | 'team' | null;

export interface IPhoto extends Document {
  userId: Types.ObjectId;
  imageUrl: string;
  color: string;
  taskType: TaskType;
  missionId?: string;
  pointsAwarded: number;
  location: string;
  lat: number;
  lng: number;
  // GeoJSON Point — paired with a 2dsphere index for $nearSphere queries.
  // Ordered as [lng, lat] per the GeoJSON spec.
  geo?: { type: 'Point'; coordinates: [number, number] };
  caption: string;
  likes: number;
  favorites: number;
  comments: number;
  username: string;
  avatarUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const photoSchema = new Schema<IPhoto>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    imageUrl: { type: String, required: true },
    color: { type: String, required: true, index: true },
    taskType: { type: String, enum: ['daily', 'solo', 'team', null], default: null },
    missionId: { type: String },
    pointsAwarded: { type: Number, default: 0 },
    location: { type: String, default: '' },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    geo: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
    caption: { type: String, default: '', maxlength: 500 },
    likes: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    username: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        if (ret.createdAt) {
          ret.timestamp = ret.createdAt;
          delete ret.createdAt;
        }
        delete ret.updatedAt;
      },
    },
  },
);

// Powers $nearSphere queries (GET /api/photos/nearby).
photoSchema.index({ geo: '2dsphere' });

export default mongoose.model<IPhoto>('Photo', photoSchema);
