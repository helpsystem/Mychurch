"use client";

import React, { useState } from "react";
import { useCart, CartItem } from "@/providers/CartProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, Plus, Minus, Trash2, ShieldAlert, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface Product {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    price: string | number;
    weight_grams: string | number;
    inventory: number;
}

interface StoreClientProps {
    initialProducts: Product[];
}

const localDict = {
    en: {
        storeTitle: "Church Cultural Store",
        storeSubtitle: "Support our ministry and browse our books, guides, and branding gear.",
        addToCart: "Add to Cart",
        cartTitle: "Shopping Cart",
        checkout: "Proceed to Checkout",
        emptyCart: "Your cart is empty.",
        subtotal: "Subtotal",
        shipping: "Shipping (Weight-based)",
        total: "Total Estimate",
        inStock: "In Stock",
        outOfStock: "Out of Stock",
        onlyLeft: "only left",
        backToHome: "Back to Home",
        cartItems: "Items",
        checkoutSecure: "Secure Checkout via Stripe",
        processing: "Redirecting to Stripe...",
    },
    fa: {
        storeTitle: "فروشگاه محصولات فرهنگی کلیسا",
        storeSubtitle: "با خرید محصولات فرهنگی و نشانی کلیسا از خدمات رسانه‌ای ما حمایت کنید.",
        addToCart: "افزودن به سبد خرید",
        cartTitle: "سبد خرید شما",
        checkout: "پرداخت و نهایی‌سازی",
        emptyCart: "سبد خرید شما خالی است.",
        subtotal: "جمع جزء",
        shipping: "هزینه ارسال (محاسبه با وزن)",
        total: "جمع کل تقریبی",
        inStock: "موجود در انبار",
        outOfStock: "ناموجود",
        onlyLeft: "عدد باقی مانده",
        backToHome: "بازگشت به خانه",
        cartItems: "کالا",
        checkoutSecure: "پرداخت امن از طریق درگاه Stripe",
        processing: "در حال انتقال به درگاه پرداخت...",
    }
};

