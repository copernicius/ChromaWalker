import mongoose, { Schema, Document, Types } from 'mongoose';

// Per-team chat message. Visible only to members of the owning team mission
// — see the membership check in teamMissionsController. We denormalize the
// poster's username/avatar at write time so the list endpoint can render
// without a User join, mirroring the pattern used by Comment.

export interface ITeamMessage extends Document {
  teamMissionId: Types.ObjectId;
  userId: Types.ObjectId;
  username: string;
  avatarUrl: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const teamMessageSchema = new Schema<ITeamMessage>(
  {
    teamMissionId: {
      type: Schema.Types.ObjectId,
      ref: 'TeamMission',
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    text: { type: String, required: true, maxlength: 500 },
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

// Newest-first listing per team — descending createdAt with the team filter.
teamMessageSchema.index({ teamMissionId: 1, createdAt: -1 });

export default mongoose.model<ITeamMessage>('TeamMessage', teamMessageSchema);
