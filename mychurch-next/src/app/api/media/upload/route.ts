import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        
        // 1. Verify Authentication & RBAC (Optional but recommended)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        // 2. Generate unique filename preserving extension but sanitizing original name
        const ext = file.name.substring(file.name.lastIndexOf('.'));
        const originalName = file.name.substring(0, file.name.lastIndexOf('.')).replace(/[^a-zA-Z0-9_-]/g, '');
        const filename = `${originalName}-${Date.now()}${ext}`;

        // 3. Upload to Supabase Storage ('media' bucket)
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('media')
            .upload(filename, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw uploadError;
        }

        // 4. Get Public URL
        const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(filename);

        return NextResponse.json({ success: true, url: publicUrlData.publicUrl });
    } catch (error: any) {
        console.error('Error uploading media file:', error);
        return NextResponse.json({ success: false, error: error.message || 'Upload failed' }, { status: 500 });
    }
}
