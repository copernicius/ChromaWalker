import mongoose, { Schema, Document, Types } from 'mongoose';

export type TeamMissionStatus =
  | 'open'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface ITeamMember {
  userId: Types.ObjectId;
  username: string; // denormalized for fast reads
  avatarUrl: string;
  joinedAt: Date;
  contribution: number; // # of qualifying photos this member has uploaded
}

export interface ITeamMission extends Document {
  createdBy: Types.ObjectId;
  title: string;
  description: string;
  color: string; // palette id or 'rainbow'
  target: number;
  reward: number; // total points pool — split equally on completion
  minSize: number; // auto-starts when members reaches this
  maxSize: number;
  status: TeamMissionStatus;
  members: ITeamMember[];
  currentProgress: number;
  location?: string;
  lat?: number;
  lng?: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new Schema<ITeamMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    joinedAt: { type: Date, default: Date.now },
    contribution: { type: Number, default: 0 },
  },
  { _id: false },
);

const teamMissionSchema = new Schema<ITeamMission>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String, default: '', maxlength: 500 },
    color: { type: String, required: true },
    target: { type: Number, required: true, min: 1, max: 50 },
    reward: { type: Number, required: true, min: 0, max: 1000 },
    minSize: { type: Number, default: 2, min: 2, max: 10 },
    maxSize: { type: Number, default: 5, min: 2, max: 10 },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'completed', 'cancelled'],
      default: 'open',
      index: true,
    },
    members: { type: [memberSchema], default: [] },
    currentProgress: { type: Number, default: 0 },
    location: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    startedAt: { type: Date },
    completedAt: { type: Date },
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
        // Denormalize the creator's username from the members array so the
        // client can show creator-only controls (e.g. Disband) without a
        // separate User lookup. Creator is always a member (added on create).
        if (Array.isArray(ret.members)) {
          const creator = (ret.members as Array<{ userId: unknown; username: string }>).find(
            (m) => String(m.userId) === String(ret.createdBy),
          );
          ret.creatorUsername = creator?.username ?? '';
        }
      },
    },
  },
);

// Members are queried by userId (for "my teams"); index makes it cheap.
teamMissionSchema.index({ 'members.userId': 1 });

export default mongoose.model<ITeamMission>('TeamMission', teamMissionSchema);
