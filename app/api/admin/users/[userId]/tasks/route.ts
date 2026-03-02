import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';

// GET - Admin: belirli bir kullanıcının görevlerini getir
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 });
        }

        // Admin kontrolü
        if ((session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const { userId } = await params;

        await dbConnect();

        const tasks = await Task.find({ userId }).sort({ date: -1 });

        // Firma bazlı gruplama
        const companiesMap: { [key: string]: number } = {};
        tasks.forEach(task => {
            companiesMap[task.companyName] = (companiesMap[task.companyName] || 0) + 1;
        });

        const companies = Object.entries(companiesMap).map(([name, count]) => ({
            companyName: name,
            visitCount: count,
        })).sort((a, b) => a.companyName.localeCompare(b.companyName));

        return NextResponse.json({
            tasks,
            companies,
            totalTasks: tasks.length,
            totalCompanies: companies.length,
        }, { status: 200 });
    } catch (error) {
        console.error('Admin get user tasks error:', error);
        return NextResponse.json({ error: 'Görevler yüklenirken hata oluştu' }, { status: 500 });
    }
}
