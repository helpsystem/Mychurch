import { getUsers } from "@/actions/users";
import RolesManagementClient from "./RolesManagementClient";
import { hasAdminRoleOrPermission } from "@/lib/access-control";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RolesManagementPage() {
    const isAuthorized = await hasAdminRoleOrPermission(["canManageUsers"]);
    if (!isAuthorized) {
        redirect("/admin?error=unauthorized");
    }

    const users = await getUsers();

    return <RolesManagementClient initialUsers={users} />;
}
