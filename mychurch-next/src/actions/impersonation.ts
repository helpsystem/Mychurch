"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const COOKIE_NAME = "mychurch_view_as_role";

export async function setImpersonationRole(role: string) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, role, { path: '/' });
    revalidatePath("/", "layout");
}

export async function clearImpersonationRole() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    revalidatePath("/", "layout");
}

export async function getImpersonationRole() {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value || null;
}
