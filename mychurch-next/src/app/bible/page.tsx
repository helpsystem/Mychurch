import React from "react";
import BibleReader from "@/components/bible/BibleReader";
import { getBibleBooks } from "@/data/bibleBooks";

export const metadata = {
    title: "Bible Unified | MyChurch",
    description: "Interactive and unified Bible reader for MyChurch community.",
};

export default function BiblePage() {
    // Server-side fetching of initial books
    const books = getBibleBooks();

    return (
        <BibleReader initialBooks={books} />
    );
}
