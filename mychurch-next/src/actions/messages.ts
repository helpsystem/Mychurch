"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { hasAdminRoleOrPermission } from "@/lib/access-control";

export type MessageRow = {
    id: string;
    type: "message" | "prayer";
    recipient_leader?: string;
    category?: string;
    name: string;
    email: string;
    subject?: string;
    content: string;
    is_read: boolean;
    created_at: string;
};

async function canManageMessages(): Promise<boolean> {
    return hasAdminRoleOrPermission(["canManageMedia"]);
}

export async function submitMessage(data: Omit<MessageRow, "id" | "is_read" | "created_at">) {
    try {
        const supabase = await createClient();
        const { error } = await supabase.from('messages').insert([data]);

        if (error) {
            console.error("Supabase insert error:", error);
            throw new Error(error.message);
        }

        return { success: true };
    } catch (error: any) {
        console.error("Failed to submit message:", error);
        return { success: false, error: error.message };
    }
}

export async function getMessages(): Promise<MessageRow[]> {
    if (!(await canManageMessages())) {
        return [];
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data as MessageRow[];
    } catch (error) {
        console.error("Failed to fetch messages:", error);
        return [];
    }
}

export async function markMessageRead(id: string, is_read: boolean) {
    if (!(await canManageMessages())) {
        return { success: false };
    }

    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('messages')
            .update({ is_read })
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/messages');
        return { success: true };
    } catch (error) {
        console.error("Failed to mark message read:", error);
        return { success: false };
    }
}

export async function deleteMessage(id: string) {
    if (!(await canManageMessages())) {
        return { success: false };
    }

    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/messages');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete message:", error);
        return { success: false };
    }
}
