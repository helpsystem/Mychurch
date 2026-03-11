"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/components/language-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
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
import { saveDocument, type GoodsItem } from "@/lib/store";

export default function CreateGoods() {
  const { t } = useLanguage();
  const router = useRouter();

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("DEJ TV");
  const [deliveryDate, setDeliveryDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [driverName, setDriverName] = useState("");
  
  const [items, setItems] = useState<GoodsItem[]>([
    { id: uuidv4(), description: "", quantity: 1, unit: "pcs" },
  ]);

  const handleAddItem = () => {
    setItems([...items, { id: uuidv4(), description: "", quantity: 1, unit: "pcs" }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof GoodsItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleSave = () => {
    if (!sender.trim() || !receiver.trim()) {
      alert(t("alert_name"));
      return;
    }

    const validItems = items.filter((item) => item.description.trim() !== "");
    if (validItems.length === 0) {
      alert(t("alert_items"));
      return;
    }

    const doc = {
      id: uuidv4(),
      type: "goods" as const,
      title: `Goods from ${sender}`,
      date,
      sender,
      receiver,
      deliveryDate,
      driverName,
      goodsItems: validItems,
      createdAt: Date.now(),
    };

    saveDocument(doc);
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

      <Card>
        <CardHeader>
          <CardTitle>{t("goods_details")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">{t("date")}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryDate">{t("delivery_date")}</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sender">{t("sender")}</Label>
              <Input
                id="sender"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiver">{t("receiver")}</Label>
              <Input
                id="receiver"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="driverName">{t("driver_name")}</Label>
            <Input
              id="driverName"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
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
                  <TableHead className="w-[50%] ltr:text-left rtl:text-right">{t("description")}</TableHead>
                  <TableHead className="ltr:text-left rtl:text-right">{t("quantity")}</TableHead>
                  <TableHead className="ltr:text-left rtl:text-right">{t("unit")}</TableHead>
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
                        className="border-transparent hover:border-slate-200 focus-visible:border-slate-200"
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity || ""}
                        onChange={(e) =>
                          handleItemChange(item.id, "quantity", parseInt(e.target.value) || 1)
                        }
                        className="border-transparent hover:border-slate-200 focus-visible:border-slate-200"
                        dir="ltr"
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <Input
                        value={item.unit}
                        onChange={(e) =>
                          handleItemChange(item.id, "unit", e.target.value)
                        }
                        placeholder="pcs, kg, box..."
                        className="border-transparent hover:border-slate-200 focus-visible:border-slate-200"
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
  );
}
