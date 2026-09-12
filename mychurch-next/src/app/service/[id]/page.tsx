import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicPresentationById } from "@/actions/presentations";
import ServiceClient from "./ServiceClient";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const session = await getPublicPresentationById(id);

  if (!session) {
    return {
      title: "جلسه کلیسا یافت نشد | Iranian Church DC",
    };
  }

  const title = `برنامه و اسلایدهای جلسه: ${session.title} | کلیسای ایرانیان واشنگتن`;
  const description = `متن سرودهای پرستشی، صوت، آیات کتاب‌مقدس و اسلایدهای موعظه جلسه ${session.title}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Iranian Presbyterian Church of D.C.",
      images: [
        {
          url: "https://www.iranianchurchdc.com/images/cross.png",
          width: 800,
          height: 600,
          alt: "Iranian Church DC",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ServicePage({ params, searchParams }: Props) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const session = await getPublicPresentationById(id);

  if (!session) {
    notFound();
  }

  return (
    <ServiceClient
      session={session}
      initialRef={typeof resolvedSearchParams.ref === "string" ? resolvedSearchParams.ref : undefined}
    />
  );
}
