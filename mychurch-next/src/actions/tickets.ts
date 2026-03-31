"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface SupportTicket {
    id: string;
    user_id: string;
    user_email?: string;
    user_name?: string;
    subject: string;
    status: 'open' | 'pending' | 'closed';
    assigned_leader_id: string | null;
    created_at: Date;
}

export interface TicketMessage {
    id: string;
    ticket_id: string;
    sender_id: string;
    sender_name: string;
    message_body: string;
    created_at: Date;
}

// Ensure the tables exist
export async function initializeTicketsDB() {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS support_tickets (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id VARCHAR(255) NOT NULL,
                user_email VARCHAR(255),
                user_name VARCHAR(255),
                subject VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'open',
                assigned_leader_id VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS support_ticket_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
                sender_id VARCHAR(255) NOT NULL,
                sender_name VARCHAR(255),
                message_body TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('[Action] Support Tickets DB initialized');
    } catch (e) {
        console.error('[Action] Error initializing Tickets DB', e);
    }
}

// Fallback arrays for offline mode
let mockTickets: SupportTicket[] = [];
let mockMessages: TicketMessage[] = [];

export async function getTickets(statusFilter?: string, userEmail?: string): Promise<SupportTicket[]> {
    try {
        await initializeTicketsDB();
        
        let q = 'SELECT * FROM support_tickets';
        const params: any[] = [];
        
        // If userEmail is provided, filter to only that user's tickets
        if (userEmail) {
            q += ' WHERE user_email = $1';
            params.push(userEmail);
            
            if (statusFilter && statusFilter !== 'all') {
                q += ' AND status = $2';
                params.push(statusFilter);
            }
        } else if (statusFilter && statusFilter !== 'all') {
            // Admin view - filter by status
            q += ' WHERE status = $1';
            params.push(statusFilter);
        }
        
        q += ' ORDER BY created_at DESC';
        
        const { rows } = await query(q, params);
        return rows.map(r => ({ ...r, created_at: new Date(r.created_at) }));
    } catch (e) {
        console.error('Database error, using ticket fallback.', e);
        // Return mock tickets filtered by user if provided
        if (userEmail) {
            return mockTickets.filter(t => t.user_email === userEmail);
        }
        if (statusFilter && statusFilter !== 'all') {
            return mockTickets.filter(t => t.status === statusFilter);
        }
        return [...mockTickets];
    }
}

export async function createTicket(data: Partial<SupportTicket>, initialMessage: string): Promise<{ success: boolean; id?: string }> {
    try {
        const { rows } = await query(
            `INSERT INTO support_tickets (user_id, user_email, user_name, subject) VALUES ($1, $2, $3, $4) RETURNING id`,
            [data.user_id, data.user_email, data.user_name, data.subject]
        );
        const ticketId = rows[0].id;

        await query(
            `INSERT INTO support_ticket_messages (ticket_id, sender_id, sender_name, message_body) VALUES ($1, $2, $3, $4)`,
            [ticketId, data.user_id, data.user_name, initialMessage]
        );

        revalidatePath('/admin/messages');
        revalidatePath('/dashboard/support');
        return { success: true, id: ticketId };
    } catch (e) {
        console.error('Error creating ticket', e);
        const newTicketId = crypto.randomUUID();
        mockTickets.unshift({
            id: newTicketId,
            user_id: data.user_id || 'guest',
            user_email: data.user_email,
            user_name: data.user_name,
            subject: data.subject || 'No Subject',
            status: 'open',
            assigned_leader_id: null,
            created_at: new Date()
        });
        mockMessages.push({
            id: crypto.randomUUID(),
            ticket_id: newTicketId,
            sender_id: data.user_id || 'guest',
            sender_name: data.user_name || 'Guest',
            message_body: initialMessage,
            created_at: new Date()
        });
        return { success: true, id: newTicketId };
    }
}
