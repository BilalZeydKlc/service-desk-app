import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';

// GET - Get all visits for a specific company
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 });
        }

        const { name } = await params;
        const companyName = decodeURIComponent(name);

        await dbConnect();

        const visits = await Task.find({
            userId: (session.user as any).id,
            companyName: companyName
        }).sort({ date: -1 }); // Newest first

        return NextResponse.json({
            companyName,
            visits,
            totalVisits: visits.length
        }, { status: 200 });
    } catch (error) {
        console.error('Get company visits error:', error);
        return NextResponse.json({ error: 'Ziyaret bilgileri yüklenirken hata oluştu' }, { status: 500 });
    }
}
