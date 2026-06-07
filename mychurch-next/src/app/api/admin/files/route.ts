import { NextResponse } from "next/server";
import { requireRole } from "@/utils/rbac";
import fs from "fs/promises";
import path from "path";

// Restrict base directory to the project root to prevent path traversal
const PROJECT_ROOT = path.resolve(process.cwd());

function getSafePath(relativeParam: string | null): string {
    const relativePath = relativeParam || "";
    const resolvedPath = path.resolve(PROJECT_ROOT, relativePath);

    if (!resolvedPath.startsWith(PROJECT_ROOT)) {
        throw new Error("Access Denied: Path Traversal Detected");
    }

    return resolvedPath;
}

export async function GET(request: Request) {
    try {
        await requireRole(["Admin"]);
    } catch {
        return NextResponse.json({ error: "Access Denied: Insufficient Permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const relativePath = searchParams.get("path") || "";

    try {
        const targetPath = getSafePath(relativePath);
        const stats = await fs.stat(targetPath);

        if (!stats.isDirectory()) {
            return NextResponse.json({ error: "Target path is not a directory" }, { status: 400 });
        }

        const entries = await fs.readdir(targetPath, { withFileTypes: true });

        const files = await Promise.all(
            entries.map(async (entry) => {
                const entryPath = targetPath + "/" + entry.name;
                const entryRelativePath = path.relative(PROJECT_ROOT, entryPath).replace(/\\/g, "/");
                
                try {
                    const s = await fs.stat(entryPath);
                    return {
                        name: entry.name,
                        isDirectory: entry.isDirectory(),
                        size: s.size,
                        modifiedAt: s.mtimeMs,
                        relativePath: entryRelativePath
                    };
                } catch {
                    return {
                        name: entry.name,
                        isDirectory: entry.isDirectory(),
                        size: 0,
                        modifiedAt: Date.now(),
                        relativePath: entryRelativePath
                    };
                }
            })
        );

        // Sort: directories first, then files alphabetically
        files.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });

        const currentRelative = path.relative(PROJECT_ROOT, targetPath).replace(/\\/g, "/");

        return NextResponse.json({
            success: true,
            currentPath: currentRelative,
            files
        });
    } catch (error: any) {
        console.error("[File Manager API] GET Error:", error);
        return NextResponse.json({ error: error.message || "Failed to read directory" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        await requireRole(["Admin"]);
    } catch {
        return NextResponse.json({ error: "Access Denied: Insufficient Permissions" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const relativePath = body.path;

        if (!relativePath) {
            return NextResponse.json({ error: "Path parameter is required" }, { status: 400 });
        }

        const targetPath = getSafePath(relativePath);
        const stats = await fs.stat(targetPath);

        if (stats.isDirectory()) {
            // Remove directory recursively
            await fs.rm(targetPath, { recursive: true, force: true });
        } else {
            // Remove single file
            await fs.unlink(targetPath);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[File Manager API] DELETE Error:", error);
        return NextResponse.json({ error: error.message || "Failed to delete file/folder" }, { status: 500 });
    }
}
