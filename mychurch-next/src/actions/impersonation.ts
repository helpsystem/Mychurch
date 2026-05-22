"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const COOKIE_NAME = "mychurch_view_as_role";

export async function setImpersonationRole(role: string) {
    cookies().set(COOKIE_NAME, role, { path: '/' });
    revalidatePath("/", "layout");
}

export async function clearImpersonationRole() {
    cookies().delete(COOKIE_NAME);
    revalidatePath("/", "layout");
}

export async function getImpersonationRole() {
    return cookies().get(COOKIE_NAME)?.value || null;
}
