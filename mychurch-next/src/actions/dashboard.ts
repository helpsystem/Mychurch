"use server";

import { query } from "@/lib/db";
import { hasRoleOrPermission } from "@/lib/access-control";
import pool from "@/lib/db";

export interface DashboardStats {
    activeUsers: number;
    activeWidgets: number;
    dbConnections: number;
    totalCategories: number;
    recentActivities: Array<{
        id: number;
        action: string;
        user: string;
        time: string;
        type: 'SUCCESS' | 'WARNING' | 'INFO';
    }>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
    if (!(await hasRoleOrPermission([]))) {
        throw new Error("Unauthorized");
    }

    try {
        // Fetch active users count
        const usersResult = await query("SELECT COUNT(*) FROM users");
        const activeUsers = parseInt(usersResult.rows[0].count, 10);

        // Fetch active widgets count (assuming widgets table has is_active or similar)
        // If widgets table doesn't have is_active, just count all widgets
        let activeWidgets = 0;
        try {
            const widgetsResult = await query("SELECT COUNT(*) FROM widgets WHERE active = true");
            activeWidgets = parseInt(widgetsResult.rows[0].count, 10);
        } catch {
            const widgetsResult = await query("SELECT COUNT(*) FROM widgets");
            activeWidgets = parseInt(widgetsResult.rows[0].count, 10);
        }

        // Fetch total categories
        const categoriesResult = await query("SELECT COUNT(*) FROM categories");
        const totalCategories = parseInt(categoriesResult.rows[0].count, 10);

        // Fetch DB Connections from pg_stat_activity
        let dbConnections = 0;
        try {
            const connResult = await query("SELECT count(*) FROM pg_stat_activity");
            dbConnections = parseInt(connResult.rows[0].count, 10);
        } catch {
            dbConnections = pool.totalCount || 0;
        }

        // Fetch real recent activities from multiple tables
        const recentActivities: any[] = [];
        let idCounter = 1;

        try {
            // Latest Users
            const recentUsers = await query("SELECT email, created_at FROM users ORDER BY created_at DESC LIMIT 3");
            recentUsers.rows.forEach((r: any) => {
                recentActivities.push({
                    id: idCounter++,
                    action: "ثبت‌نام کاربر جدید",
                    user: r.email || "Unknown",
                    timeStr: r.created_at,
                    type: "INFO"
                });
            });

            // Latest Announcements
            const recentNews = await query("SELECT title, created_at FROM announcements ORDER BY created_at DESC LIMIT 3");
            recentNews.rows.forEach((r: any) => {
                recentActivities.push({
                    id: idCounter++,
                    action: `انتشار اطلاعیه: ${r.title}`,
                    user: "سیستم",
                    timeStr: r.created_at,
                    type: "SUCCESS"
                });
            });

            // Latest Emails
            const recentEmails = await query("SELECT subject, sent_at FROM mass_email_logs ORDER BY sent_at DESC LIMIT 3");
            recentEmails.rows.forEach((r: any) => {
                recentActivities.push({
                    id: idCounter++,
                    action: `ارسال ایمیل: ${r.subject}`,
                    user: "سیستم",
                    timeStr: r.sent_at,
                    type: "INFO"
                });
            });
            
            // Wait, we need to sort them by date descending and format the time
            recentActivities.sort((a, b) => new Date(b.timeStr).getTime() - new Date(a.timeStr).getTime());
            
            // Format time function for simple relative string or locale string
            const formatRelative = (dateStr: string) => {
                if (!dateStr) return "ناشناس";
                const date = new Date(dateStr);
                return date.toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' });
            };

            recentActivities.splice(5); // Keep top 5
            recentActivities.forEach(item => {
                item.time = formatRelative(item.timeStr);
                delete item.timeStr;
            });
            
            // If empty, add a placeholder
            if (recentActivities.length === 0) {
                recentActivities.push({ id: 999, action: "هیچ فعالیتی ثبت نشده", user: "سیستم", time: "-", type: "INFO" });
            }

        } catch (e) {
            console.error("Error fetching recent activities", e);
        }

        return {
            activeUsers,
            activeWidgets,
            dbConnections,
            totalCategories,
            recentActivities
        };
    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        return {
            activeUsers: 0,
            activeWidgets: 0,
            dbConnections: 0,
            totalCategories: 0,
            recentActivities: []
        };
    }
}
