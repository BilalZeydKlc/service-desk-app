import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    createdAt: Date;
}

const UserSchema: Schema<IUser> = new Schema({
    firstName: {
        type: String,
        required: [true, 'Ad alanı zorunludur'],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, 'Soyad alanı zorunludur'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'E-mail alanı zorunludur'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Şifre alanı zorunludur'],
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
