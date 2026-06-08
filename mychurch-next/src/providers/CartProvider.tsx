"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
    id: string;
    title: string;
    price: number;
    image_url: string;
    weight_grams: number;
    quantity: number;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (item: Omit<CartItem, "quantity">) => void;
    removeFromCart: (id: string) => void;
    clearCart: () => void;
    totalItems: number;
    totalCost: number;
    cartWeightGrams: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // Hydrate cart from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem("mychurch_cart");
            if (stored) {
                setCart(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to load cart from localStorage", e);
        }
        setIsHydrated(true);
    }, []);

    // Save cart to localStorage on changes
    useEffect(() => {
        if (isHydrated) {
            try {
                localStorage.setItem("mychurch_cart", JSON.stringify(cart));
            } catch (e) {
                console.error("Failed to save cart to localStorage", e);
            }
        }
    }, [cart, isHydrated]);

    const addToCart = (item: Omit<CartItem, "quantity">) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i =>
                    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === id);
            if (existing && existing.quantity > 1) {
                return prev.map(i =>
                    i.id === id ? { ...i, quantity: i.quantity - 1 } : i
                );
            }
            return prev.filter(i => i.id !== id);
        });
    };

    const clearCart = () => {
        setCart([]);
    };

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalCost = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const cartWeightGrams = cart.reduce((sum, item) => sum + item.weight_grams * item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                clearCart,
                totalItems,
                totalCost,
                cartWeightGrams,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
