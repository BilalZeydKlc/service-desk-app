import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Task from '@/models/Task';

// GET - Admin: tüm kullanıcıları ve istatistiklerini getir
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 });
        }

        // Admin kontrolü
        if ((session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        await dbConnect();

        // Tüm kullanıcıları getir (şifre hariç)
        const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });

        // Her kullanıcı için görev istatistiklerini getir
        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                const totalTasks = await Task.countDocuments({ userId: user._id });
                const completedTasks = await Task.countDocuments({ userId: user._id, isCompleted: true });
                const pendingTasks = totalTasks - completedTasks;

                // Benzersiz firma sayısı
                const uniqueCompanies = await Task.distinct('companyName', { userId: user._id });

                // Son görev
                const lastTask = await Task.findOne({ userId: user._id }).sort({ createdAt: -1 });

                return {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role || 'user',
                    createdAt: user.createdAt,
                    stats: {
                        totalTasks,
                        completedTasks,
                        pendingTasks,
                        totalCompanies: uniqueCompanies.length,
                        lastActivity: lastTask?.createdAt || null,
                    },
                };
            })
        );

        return NextResponse.json({
            users: usersWithStats,
            totalUsers: usersWithStats.length,
        }, { status: 200 });
    } catch (error) {
        console.error('Admin get users error:', error);
        return NextResponse.json({ error: 'Kullanıcılar yüklenirken hata oluştu' }, { status: 500 });
    }
}
