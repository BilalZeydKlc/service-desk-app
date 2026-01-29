import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';

// PUT - Update a task
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 });
        }

        const { id } = await params;
        const { date, companyName, description, isCompleted } = await request.json();

        await dbConnect();

        const task = await Task.findOneAndUpdate(
            { _id: id, userId: (session.user as any).id },
            {
                date: date ? new Date(date) : undefined,
                companyName: companyName?.trim(),
                description: description?.trim(),
                isCompleted,
            },
            { new: true, runValidators: true }
        );

        if (!task) {
            return NextResponse.json({ error: 'Görev bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ task, message: 'Görev güncellendi' }, { status: 200 });
    } catch (error) {
        console.error('Update task error:', error);
        return NextResponse.json({ error: 'Görev güncellenirken hata oluştu' }, { status: 500 });
    }
}

// DELETE - Delete a task
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 });
        }

        const { id } = await params;

        await dbConnect();

        const task = await Task.findOneAndDelete({
            _id: id,
            userId: (session.user as any).id,
        });

        if (!task) {
            return NextResponse.json({ error: 'Görev bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Görev silindi' }, { status: 200 });
    } catch (error) {
        console.error('Delete task error:', error);
        return NextResponse.json({ error: 'Görev silinirken hata oluştu' }, { status: 500 });
    }
}
