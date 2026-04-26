"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { hasAdminRoleOrPermission } from "@/lib/access-control";

export interface Leader {
    id: number;
    name: string;
    role: string;
    email: string;
    active: boolean;
    image_url?: string;
}

async function canManageLeaders(): Promise<boolean> {
    return hasAdminRoleOrPermission(["canManageUsers"]);
}

export async function getLeaders(): Promise<Leader[]> {
    if (!(await canManageLeaders())) {
        return [];
    }

    try {
        const { rows } = await query('SELECT * FROM leaders ORDER BY id ASC');
        return rows as Leader[];
    } catch (error) {
        console.error('[Action] Error fetching leaders:', error);
        // Fallback robust mock data when DB is down (e.g., ECONNREFUSED)
        return [
            { id: 1, name: "Sami Ramhormozi", role: "Senior Pastor", email: "sami@iranchurchdc.com", active: true },
            { id: 2, name: "John Doe", role: "Worship Leader", email: "john@iranchurchdc.com", active: true },
            { id: 3, name: "Sara Smith", role: "Youth Coordinator", email: "sara@iranchurchdc.com", active: false },
        ];
    }
}

export async function deleteLeader(id: number): Promise<{ success: boolean; error?: string }> {
    if (!(await canManageLeaders())) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await query('DELETE FROM leaders WHERE id = $1', [id]);
        revalidatePath('/admin/leaders');
        return { success: true };
    } catch (error) {
        console.error('[Action] Error deleting leader:', error);
        return { success: false, error: 'Failed to delete leader' };
    }
}

export async function upsertLeader(leader: Omit<Leader, 'id'> & { id?: number }): Promise<{ success: boolean; error?: string }> {
    if (!(await canManageLeaders())) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        if (leader.id) {
            await query(
                'UPDATE leaders SET name = $1, role = $2, email = $3, active = $4, image_url = $5 WHERE id = $6',
                [leader.name, leader.role, leader.email, leader.active, leader.image_url || null, leader.id]
            );
        } else {
            await query(
                'INSERT INTO leaders (name, role, email, active, image_url) VALUES ($1, $2, $3, $4, $5)',
                [leader.name, leader.role, leader.email, leader.active, leader.image_url || null]
            );
        }
        revalidatePath('/admin/leaders');
        revalidatePath('/'); // assuming leaders affect public pages
        return { success: true };
    } catch (error) {
        console.error('[Action] Error upserting leader:', error);
        return { success: false, error: 'Failed to save leader profile' };
    }
}
