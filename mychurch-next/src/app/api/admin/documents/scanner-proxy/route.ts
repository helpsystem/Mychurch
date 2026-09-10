import { NextRequest, NextResponse } from "next/server";
import { getAccessContext } from "@/lib/access-control";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Normalizes scanner IP or host to a full URL
 */
function normalizeScannerUrl(inputUrl: string): string {
    let clean = inputUrl.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = `http://${clean}`;
    }
    return clean.replace(/\/+$/, '');
}

/**
 * Hardware Scanner Proxy for eSCL (Apple AirPrint / Mopria WebScan) protocols
 * Allows church computers to connect directly to Canon, HP, Epson, Brother, Fujitsu network scanners
 */
export async function POST(req: NextRequest) {
    try {
        const context = await getAccessContext();
        const isAdmin = context.role === 'Admin';
        const hasAccess = isAdmin || context.permissions?.canManageDocuments === true;

        if (!hasAccess) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        const body = await req.json();
        const { action, scannerHost, resolution = 300, colorMode = 'RGB24', inputSource = 'Platen' } = body;

        if (!scannerHost) {
            return NextResponse.json({ error: "آدرس IP یا نام میزبان اسکنر مشخص نشده است." }, { status: 400 });
        }

        const baseUrl = normalizeScannerUrl(scannerHost);

        // 1. ACTION: PING & CAPABILITIES CHECK
        if (action === 'ping' || action === 'capabilities') {
            console.log(`[ScannerProxy] Probing scanner at ${baseUrl}...`);
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 6000);

            try {
                // Try standard eSCL ScannerCapabilities endpoint
                const res = await fetch(`${baseUrl}/eSCL/ScannerCapabilities`, {
                    method: 'GET',
                    signal: controller.signal,
                    headers: { 'Accept': 'text/xml, application/xml, */*' }
                });

                clearTimeout(timeout);

                if (res.ok) {
                    const xmlText = await res.text();
                    const supportsColor = xmlText.includes('RGB24') || xmlText.includes('Color');
                    const supportsGray = xmlText.includes('Grayscale') || xmlText.includes('Grayscale8');
                    const supportsBw = xmlText.includes('BlackAndWhite1') || xmlText.includes('Binary');

                    return NextResponse.json({
                        success: true,
                        online: true,
                        protocol: 'eSCL',
                        statusCode: res.status,
                        capabilities: {
                            colorModes: [
                                ...(supportsColor ? ['RGB24'] : []),
                                ...(supportsGray ? ['Grayscale8'] : []),
                                ...(supportsBw ? ['BlackAndWhite1'] : [])
                            ],
                            resolutions: [150, 300, 600],
                            inputSources: ['Platen', 'ADF']
                        },
                        message: "اسکنر سخت‌افزاری با پروتکل eSCL متصل و آماده است."
                    });
                } else {
                    return NextResponse.json({
                        success: true,
                        online: true,
                        protocol: 'HTTP',
                        statusCode: res.status,
                        message: `دستگاه با کد وضعیت ${res.status} پاسخ داد اما مسیر eSCL یافت نشد.`
                    });
                }
            } catch (netErr: any) {
                clearTimeout(timeout);
                console.warn('[ScannerProxy] Ping failed:', netErr.message);
                return NextResponse.json({
                    success: false,
                    online: false,
                    error: `امکان برقراری ارتباط با ${baseUrl} وجود ندارد. لطفا مطمئن شوید اسکنر روشن و در شبکه محلی قرار دارد.`
                });
            }
        }

        // 2. ACTION: EXECUTE SCAN JOB
        if (action === 'scan') {
            console.log(`[ScannerProxy] Triggering eSCL scan job on ${baseUrl} [DPI: ${resolution}, Mode: ${colorMode}]...`);

            // Standard eSCL ScanSettings XML
            const scanXml = `<?xml version="1.0" encoding="UTF-8"?>
<scan:ScanSettings xmlns:scan="http://schemas.hp.com/imaging/escl/2011/05/03" xmlns:pwg="http://www.pwg.org/schemas/2010/12/sm">
    <pwg:Version>2.6</pwg:Version>
    <scan:Intent>Document</scan:Intent>
    <scan:InputSource>${inputSource}</scan:InputSource>
    <scan:ColorMode>${colorMode}</scan:ColorMode>
    <scan:XResolution>${resolution}</scan:XResolution>
    <scan:YResolution>${resolution}</scan:YResolution>
    <pwg:DocumentFormat>image/jpeg</pwg:DocumentFormat>
</scan:ScanSettings>`;

            const jobController = new AbortController();
            const jobTimeout = setTimeout(() => jobController.abort(), 25000);

            try {
                const jobRes = await fetch(`${baseUrl}/eSCL/ScanJobs`, {
                    method: 'POST',
                    signal: jobController.signal,
                    headers: {
                        'Content-Type': 'text/xml',
                    },
                    body: scanXml
                });

                clearTimeout(jobTimeout);

                let docUrl = '';
                const locationHeader = jobRes.headers.get('Location') || jobRes.headers.get('location');

                if (locationHeader) {
                    docUrl = locationHeader.startsWith('http') ? locationHeader : `${baseUrl}${locationHeader.startsWith('/') ? '' : '/'}${locationHeader}`;
                    if (!docUrl.endsWith('/NextDocument')) {
                        docUrl += '/NextDocument';
                    }
                } else {
                    docUrl = `${baseUrl}/eSCL/ScanJobs/NextDocument`;
                }

                console.log(`[ScannerProxy] Fetching scanned document from ${docUrl}...`);

                // Download the scanned image binary
                const docController = new AbortController();
                const docTimeout = setTimeout(() => docController.abort(), 45000);

                const docRes = await fetch(docUrl, {
                    method: 'GET',
                    signal: docController.signal
                });

                clearTimeout(docTimeout);

                if (!docRes.ok) {
                    throw new Error(`خطا در بارگیری سند از اسکنر: کد وضعیت ${docRes.status}`);
                }

                const imageBytes = await docRes.arrayBuffer();
                const base64Image = Buffer.from(imageBytes).toString('base64');
                const mimeType = docRes.headers.get('Content-Type') || 'image/jpeg';

                return NextResponse.json({
                    success: true,
                    dataUrl: `data:${mimeType};base64,${base64Image}`,
                    fileSize: imageBytes.byteLength,
                    mimeType
                });
            } catch (scanErr: any) {
                clearTimeout(jobTimeout);
                console.error('[ScannerProxy] Scan failed:', scanErr.message);
                return NextResponse.json({
                    success: false,
                    error: `خطا در اجرای فرآیند اسکن سخت‌افزاری: ${scanErr.message}`
                }, { status: 500 });
            }
        }

        return NextResponse.json({ error: "عملیات نامعتبر" }, { status: 400 });
    } catch (err: any) {
        console.error('[ScannerProxy] General exception:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
