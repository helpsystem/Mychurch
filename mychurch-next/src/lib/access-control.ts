import { createClient } from "@/utils/supabase/server";

type Role = "Admin" | "Leader" | "Operator" | "User" | string;

const PRIVILEGED_ROLES = new Set<Role>(["Admin", "Leader", "Operator"]);

export type AccessContext = {
  authenticated: boolean;
  email: string | null;
  role: Role | null;
  permissions: Record<string, boolean>;
};

export async function getAccessContext(): Promise<AccessContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      authenticated: false,
      email: null,
      role: null,
      permissions: {},
    };
  }

  const { data } = await supabase
    .from("users")
    .select("role, permissions")
    .eq("email", user.email)
    .maybeSingle();

  return {
    authenticated: true,
    email: user.email,
    role: (data?.role as Role | null) || null,
    permissions: (data?.permissions as Record<string, boolean> | null) || {},
  };
}

export async function hasRoleOrPermission(permissionKeys: string[] = []): Promise<boolean> {
  const context = await getAccessContext();
  if (!context.authenticated) return false;

  if (context.role && PRIVILEGED_ROLES.has(context.role)) {
    return true;
  }

  if (permissionKeys.length === 0) {
    return false;
  }

  return permissionKeys.some((key) => Boolean(context.permissions?.[key]));
}

export async function hasAdminRoleOrPermission(permissionKeys: string[] = []): Promise<boolean> {
  const context = await getAccessContext();
  if (!context.authenticated) return false;

  if (context.role === "Admin") {
    return true;
  }

  if (permissionKeys.length === 0) {
    return false;
  }

  return permissionKeys.some((key) => Boolean(context.permissions?.[key]));
}

export function normalizeAssetUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;

  if (url.startsWith("/api/serve/media/")) return url;
  if (url.startsWith("/media/")) {
    const raw = url.replace(/^\/media\//, "");
    return `/api/serve/media/${raw}`;
  }

  if (url.startsWith("/api/serve/")) return url;
  if (url.startsWith("/uploads/")) {
    const raw = url.replace(/^\/uploads\//, "");
    return `/api/serve/${raw}`;
  }

  if (url.startsWith("/")) return url;
  return `/api/serve/${url}`;
}
