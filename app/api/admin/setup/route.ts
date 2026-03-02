import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// POST - Mevcut kullanıcıyı admin yap (sadece ADMIN_EMAIL eşleşmesi ile)
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

        if (!adminEmail) {
            return NextResponse.json({ error: 'ADMIN_EMAIL tanımlanmamış' }, { status: 500 });
        }

        // ADMIN_EMAIL ile eşleşen kullanıcıyı bul ve admin yap
        const result = await User.findOneAndUpdate(
            { email: adminEmail },
            { role: 'admin' },
            { new: true }
        );

        if (!result) {
            return NextResponse.json({
                error: 'Bu e-mail ile kayıtlı kullanıcı bulunamadı',
                adminEmail,
            }, { status: 404 });
        }

        return NextResponse.json({
            message: `${result.firstName} ${result.lastName} başarıyla admin yapıldı`,
            user: {
                id: result._id,
                email: result.email,
                role: result.role,
            },
        }, { status: 200 });
    } catch (error) {
        console.error('Setup admin error:', error);
        return NextResponse.json({ error: 'Admin oluşturulurken hata oluştu' }, { status: 500 });
    }
}
