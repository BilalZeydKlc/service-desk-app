import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';

// GET - Fetch tasks for a user (with optional date filter)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');
        const year = searchParams.get('year');

        let query: any = { userId: (session.user as any).id };

        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const tasks = await Task.find(query).sort({ date: 1 });

        return NextResponse.json({ tasks }, { status: 200 });
    } catch (error) {
        console.error('Get tasks error:', error);
        return NextResponse.json({ error: 'Görevler yüklenirken hata oluştu' }, { status: 500 });
    }
}

// POST - Create a new task
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 });
        }

        const { date, companyName, description, isCompleted } = await request.json();

        if (!date || !companyName || !description) {
            return NextResponse.json({ error: 'Tüm alanlar zorunludur' }, { status: 400 });
        }

        await dbConnect();

        const task = await Task.create({
            userId: (session.user as any).id,
            date: new Date(date),
            companyName: companyName.trim(),
            description: description.trim(),
            isCompleted: isCompleted || false,
        });

        return NextResponse.json({ task, message: 'Görev oluşturuldu' }, { status: 201 });
    } catch (error) {
        console.error('Create task error:', error);
        return NextResponse.json({ error: 'Görev oluşturulurken hata oluştu' }, { status: 500 });
    }
}
