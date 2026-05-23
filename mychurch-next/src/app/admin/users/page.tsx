import { getUsers } from "@/actions/users";
import UsersClient from "./UsersClient";
import { hasAdminRoleOrPermission } from "@/lib/access-control";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UsersSettingsPage() {
    const isAuthorized = await hasAdminRoleOrPermission(["canManageUsers"]);
    if (!isAuthorized) {
        redirect("/admin?error=unauthorized");
    }

    // Fetch users directly from Supabase via Server Action
    const users = await getUsers();

    return <UsersClient initialUsers={users} />;
}
