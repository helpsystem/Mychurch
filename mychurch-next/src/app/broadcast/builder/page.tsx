import React from "react";
import { getPresentationById } from "@/actions/presentations";
import BuilderClientWrapper from "./BuilderClientWrapper";
import { BroadcastSession } from "@/types/broadcast";
import { requireRole } from "@/utils/rbac";

export const dynamic = "force-dynamic";

type SerializedBroadcastSession = Omit<BroadcastSession, "date"> & {
    date: string;
};

export default async function SlideBuilderPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    await requireRole(["Admin", "Leader", "Operator"]);

    const resolvedParams = await searchParams;
    const rawId = resolvedParams?.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    let initialSession: BroadcastSession;

    if (id) {
        const fetchedSession = await getPresentationById(id);
        if (fetchedSession) {
            initialSession = fetchedSession;
        } else {
            // Fallback if ID is invalid
            initialSession = {
                id: crypto.randomUUID(),
                title: "مراسم جدید (New Session)",
                date: new Date(),
                slides: [],
                status: "draft"
            };
        }
    } else {
        initialSession = {
            id: crypto.randomUUID(),
            title: "مراسم جدید (New Session)",
            date: new Date(),
            slides: [],
            status: "draft"
        };
    }

    const defaultTestSlide = {
        id: "psalm-23-test-slide",
        order: 0,
        type: "scripture" as const,
        zoom: 1.15,
        notes: "اسلاید آزمایشی مزمور ۲۳ — ترجمه قدیم (فاضل‌خان همدانی)",
        content: {
            pages: [{
                id: "psalm-23-page-1",
                book: "PSA",
                bookName: { fa: "مزامیر", en: "Psalms" },
                chapter: 23,
                verses: "1-6",
                verseNumbers: [1, 2, 3, 4, 5, 6],
                textPrimary: [
                    "خداوند شبان من است. محتاج به هیچ چیز نخواهم بود.",
                    "در مرتعهای سبز مرا میخواباند. نزد آبهای راحت مرا رهبری میکند.",
                    "جان مرا برمی‌گرداند. و به خاطر نام خود به راههای عدالت هدایتم می‌نماید.",
                    "چون در وادی سایه موت نیز راه روم از بدی نخواهم ترسید زیرا تو با من هستی. عصا و چوب دستی تو مرا تسلی خواهد داد.",
                    "سفره‌ای برای من به حضور دشمنانم میگسترانی. سر مرا به روغن تدهین کرده‌ای و کاسه‌ام لبریز شده است.",
                    "یقیناً نیکویی و رحمت در تمام ایام عمرم به دنبال من خواهند بود و در خانه خداوند تا ابدالآباد ساکن خواهم بود."
                ],
                textSecondary: [
                    "The LORD is my shepherd; I shall not want.",
                    "He makes me lie down in green pastures; He leads me beside quiet waters.",
                    "He restores my soul; He guides me in the paths of righteousness for His name's sake.",
                    "Even though I walk through the valley of the shadow of death, I will fear no evil, for You are with me; Your rod and Your staff, they comfort me.",
                    "You prepare a table before me in the presence of my enemies. You anoint my head with oil; my cup overflows.",
                    "Surely goodness and mercy will follow me all the days of my life, and I will dwell in the house of the LORD forever."
                ],
                translation: "PCB",
                enTranslation: "BSB",
                fontFa: "var(--font-vazirmatn)",
                fontEn: "var(--font-inter)",
                primaryLanguage: "fa" as const,
                displayMode: "referenceList" as const,
                glassPopupEnabled: true,
                popupLabelFa: "مزامیر \u206623:1-6\u2069",
                popupLabelEn: "Psalms 23:1-6",
                referenceItems: [{
                    id: "psalm-23-ref-1",
                    book: "PSA",
                    bookName: { fa: "مزامیر", en: "Psalms" },
                    chapter: 23,
                    verses: "1-6",
                    verseNumbers: [1, 2, 3, 4, 5, 6],
                    textFa: [
                        "خداوند شبان من است. محتاج به هیچ چیز نخواهم بود.",
                        "در مرتعهای سبز مرا میخواباند. نزد آبهای راحت مرا رهبری میکند.",
                        "جان مرا برمی‌گرداند. و به خاطر نام خود به راههای عدالت هدایتم می‌نماید.",
                        "چون در وادی سایه موت نیز راه روم از بدی نخواهم ترسید زیرا تو با من هستی. عصا و چوب دستی تو مرا تسلی خواهد داد.",
                        "سفره‌ای برای من به حضور دشمنانم میگسترانی. سر مرا به روغن تدهین کرده‌ای و کاسه‌ام لبریز شده است.",
                        "یقیناً نیکویی و رحمت در تمام ایام عمرم به دنبال من خواهند بود و در خانه خداوند تا ابدالآباد ساکن خواهم بود."
                    ],
                    textEn: [
                        "The LORD is my shepherd; I shall not want.",
                        "He makes me lie down in green pastures; He leads me beside quiet waters.",
                        "He restores my soul; He guides me in the paths of righteousness for His name's sake.",
                        "Even though I walk through the valley of the shadow of death, I will fear no evil, for You are with me; Your rod and Your staff, they comfort me.",
                        "You prepare a table before me in the presence of my enemies. You anoint my head with oil; my cup overflows.",
                        "Surely goodness and mercy will follow me all the days of my life, and I will dwell in the house of the LORD forever."
                    ],
                    translation: "PCB",
                    enTranslation: "BSB"
                }]
            }]
        }
    };

    if (initialSession.slides.length === 0) {
        initialSession.slides = [defaultTestSlide as any];
    }

    const serializedSession: SerializedBroadcastSession = {
        ...initialSession,
        date: initialSession.date.toISOString(),
    };

    return <BuilderClientWrapper initialSession={serializedSession} />;
}
