import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'teacher') {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('examId');
    const groupName = searchParams.get('groupName');

    if (!examId) return new NextResponse('Exam ID required', { status: 400 });

    try {
        const exam = await prisma.exam.findUnique({ where: { id: examId } });
        if (!exam) return new NextResponse('Exam not found', { status: 404 });

        const whereClause: any = { examId, submittedAt: { not: null } };
        if (groupName && groupName !== 'all') {
            whereClause.user = { groupName };
        }

        const attempts = await prisma.examAttempt.findMany({
            where: whereClause,
            include: { user: true },
            orderBy: [{ user: { groupName: 'asc' } }, { user: { name: 'asc' } }]
        });

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'NPUU Platform';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Natijalar');

        sheet.columns = [
            { header: 'Guruh', key: 'groupName', width: 20 },
            { header: 'ISM FAMILIYA', key: 'name', width: 30 },
            { header: 'Student ID', key: 'studentId', width: 20 },
            { header: 'BAHO', key: 'score', width: 10 }
        ];

        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };

        attempts.forEach(a => {
            sheet.addRow({
                groupName: a.user?.groupName || 'Kiritilmagan',
                name: a.user?.name || 'Noma\'lum',
                studentId: a.user?.studentId || '-',
                score: a.score
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="Imtihon_Natijalari_${exam.title.replace(/\s+/g, '_')}.xlsx"`
            }
        });
    } catch (e) {
        console.error('[EXCEL_EXPORT_ERROR]', e);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
