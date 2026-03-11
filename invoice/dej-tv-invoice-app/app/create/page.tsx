"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Receipt, Package, FileSignature } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function CreateSelector() {
  const { t } = useLanguage();

  const docTypes = [
    {
      id: "invoice",
      title: t("invoice"),
      description: "Create a standard invoice with items and total amount.",
      icon: FileText,
      href: "/create/invoice",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      id: "payment",
      title: t("payment_receipt"),
      description: "Create a receipt for a payment received or made.",
      icon: Receipt,
      href: "/create/payment",
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      id: "goods",
      title: t("goods_receipt"),
      description: "Create a receipt for delivered or received goods.",
      icon: Package,
      href: "/create/goods",
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      id: "letter",
      title: t("letter"),
      description: "Create an official letterhead document with page numbers.",
      icon: FileSignature,
      href: "/create/letter",
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/">
          <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-slate-600">
            <ArrowLeft className="ltr:mr-2 rtl:ml-2 rtl:rotate-180 h-4 w-4" />
            {t("back_to_dashboard")}
          </Button>
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t("select_doc_type")}</h1>
        <p className="text-slate-500">Choose the type of document you want to create.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {docTypes.map((doc) => (
          <Link key={doc.id} href={doc.href}>
            <Card className="hover:border-slate-300 hover:shadow-md transition-all cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className={`p-3 rounded-xl ${doc.bg}`}>
                  <doc.icon className={`h-6 w-6 ${doc.color}`} />
                </div>
                <div>
                  <CardTitle className="text-xl">{doc.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{doc.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
