import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';

// GET - Search tasks by company name
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';

        if (query.length < 2) {
            return NextResponse.json({ tasks: [] }, { status: 200 });
        }

        const tasks = await Task.find({
            userId: (session.user as any).id,
            companyName: { $regex: query, $options: 'i' }
        })
            .sort({ date: -1 })
            .limit(20);

        return NextResponse.json({ tasks }, { status: 200 });
    } catch (error) {
        console.error('Search tasks error:', error);
        return NextResponse.json({ error: 'Arama yapılırken hata oluştu' }, { status: 500 });
    }
}
