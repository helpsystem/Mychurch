import { clearImpersonationRole, getImpersonationRole } from "@/actions/impersonation";
import { getRealUserRole } from "@/utils/rbac";
import UnauthorizedClient from "./UnauthorizedClient";

export default async function UnauthorizedPage() {
    const impersonatedRole = await getImpersonationRole();
    const realRole = await getRealUserRole();

    async function handleReset() {
        "use server";
        await clearImpersonationRole();
    }

    return (
        <UnauthorizedClient
            impersonatedRole={impersonatedRole}
            realRole={realRole}
            onReset={handleReset}
        />
    );
}