export default function StoreClient({ initialProducts }: StoreClientProps) {
    const { cart, addToCart, removeFromCart, clearCart, totalItems, totalCost, cartWeightGrams } = useCart();
    const { isRTL, language } = useLanguage();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const d = localDict[language] || localDict.fa;

    const handleAddToCart = (product: Product) => {
        addToCart({
            id: product.id,
            title: product.title,
            price: Number(product.price),
            image_url: product.image_url || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop",
            weight_grams: Number(product.weight_grams),
        });
    };

    const handleCheckout = async () => {
        setIsCheckingOut(true);
        setError(null);
        try {
            const res = await fetch("/api/store/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cart: cart.map(item => ({ id: item.id, quantity: item.quantity })),
                    // Stripe checkout can pre-fill customer email if logged in
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Checkout failed");
            }

            if (data.url) {
                // Redirect directly to Stripe Checkout
                window.location.href = data.url;
            } else {
                throw new Error("Invalid session URL received.");
            }
        } catch (err: any) {
            console.error("Checkout error:", err);
            setError(err.message || "Failed to initiate checkout. Please try again.");
            setIsCheckingOut(false);
        }
    };

    // Calculate dynamic shipping cost for drawer display:
    // Matches logic in /api/store/checkout/route.ts
    const shippingEstimate = totalItems > 0 ? 5.99 + (cartWeightGrams * 0.01) : 0;
    const totalEstimate = totalCost + shippingEstimate;

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8" dir={isRTL ? "rtl" : "ltr"}>
            
            {/* Store Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-800 pb-8 mb-12">
                <div className="mb-6 md:mb-0">
                    <h1 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight font-[Vazirmatn]">
                        {d.storeTitle}
                    </h1>
                    <p className="mt-3 text-lg text-zinc-400 max-w-2xl font-[Vazirmatn]">
                        {d.storeSubtitle}
                    </p>
                </div>

                {/* Cart Button */}
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="relative flex items-center justify-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800 text-white px-6 py-3.5 rounded-xl transition-all duration-300 shadow-lg cursor-pointer"
                    title={d.cartTitle}
                >
                    <ShoppingCart className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold">{d.cartTitle}</span>
                    {totalItems > 0 && (
                        <span className="absolute -top-2.5 -right-2 bg-amber-500 text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center animate-pulse">
                            {totalItems}
                        </span>
                    )}
                </button>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-8 p-4 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center gap-3 text-red-200">
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-sm font-[Vazirmatn]">{error}</p>
                </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {initialProducts.map(product => {
                    const cartQty = cart.find(item => item.id === product.id)?.quantity || 0;
                    const isOutOfStock = product.inventory <= 0;
                    const isMaxed = cartQty >= product.inventory;

                    return (
                        <div
                            key={product.id}
                            className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700/80 transition-all duration-300 flex flex-col group"
                        >
                            {/* Image Container */}
                            <div className="aspect-[4/3] w-full overflow-hidden relative bg-zinc-950">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                        No Image
                                    </div>
                                )}
                                {isOutOfStock && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                                        <span className="bg-red-950 text-red-200 border border-red-800 text-xs font-bold px-3 py-1.5 rounded-lg font-[Vazirmatn]">
                                            {d.outOfStock}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="p-6 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-amber-500 transition-colors duration-300 font-[Vazirmatn]">
                                        {product.title}
                                    </h3>
                                    {product.description && (
                                        <p className="mt-2 text-sm text-zinc-400 line-clamp-2 leading-relaxed font-[Vazirmatn]">
                                            {product.description}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-6">
                                    <div className="flex items-baseline justify-between mb-4">
                                        <span className="text-2xl font-extrabold text-amber-500 font-mono">
                                            ${Number(product.price).toFixed(2)}
                                        </span>
                                        <span className="text-xs text-zinc-500">
                                            {product.weight_grams}g
                                        </span>
                                    </div>

                                    {/* Inventory warning */}
                                    {!isOutOfStock && product.inventory < 10 && (
                                        <p className="text-xs text-amber-500/80 mb-3 font-[Vazirmatn]">
                                            ⚠️ {product.inventory} {d.onlyLeft}
                                        </p>
                                    )}

                                    {/* Add to Cart Button */}
                                    <button
                                        onClick={() => handleAddToCart(product)}
                                        disabled={isOutOfStock || isMaxed}
                                        className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer ${
                                            isOutOfStock || isMaxed
                                                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                                                : "bg-amber-500 text-black hover:bg-amber-400 font-[Vazirmatn]"
                                        }`}
                                    >
                                        {isOutOfStock ? d.outOfStock : isMaxed ? "Limit Reached" : d.addToCart}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Shopping Cart Drawer Slider Overlay */}
            <AnimatePresence>
                {isCartOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCartOpen(false)}
                            className="fixed inset-0 bg-black/70 z-50 backdrop-blur-xs"
                        />

                        {/* Drawer panel */}
                        <motion.div
                            initial={{ x: isRTL ? "-100%" : "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: isRTL ? "-100%" : "100%" }}
                            transition={{ type: "tween", duration: 0.35 }}
                            className={`fixed top-0 bottom-0 ${
                                isRTL ? "left-0" : "right-0"
                            } w-full sm:max-w-md bg-zinc-900 border-l border-zinc-800 z-50 shadow-2xl flex flex-col`}
                        >
                            {/* Drawer Header */}
                            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <ShoppingCart className="w-5 h-5 text-amber-500" />
                                    <h2 className="text-xl font-bold text-white font-[Vazirmatn]">
                                        {d.cartTitle}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setIsCartOpen(false)}
                                    className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Drawer Scrollable Items */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center py-20">
                                        <ShoppingCart className="w-16 h-16 mb-4 text-zinc-700 stroke-1" />
                                        <p className="font-[Vazirmatn]">{d.emptyCart}</p>
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div
                                            key={item.id}
                                            className="flex gap-4 p-4 bg-zinc-950/40 border border-zinc-800/80 rounded-xl"
                                        >
                                            <img
                                                src={item.image_url}
                                                alt={item.title}
                                                className="w-16 h-16 object-cover rounded-lg bg-zinc-900 shrink-0"
                                            />
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <h4 className="font-bold text-white text-sm line-clamp-1 font-[Vazirmatn]">
                                                        {item.title}
                                                    </h4>
                                                    <span className="text-xs text-zinc-500">
                                                        {item.weight_grams}g
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                                        >
                                                            <Minus className="w-3.5 h-3.5" />
                                                        </button>
                                                        <span className="px-3 text-sm font-semibold text-white font-mono">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => addToCart(item)}
                                                            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>

                                                    <span className="font-bold text-amber-500 font-mono text-sm">
                                                        ${(item.price * item.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Drawer Summary & Checkout */}
                            {cart.length > 0 && (
                                <div className="p-6 border-t border-zinc-800 bg-zinc-950/60 space-y-4">
                                    <div className="space-y-2 text-sm text-zinc-400">
                                        <div className="flex justify-between">
                                            <span className="font-[Vazirmatn]">{d.subtotal}</span>
                                            <span className="font-mono text-white">${totalCost.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-[Vazirmatn]">{d.shipping}</span>
                                            <span className="font-mono text-white">${shippingEstimate.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-zinc-800 pt-3 text-base">
                                            <span className="font-bold text-white font-[Vazirmatn]">{d.total}</span>
                                            <span className="font-extrabold text-amber-500 font-mono">
                                                ${totalEstimate.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCheckout}
                                        disabled={isCheckingOut}
                                        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg font-[Vazirmatn] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
                                    >
                                        {isCheckingOut ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                                                <span>{d.processing}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>{d.checkout}</span>
                                                {isRTL ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                                            </>
                                        )}
                                    </button>
                                    <p className="text-[10px] text-center text-zinc-500 font-[Vazirmatn]">
                                        🔒 {d.checkoutSecure}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
