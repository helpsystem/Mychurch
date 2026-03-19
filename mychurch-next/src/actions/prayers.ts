"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface PrayerRequest {
    id: string;
    user_id: string;
    user_name: string;
    email: string;
    title: string;
    content: string;
    is_public: boolean;
    status: 'pending' | 'active' | 'answered';
    prayed_count: number;
    answer_text: string | null;
    created_at: Date;
}

export async function initializePrayersDB() {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS prayer_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id VARCHAR(255),
                user_name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                is_public BOOLEAN DEFAULT true,
                status VARCHAR(50) DEFAULT 'pending',
                prayed_count INTEGER DEFAULT 0,
                answer_text TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS prayer_interactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                prayer_id UUID REFERENCES prayer_requests(id) ON DELETE CASCADE,
                user_identifier VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(prayer_id, user_identifier)
            );
        `);
        console.log('[Action] Prayer Requests DB initialized');
    } catch (e) {
        console.error('[Action] Error initializing Prayers DB', e);
    }
}

// Fallback
let mockPrayers: PrayerRequest[] = [];

export async function getPrayers(filter: 'all' | 'public' | 'answered' = 'all'): Promise<PrayerRequest[]> {
    try {
        await initializePrayersDB();
        
        let q = "SELECT * FROM prayer_requests ORDER BY created_at DESC";
        if (filter === 'public') {
            q = "SELECT * FROM prayer_requests WHERE is_public = true AND status != 'pending' ORDER BY created_at DESC";
        } else if (filter === 'answered') {
            q = "SELECT * FROM prayer_requests WHERE status = 'answered' ORDER BY created_at DESC";
        }

        const { rows } = await query(q);
        return rows.map(r => ({ ...r, created_at: new Date(r.created_at) }));
    } catch (e) {
        console.error('Database reachable, using prayer fallback.', e);
        if (filter === 'public') return mockPrayers.filter(p => p.is_public && p.status !== 'pending');
        if (filter === 'answered') return mockPrayers.filter(p => p.status === 'answered');
        return [...mockPrayers];
    }
}

export async function createPrayer(data: Partial<PrayerRequest>): Promise<{ success: boolean }> {
    try {
        await query(
            `INSERT INTO prayer_requests (user_id, user_name, email, title, content, is_public, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [data.user_id, data.user_name, data.email, data.title, data.content, data.is_public, data.status || 'pending']
        );
        revalidatePath('/prayers');
        revalidatePath('/admin/prayers');
        return { success: true };
    } catch (e) {
        console.error('Error creating prayer', e);
        mockPrayers.unshift({
            id: crypto.randomUUID(),
            user_id: data.user_id || 'guest',
            user_name: data.user_name || 'Guest',
            email: data.email || '',
            title: data.title || '',
            content: data.content || '',
            is_public: data.is_public ?? true,
            status: data.status || 'pending',
            prayed_count: 0,
            answer_text: null,
            created_at: new Date()
        });
        return { success: true };
    }
}

export async function incrementPrayerCount(prayerId: string, userIdentifier: string): Promise<{ success: boolean; error?: string }> {
    try {
        // This will throw if the UNIQUE constraint (prayer_id, user_identifier) is violated
        await query(`INSERT INTO prayer_interactions (prayer_id, user_identifier) VALUES ($1, $2)`, [prayerId, userIdentifier]);
        await query(`UPDATE prayer_requests SET prayed_count = prayed_count + 1 WHERE id = $1`, [prayerId]);
        revalidatePath('/prayers');
        return { success: true };
    } catch (e: any) {
        if (e.code === '23505') {
            return { success: false, error: 'You have already prayed for this.' };
        }
        
        // Mock fallback
        const prayer = mockPrayers.find(p => p.id === prayerId);
        if (prayer) {
            prayer.prayed_count++;
            return { success: true };
        }
        return { success: false, error: 'Database error' };
    }
}
