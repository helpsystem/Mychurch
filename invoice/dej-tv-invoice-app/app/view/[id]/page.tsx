"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Printer } from "lucide-react";
import { getDocument, type AppDocument } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ViewDocument() {
  const params = useParams();
  const router = useRouter();
  const { t, dir } = useLanguage();
  const [doc, setDoc] = useState<AppDocument | null>(null);

  useEffect(() => {
    if (params.id && typeof params.id === "string") {
      const found = getDocument(params.id);
      if (found) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDoc(found);
      } else {
        router.push("/");
      }
    }
  }, [params.id, router]);

  if (!doc) return null;

  const handlePrint = () => {
    window.print();
  };

  const renderInvoice = () => (
    <Card className="print:shadow-none print:border-0 print:m-0">
      <CardHeader className="border-b pb-8">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-4xl font-bold tracking-tight text-slate-900">
              {t("invoice")}
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1" dir="ltr">
              Invoice #{doc.id.split("-")[0].toUpperCase()}
            </p>
          </div>
          <div className="ltr:text-right rtl:text-left">
            <h2 className="text-2xl font-bold text-slate-900">DEJ TV</h2>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-8 space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{t("bill_to")}</p>
            <p className="font-semibold text-lg">{doc.to}</p>
          </div>
          <div className="ltr:text-right rtl:text-left">
            <div className="grid grid-cols-2 gap-2 text-sm ltr:justify-end rtl:justify-start">
              <p className="font-medium text-slate-500">{t("date")}:</p>
              <p className="font-semibold">{format(new Date(doc.date), "MMM dd, yyyy")}</p>
              <p className="font-medium text-slate-500">{t("name")}:</p>
              <p className="font-semibold">{doc.name}</p>
            </div>
          </div>
        </div>

        <div className="pt-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-3 ltr:text-left rtl:text-right font-semibold text-slate-900 w-16">{t("no")}</th>
                <th className="py-3 ltr:text-left rtl:text-right font-semibold text-slate-900">{t("description")}</th>
                <th className="py-3 ltr:text-right rtl:text-left font-semibold text-slate-900">{t("total")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doc.items?.map((item, index) => (
                <tr key={item.id}>
                  <td className="py-4 text-slate-500">{index + 1}</td>
                  <td className="py-4 font-medium text-slate-900">{item.description}</td>
                  <td className="py-4 ltr:text-right rtl:text-left text-slate-900" dir="ltr">${item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200">
                <td colSpan={2} className="py-4 ltr:text-right rtl:text-left font-bold text-slate-900 text-lg">
                  {t("total")}
                </td>
                <td className="py-4 ltr:text-right rtl:text-left font-bold text-slate-900 text-lg" dir="ltr">
                  ${doc.totalAmount?.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {doc.walletTether && (
          <div className="pt-8 border-t">
            <p className="text-sm font-medium text-slate-500 mb-1">{t("wallet_tether")}:</p>
            <p className="font-mono text-sm break-all bg-slate-50 p-3 rounded-md border" dir="ltr">
              {doc.walletTether}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderPayment = () => (
    <Card className="print:shadow-none print:border-0 print:m-0 border-emerald-100">
      <CardHeader className="border-b border-emerald-100 bg-emerald-50/50 pb-8 rounded-t-xl print:bg-transparent">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-4xl font-bold tracking-tight text-emerald-900">
              {t("payment_receipt")}
            </CardTitle>
            <p className="text-sm text-emerald-600 mt-1" dir="ltr">
              Receipt #{doc.id.split("-")[0].toUpperCase()}
            </p>
          </div>
          <div className="ltr:text-right rtl:text-left">
            <h2 className="text-2xl font-bold text-emerald-900">DEJ TV</h2>
            <p className="text-sm text-emerald-600 mt-1">{format(new Date(doc.date), "MMM dd, yyyy")}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-8 space-y-8">
        <div className="flex justify-between items-center bg-slate-50 p-6 rounded-xl border">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{t("amount")}</p>
            <p className="text-4xl font-bold text-slate-900" dir="ltr">${doc.amount?.toFixed(2)}</p>
          </div>
          {doc.referenceNo && (
            <div className="ltr:text-right rtl:text-left">
              <p className="text-sm font-medium text-slate-500 mb-1">{t("reference_no")}</p>
              <p className="font-mono font-medium">{doc.referenceNo}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{t("payer")}</p>
            <p className="font-semibold text-lg">{doc.payer}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{t("payee")}</p>
            <p className="font-semibold text-lg">{doc.payee}</p>
          </div>
        </div>

        {doc.amountInWords && (
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{t("amount_in_words")}</p>
            <p className="font-medium italic">{doc.amountInWords}</p>
          </div>
        )}

        {doc.paymentFor && (
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{t("payment_for")}</p>
            <p className="font-medium whitespace-pre-wrap">{doc.paymentFor}</p>
          </div>
        )}

        {doc.paymentMethod && (
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{t("payment_method")}</p>
            <p className="font-medium">{doc.paymentMethod}</p>
          </div>
        )}

        <div className="pt-16 grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="border-b-2 border-slate-300 w-48 mx-auto mb-2"></div>
            <p className="text-sm text-slate-500">{t("payer")} {t("signature")}</p>
          </div>
          <div className="text-center">
            <div className="border-b-2 border-slate-300 w-48 mx-auto mb-2"></div>
            <p className="text-sm text-slate-500">{t("payee")} {t("signature")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderGoods = () => (
    <Card className="print:shadow-none print:border-0 print:m-0 border-amber-100">
      <CardHeader className="border-b border-amber-100 bg-amber-50/50 pb-8 rounded-t-xl print:bg-transparent">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-4xl font-bold tracking-tight text-amber-900">
              {t("goods_receipt")}
            </CardTitle>
            <p className="text-sm text-amber-600 mt-1" dir="ltr">
              Receipt #{doc.id.split("-")[0].toUpperCase()}
            </p>
          </div>
          <div className="ltr:text-right rtl:text-left">
            <h2 className="text-2xl font-bold text-amber-900">DEJ TV</h2>
            <p className="text-sm text-amber-600 mt-1">{t("date")}: {format(new Date(doc.date), "MMM dd, yyyy")}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-8 space-y-8">
        <div className="grid grid-cols-2 gap-8 bg-slate-50 p-6 rounded-xl border">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{t("sender")}</p>
            <p className="font-semibold text-lg">{doc.sender}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{t("receiver")}</p>
            <p className="font-semibold text-lg">{doc.receiver}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {doc.deliveryDate && (
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{t("delivery_date")}</p>
              <p className="font-medium">{format(new Date(doc.deliveryDate), "MMM dd, yyyy")}</p>
            </div>
          )}
          {doc.driverName && (
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{t("driver_name")}</p>
              <p className="font-medium">{doc.driverName}</p>
            </div>
          )}
        </div>

        <div className="pt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-3 ltr:text-left rtl:text-right font-semibold text-slate-900 w-16">{t("no")}</th>
                <th className="py-3 ltr:text-left rtl:text-right font-semibold text-slate-900">{t("description")}</th>
                <th className="py-3 ltr:text-center rtl:text-center font-semibold text-slate-900 w-24">{t("quantity")}</th>
                <th className="py-3 ltr:text-right rtl:text-left font-semibold text-slate-900 w-24">{t("unit")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doc.goodsItems?.map((item, index) => (
                <tr key={item.id}>
                  <td className="py-4 text-slate-500">{index + 1}</td>
                  <td className="py-4 font-medium text-slate-900">{item.description}</td>
                  <td className="py-4 text-center font-medium text-slate-900" dir="ltr">{item.quantity}</td>
                  <td className="py-4 ltr:text-right rtl:text-left text-slate-500">{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-16 grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="border-b-2 border-slate-300 w-48 mx-auto mb-2"></div>
            <p className="text-sm text-slate-500">{t("sender")} {t("signature")}</p>
          </div>
          <div className="text-center">
            <div className="border-b-2 border-slate-300 w-48 mx-auto mb-2"></div>
            <p className="text-sm text-slate-500">{t("receiver")} {t("signature")}</p>
            <p className="text-xs text-slate-400 mt-1">{t("date_received")}: ....................</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderLetter = () => (
    <Card className="print:shadow-none print:border-0 print:m-0 border-purple-100 relative min-h-[800px]">
      {/* Letterhead Header */}
      <CardHeader className="border-b-4 border-purple-900 pb-6 mb-8 print:border-b-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-purple-900 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
              D
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-purple-900">DEJ TV</h1>
              <p className="text-sm font-medium text-purple-700 tracking-widest uppercase">Digital Media Agency</p>
            </div>
          </div>
          <div className="text-sm text-slate-500 ltr:text-right rtl:text-left space-y-1">
            <p><span className="font-semibold">{t("date")}:</span> {format(new Date(doc.date), "yyyy/MM/dd")}</p>
            <p><span className="font-semibold">Ref:</span> {doc.id.split("-")[0].toUpperCase()}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 px-12 print:px-0">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-slate-900">{t("to")}: {doc.recipient}</p>
          <p className="text-lg font-bold text-slate-900">{t("subject")}: {doc.subject}</p>
        </div>

        <div className="prose prose-slate max-w-none min-h-[300px]">
          {doc.body?.split('\n').map((paragraph, i) => (
            <p key={i} className="text-justify leading-relaxed text-slate-800 text-lg">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="pt-16 ltr:text-right rtl:text-left">
          <p className="font-bold text-lg text-slate-900">{doc.senderName}</p>
          <p className="text-slate-600">{doc.senderTitle}</p>
          <div className="mt-8 ltr:ml-auto rtl:mr-auto w-48 border-b-2 border-slate-300 border-dashed"></div>
        </div>
      </CardContent>

      {/* Letterhead Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-6 text-center text-sm text-slate-500 print:fixed print:bottom-0">
        <p>123 Media Avenue, Digital District, Tech City 10001</p>
        <p>contact@dej.tv | +1 (555) 123-4567 | www.dej.tv</p>
        <div className="mt-2 font-mono text-xs">
          {t("page")} <span className="pageNumber">1</span> {t("of")} <span className="totalPages">1</span>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <Link href="/">
          <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-slate-600">
            <ArrowLeft className="ltr:mr-2 rtl:ml-2 rtl:rotate-180 h-4 w-4" />
            {t("back_to_dashboard")}
          </Button>
        </Link>
        <div className="flex gap-4 items-center">
          <LanguageSwitcher />
          <Button onClick={handlePrint} variant="outline">
            <Printer className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            {t("print_save")}
          </Button>
        </div>
      </div>

      {doc.type === 'invoice' && renderInvoice()}
      {doc.type === 'payment' && renderPayment()}
      {doc.type === 'goods' && renderGoods()}
      {doc.type === 'letter' && renderLetter()}
    </div>
  );
}
