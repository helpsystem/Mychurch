import { getCategories } from "@/actions/categories";
import CategoriesClient from "./CategoriesClient";

export const dynamic = "force-dynamic";

export default async function CategoriesManagementPage() {
    // 1. Fetch live PostgreSQL data (or fallback mock)
    const categories = await getCategories();

    return <CategoriesClient initialCategories={categories} />;
}
