import React from 'react';
import { listMediaFiles } from '@/actions/media';
import MediaClient from './MediaClient';

export const metadata = {
    title: 'Media Library | Admin',
};

export default async function MediaAdminPage() {
    const initialFiles = await listMediaFiles();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-[Vazirmatn] text-white">کتابخانه مدیا (Media Library)</h1>
            </div>

            <MediaClient initialFiles={initialFiles} />
        </div>
    );
}
