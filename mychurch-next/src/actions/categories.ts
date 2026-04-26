"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { hasAdminRoleOrPermission } from "@/lib/access-control";

export interface Category {
    id: number;
    title: string;
    type: "SERMON" | "GALLERY" | "NEWS";
    item_count: number;
}

async function canManageCategories(): Promise<boolean> {
    return hasAdminRoleOrPermission(["canManageWidgets"]);
}

export async function getCategories(): Promise<Category[]> {
    if (!(await canManageCategories())) {
        return [];
    }

    try {
        const { rows } = await query('SELECT * FROM categories ORDER BY id ASC');
        return rows as Category[];
    } catch (error) {
        console.error('[Action] Error fetching categories:', error);
        // Fallback mock data when DB is down
        return [
            { id: 1, title: "آموزش‌های کتاب‌مقدس", type: "SERMON", item_count: 108 },
            { id: 2, title: "مراسم‌های ویژه", type: "GALLERY", item_count: 12 },
            { id: 3, title: "موعظه‌های یکشنبه", type: "SERMON", item_count: 45 },
        ];
    }
}

export async function deleteCategory(id: number): Promise<{ success: boolean; error?: string }> {
    if (!(await canManageCategories())) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await query('DELETE FROM categories WHERE id = $1', [id]);
        revalidatePath('/admin/categories');
        return { success: true };
    } catch (error) {
        console.error('[Action] Error deleting category:', error);
        return { success: false, error: 'Failed to delete category' };
    }
}

export async function upsertCategory(cat: Omit<Category, 'id' | 'item_count'> & { id?: number }): Promise<{ success: boolean; error?: string }> {
    if (!(await canManageCategories())) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        if (cat.id) {
            await query(
                'UPDATE categories SET title = $1, type = $2 WHERE id = $3',
                [cat.title, cat.type, cat.id]
            );
        } else {
            await query(
                'INSERT INTO categories (title, type, item_count) VALUES ($1, $2, 0)',
                [cat.title, cat.type]
            );
        }
        revalidatePath('/admin/categories');
        return { success: true };
    } catch (error) {
        console.error('[Action] Error upserting category:', error);
        return { success: false, error: 'Failed to save category' };
    }
}
