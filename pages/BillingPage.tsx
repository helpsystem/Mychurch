import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { CreditCard, Download, Edit, Trash2, PlusCircle } from 'lucide-react';
import { CreditCard as CreditCardType, BillingInfo } from '../types';
import Spinner from '../components/Spinner';

const GlassmorphicCard: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`bg-black/50 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 ${className}`}>
        {children}
    </div>
);

const CreditCardComponent: React.FC<{ card: CreditCardType, onDelete: (number: string) => Promise<void>, isUpdating: boolean }> = ({ card, onDelete, isUpdating }) => {
    const { t } = useLanguage();
    return (
        <div className={`p-6 rounded-xl text-white relative overflow-hidden h-52 flex flex-col justify-between ${card.isPrimary ? 'bg-gradient-to-br from-blue-700 to-secondary' : 'bg-gray-700'}`}>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-lg">{card.brand}</h4>
                <button onClick={() => onDelete(card.number)} disabled={isUpdating} className="z-10 text-white/70 hover:text-white disabled:opacity-50">
                    <Trash2 size={18} />
                </button>
            </div>
            <div>
                <p className="text-2xl font-mono tracking-widest">{card.number}</p>
                <div className="flex justify-between items-end mt-4 text-sm">
                    <div>
                        <span className="text-xs text-white/70 block">{t('cardHolder')}</span>
                        <span>{card.holder}</span>
                    </div>
                    <div>
                        <span className="text-xs text-white/70 block">{t('expires')}</span>
                        <span>{card.expires}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InvoiceRow: React.FC<{ date: string; id: string; amount: string }> = ({ date, id, amount }) => {
    const { t } = useLanguage();
    return (
        <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg">
            <div>
                <p className="font-bold text-white">{date}</p>
                <p className="text-sm text-dimWhite">#{id}</p>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-dimWhite">{amount}</span>
                <button className="flex items-center gap-1 text-sm text-secondary font-semibold">
                    <Download size={14} /> {t('invoiceActionText')}
                </button>
            </div>
        </div>
    );
};

const BillingInfoItem: React.FC<{ 
    label: string; 
    value: string; 
    itemKey: keyof BillingInfo;
    onEdit: (key: keyof BillingInfo, currentValue: string) => Promise<void>;
    onDelete: (key: keyof BillingInfo) => Promise<void>;
    isUpdating: boolean;
}> = ({ label, value, itemKey, onEdit, onDelete, isUpdating }) => {
    const { t } = useLanguage();
    return (
        <div className="p-3 bg-primary/50 rounded-lg">
            <p className="text-sm font-bold text-dimWhite">{label}</p>
            <div className="flex justify-between items-center">
                <p className="text-white">{value}</p>
                <div className="flex gap-3">
                    <button onClick={() => onDelete(itemKey)} disabled={isUpdating} className="flex items-center text-red-500 gap-1 text-xs font-bold disabled:opacity-50">
                        <Trash2 size={14} /> {t('billingInfoDelete')}
                    </button>
                    <button onClick={() => onEdit(itemKey, value)} disabled={isUpdating} className="flex items-center text-dimWhite gap-1 text-xs font-bold disabled:opacity-50">
                        <Edit size={14} /> {t('billingInfoEdit')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const BillingPage: React.FC = () => {
    const { t } = useLanguage();
    const { user, addCard, deleteCard, updateBillingInfoItem, deleteBillingInfoItem } = useAuth();
    const [isUpdating, setIsUpdating] = useState(false);

    if (!user) {
        return <div className="flex justify-center items-center h-screen"><Spinner size="12"/></div>;
    }

    const handleAddCard = async () => {
        setIsUpdating(true);
        try {
            const newCard = {
                brand: "Mastercard",
                number: `**** **** **** ${Math.floor(1000 + Math.random() * 9000)}`,
                holder: user.profileData.name,
                expires: "08/28",
            };
            await addCard(newCard);
        } catch (error) {
            console.error("Failed to add card:", error);
            alert("Error: Could not add card.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteCard = async (cardNumber: string) => {
        if (window.confirm(`${t('confirmDeleteCard')} ${cardNumber.slice(-4)}?`)) {
            setIsUpdating(true);
            try {
                await deleteCard(cardNumber);
            } catch (error) {
                console.error("Failed to delete card:", error);
                alert("Error: Could not delete card.");
            } finally {
                setIsUpdating(false);
            }
        }
    };

    const handleEditInfo = async (key: keyof BillingInfo, currentValue: string) => {
        const tKey = `billingInfo${key.charAt(0).toUpperCase() + key.slice(1)}` as any;
        const newValue = prompt(`${t('promptNewValueFor')} ${t(tKey)}:`, currentValue);
        if (newValue !== null && newValue.trim() !== '') {
            setIsUpdating(true);
            try {
                await updateBillingInfoItem(key, newValue);
            } catch (error) {
                console.error("Failed to update billing info:", error);
                alert("Error: Could not update billing info.");
            } finally {
                setIsUpdating(false);
            }
        }
    };
    
    const handleDeleteInfo = async (key: keyof BillingInfo) => {
        if (window.confirm(`Are you sure you want to delete this information?`)) {
            setIsUpdating(true);
            try {
                await deleteBillingInfoItem(key);
            } catch (error) {
                console.error("Failed to delete billing info:", error);
                alert("Error: Could not delete billing info.");
            } finally {
                setIsUpdating(false);
            }
        }
    };

    const { profileData } = user;
    const { billingInfo } = profileData;

    return (
        <div className="space-y-8 sm:px-16 px-6 sm:py-12 py-4">
            <h1 className="font-semibold text-4xl md:text-5xl text-white mb-2">{t('billingTitle')}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-3 space-y-8">
                    <GlassmorphicCard className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {profileData.creditCards.map(card => (
                                <CreditCardComponent key={card.number} card={card} onDelete={handleDeleteCard} isUpdating={isUpdating} />
                           ))}
                        </div>
                    </GlassmorphicCard>

                    <GlassmorphicCard className="p-6">
                        <h2 className="text-2xl font-semibold text-white mb-4">{t('paymentMethod')}</h2>
                        <div className="space-y-4">
                            {profileData.creditCards.map(card => (
                                <div key={card.number} className="flex justify-between items-center bg-primary p-4 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <CreditCard size={24} className={card.isPrimary ? "text-secondary" : "text-dimWhite"} />
                                        <span className="font-bold text-white">{card.brand} {card.number}</span>
                                    </div>
                                    <button disabled={isUpdating}><Edit size={20} className="text-dimWhite hover:text-white" /></button>
                                </div>
                            ))}
                            <button onClick={handleAddCard} disabled={isUpdating} className="w-full flex justify-center items-center gap-2 p-4 border-2 border-dashed border-gray-600 rounded-lg text-dimWhite hover:bg-white/10 hover:text-white transition disabled:opacity-50">
                                {isUpdating ? <Spinner size="5" /> : <><PlusCircle size={20} /> {t('addNewCard')}</>}
                            </button>
                        </div>
                    </GlassmorphicCard>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-8">
                    <GlassmorphicCard className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-white">{t('invoices')}</h2>
                            <button className="py-1 px-3 bg-blue-gradient text-primary text-sm font-bold rounded-lg">{t('viewAllInvoices')}</button>
                        </div>
                        <div className="space-y-2">
                            <InvoiceRow date="March, 01, 2024" id="MS-415646" amount="$180" />
                            <InvoiceRow date="February, 10, 2024" id="RV-126749" amount="$250" />
                            <InvoiceRow date="April, 05, 2023" id="FB-212563" amount="$560" />
                        </div>
                    </GlassmorphicCard>
                    
                    <GlassmorphicCard className="p-6">
                        <h2 className="text-2xl font-semibold text-white mb-4">{t('billingInformation')}</h2>
                        <div className="space-y-3">
                            <BillingInfoItem label={t('billingInfoName')} value={billingInfo.name} itemKey="name" onEdit={handleEditInfo} onDelete={handleDeleteInfo} isUpdating={isUpdating} />
                            <BillingInfoItem label={t('billingInfoCompany')} value={billingInfo.company} itemKey="company" onEdit={handleEditInfo} onDelete={handleDeleteInfo} isUpdating={isUpdating} />
                            <BillingInfoItem label={t('billingInfoEmail')} value={billingInfo.email} itemKey="email" onEdit={handleEditInfo} onDelete={handleDeleteInfo} isUpdating={isUpdating} />
                            <BillingInfoItem label={t('billingInfoVat')} value={billingInfo.vat} itemKey="vat" onEdit={handleEditInfo} onDelete={handleDeleteInfo} isUpdating={isUpdating} />
                        </div>
                    </GlassmorphicCard>
                </div>
            </div>
        </div>
    );
};

export default BillingPage;