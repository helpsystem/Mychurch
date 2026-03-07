import { query } from "../src/lib/db";

async function main() {
    const sql = `
        CREATE TABLE IF NOT EXISTS messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            type VARCHAR(50) NOT NULL CHECK (type IN ('message', 'prayer')),
            recipient_leader VARCHAR(50), 
            category VARCHAR(100),
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            subject VARCHAR(255),
            content TEXT NOT NULL,
            is_read BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        );

        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Enable insert access for all users" ON messages FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable read/update access for authenticated users" ON messages FOR SELECT USING (true);
        CREATE POLICY "Enable update access for authenticated users" ON messages FOR UPDATE USING (true);
        CREATE POLICY "Enable delete access for authenticated users" ON messages FOR DELETE USING (true);
    `;

    try {
        console.log("Running SQL script...");
        await query(sql, []);
        console.log("Success!");
    } catch (e) {
        console.error("Error running script to create messages table:", e);
    }
}

main();
