import { NextRequest, NextResponse } from "next/server";
import { getAccessContext } from "@/lib/access-control";
import { processDocumentOCR } from "@/services/ocrService";

export const maxDuration = 60; // Allow sufficient time for high-res OCR
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const context = await getAccessContext();
        const isAdmin = context.role === 'Admin';
        const hasAccess = isAdmin || context.permissions?.canManageDocuments === true || context.permissions?.canManageDocumentRequests === true;

        if (!hasAccess) {
            return NextResponse.json({ error: "Unauthorized. Admin or Document Manager access required." }, { status: 401 });
        }

        const contentType = req.headers.get("content-type") || "";

        let imageBuffer: Buffer | null = null;

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            const file = formData.get("file") as File | null;
            if (!file) {
                return NextResponse.json({ error: "فایل تصویری ارسال نشده است." }, { status: 400 });
            }
            const bytes = await file.arrayBuffer();
            imageBuffer = Buffer.from(bytes);
        } else if (contentType.includes("application/json")) {
            const body = await req.json();
            const base64Data = body.imageBase64 || body.image;
            if (!base64Data) {
                return NextResponse.json({ error: "داده تصویر ارسال نشده است." }, { status: 400 });
            }
            const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
            imageBuffer = Buffer.from(cleanBase64, 'base64');
        } else {
            return NextResponse.json({ error: "فرمت نامعتبر درخواست" }, { status: 400 });
        }

        if (!imageBuffer) {
            return NextResponse.json({ error: "خطا در بارگیری بافر تصویر" }, { status: 400 });
        }

        console.log('[API OCR] Starting bilingual OCR processing. Image size:', imageBuffer.length, 'bytes');
        const ocrResult = await processDocumentOCR(imageBuffer);

        return NextResponse.json({
            success: true,
            ...ocrResult
        });
    } catch (err: any) {
        console.error('[API OCR] Exception during OCR:', err);
        return NextResponse.json({
            success: false,
            error: err.message || "خطا در اجرای OCR"
        }, { status: 500 });
    }
}
