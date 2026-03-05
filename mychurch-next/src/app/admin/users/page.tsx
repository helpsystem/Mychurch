import { getUsers } from "@/actions/users";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersSettingsPage() {
    // Fetch users directly from Supabase via Server Action
    const users = await getUsers();

    return <UsersClient initialUsers={users} />;
}
