import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITask extends Document {
    userId: mongoose.Types.ObjectId;
    date: Date;
    companyName: string;
    description: string;
    isCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema: Schema<ITask> = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        required: [true, 'Tarih alanı zorunludur'],
    },
    companyName: {
        type: String,
        required: [true, 'Firma adı zorunludur'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'İş açıklaması zorunludur'],
        trim: true,
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Index for efficient queries by user and date
TaskSchema.index({ userId: 1, date: 1 });

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default Task;
