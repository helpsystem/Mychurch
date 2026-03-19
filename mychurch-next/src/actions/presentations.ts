"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { BroadcastSession } from "@/types/broadcast";

// Fallback in-memory storage for offline testing
let mockPresentations: BroadcastSession[] = [];

export async function getPresentations(): Promise<BroadcastSession[]> {
    try {
        // Ensure table exists on first run
        await query(`
            CREATE TABLE IF NOT EXISTS presentations (
                id VARCHAR(255) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                date TIMESTAMP WITH TIME ZONE NOT NULL,
                host_name VARCHAR(255),
                slides_json JSONB NOT NULL DEFAULT '[]',
                status VARCHAR(50) NOT NULL DEFAULT 'draft',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        const { rows } = await query('SELECT * FROM presentations ORDER BY date DESC, created_at DESC');
        
        return rows.map(row => ({
            id: row.id,
            title: row.title,
            date: new Date(row.date),
            hostName: row.host_name,
            slides: row.slides_json,
            status: row.status as any,
        }));
    } catch (error) {
        console.error('[Action] Database unreachable, falling back to mock presentations.');
        return [...mockPresentations].sort((a, b) => b.date.getTime() - a.date.getTime());
    }
}

export async function getPresentationById(id: string): Promise<BroadcastSession | null> {
    try {
        const { rows } = await query('SELECT * FROM presentations WHERE id = $1', [id]);
        if (rows.length === 0) return null;
        
        const row = rows[0];
        return {
            id: row.id,
            title: row.title,
            date: new Date(row.date),
            hostName: row.host_name,
            slides: row.slides_json,
            status: row.status as any,
        };
    } catch (error) {
        console.error('[Action] Database unreachable, fallback to mock fetch.');
        return mockPresentations.find(p => p.id === id) || null;
    }
}

export async function savePresentation(session: BroadcastSession): Promise<{ success: boolean; error?: string }> {
    try {
        await query(`
            INSERT INTO presentations (id, title, date, host_name, slides_json, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (id) DO UPDATE 
            SET title = EXCLUDED.title,
                date = EXCLUDED.date,
                host_name = EXCLUDED.host_name,
                slides_json = EXCLUDED.slides_json,
                status = EXCLUDED.status;
        `, [
            session.id, 
            session.title, 
            session.date.toISOString(), 
            session.hostName || null, 
            JSON.stringify(session.slides), 
            session.status
        ]);
        
        revalidatePath('/admin/presentations');
        revalidatePath('/broadcast');
        
        // Also save to mock array
        const index = mockPresentations.findIndex(p => p.id === session.id);
        if (index > -1) mockPresentations[index] = session;
        else mockPresentations.push(session);

        return { success: true };
    } catch (error) {
        console.error('[Action] Database unreachable, saved to mock memory.');
        const index = mockPresentations.findIndex(p => p.id === session.id);
        if (index > -1) mockPresentations[index] = session;
        else mockPresentations.push(session);
        return { success: true };
    }
}

export async function deletePresentation(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await query('DELETE FROM presentations WHERE id = $1', [id]);
        revalidatePath('/admin/presentations');
        mockPresentations = mockPresentations.filter(p => p.id !== id);
        return { success: true };
    } catch (error) {
        console.error('[Action] Database unreachable, deleted from mock memory.');
        mockPresentations = mockPresentations.filter(p => p.id !== id);
        return { success: true };
    }
}
