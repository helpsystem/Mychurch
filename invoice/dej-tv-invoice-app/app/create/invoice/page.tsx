"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { ArrowLeft, Sparkles, Plus, Trash2, Save } from "lucide-react";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/components/language-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { saveDocument, type InvoiceItem } from "@/lib/store";

export default function CreateInvoice() {
  const { t, dir } = useLanguage();
  const router = useRouter();
  const [isParsing, setIsParsing] = useState(false);
  const [aiInput, setAiInput] = useState("");

  const [to, setTo] = useState("DEJ TV");
  const [name, setName] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [walletTether, setWalletTether] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: uuidv4(), description: "", total: 0 },
  ]);

  const handleAddItem = () => {
    setItems([...items, { id: uuidv4(), description: "", total: 0 }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  const handleParseAI = async () => {
    if (!aiInput.trim()) return;
    setIsParsing(true);

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Parse the following text into invoice items. The text might be in Persian or English. Extract the description of the work (e.g., "vid", "report", "photo") and the total price for that item. If a quantity and unit price are mentioned, calculate the total.
        
        Text: "${aiInput}"`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: {
                  type: Type.STRING,
                  description: "The description of the work, e.g., 'vid', 'report', 'photo', 'video editing', etc.",
                },
                total: {
                  type: Type.NUMBER,
                  description: "The total price for this item.",
                },
              },
              required: ["description", "total"],
            },
          },
        },
      });

      const jsonStr = response.text?.trim();
      if (jsonStr) {
        const parsedItems = JSON.parse(jsonStr);
        const newItems = parsedItems.map((item: any) => ({
          id: uuidv4(),
          description: item.description,
          total: item.total,
        }));
        
        // If we only have one empty item, replace it. Otherwise append.
        if (items.length === 1 && items[0].description === "" && items[0].total === 0) {
          setItems(newItems);
        } else {
          setItems([...items, ...newItems]);
        }
        setAiInput("");
      }
    } catch (error) {
      console.error("Failed to parse AI input:", error);
      alert(t("alert_ai"));
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert(t("alert_name"));
      return;
    }

    const validItems = items.filter((item) => item.description.trim() !== "");
    if (validItems.length === 0) {
      alert(t("alert_items"));
      return;
    }

    const invoice = {
      id: uuidv4(),
      type: "invoice" as const,
      title: name,
      to,
      name,
      date,
      items: validItems,
      totalAmount,
      walletTether,
      createdAt: Date.now(),
    };

    saveDocument(invoice);
    router.push("/");
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/create">
          <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-slate-600">
            <ArrowLeft className="ltr:mr-2 rtl:ml-2 rtl:rotate-180 h-4 w-4" />
            {t("back_to_dashboard")}
          </Button>
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AI Assistant Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-indigo-50/50 border-indigo-100">
            <CardHeader>
              <CardTitle className="flex items-center text-indigo-900">
                <Sparkles className="ltr:mr-2 rtl:ml-2 h-5 w-5 text-indigo-500" />
                {t("ai_assistant")}
              </CardTitle>
              <CardDescription className="text-indigo-700/70">
                {t("ai_desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={t("ai_placeholder")}
                className="min-h-[120px] bg-white border-indigo-200 focus-visible:ring-indigo-500"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
              />
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleParseAI}
                disabled={isParsing || !aiInput.trim()}
              >
                {isParsing ? t("thinking") : t("extract_items")}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Form */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("invoice_details")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="to">{t("to")}</Label>
                  <Input
                    id="to"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="DEJ TV"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">{t("date")}</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t("personnel_name")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <Label className="text-base">{t("items")}</Label>
                  <Button variant="outline" size="sm" onClick={handleAddItem}>
                    <Plus className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                    {t("add_row")}
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60%] ltr:text-left rtl:text-right">{t("description")}</TableHead>
                      <TableHead className="ltr:text-left rtl:text-right">{t("total")} ($)</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="p-2">
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(item.id, "description", e.target.value)
                            }
                            placeholder="vid, report, photo..."
                            className="border-transparent hover:border-slate-200 focus-visible:border-slate-200"
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.total || ""}
                            onChange={(e) =>
                              handleItemChange(item.id, "total", parseFloat(e.target.value) || 0)
                            }
                            placeholder="0.00"
                            className="border-transparent hover:border-slate-200 focus-visible:border-slate-200"
                            dir="ltr"
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-500"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex justify-end pt-4" dir="ltr">
                  <div className="text-xl font-semibold">
                    {t("total")}: ${totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="wallet">{t("wallet_tether")}</Label>
                <Input
                  id="wallet"
                  value={walletTether}
                  onChange={(e) => setWalletTether(e.target.value)}
                  placeholder="T..."
                  className="font-mono"
                  dir="ltr"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t p-6 bg-slate-50 rounded-b-xl">
              <Button onClick={handleSave} size="lg" className="w-full sm:w-auto">
                <Save className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t("save_invoice")}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
