import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';

// GET - Get company statistics (unique companies with visit counts)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 });
        }

        await dbConnect();

        const companies = await Task.aggregate([
            { $match: { userId: (session.user as any).id } },
            {
                $group: {
                    _id: '$companyName',
                    visitCount: { $sum: 1 },
                    lastVisit: { $max: '$date' }
                }
            },
            { $sort: { _id: 1 } } // Alphabetical order
        ]);

        const result = companies.map(c => ({
            companyName: c._id,
            visitCount: c.visitCount,
            lastVisit: c.lastVisit
        }));

        return NextResponse.json({
            companies: result,
            totalCompanies: result.length
        }, { status: 200 });
    } catch (error) {
        console.error('Get companies error:', error);
        return NextResponse.json({ error: 'Firma bilgileri yüklenirken hata oluştu' }, { status: 500 });
    }
}
