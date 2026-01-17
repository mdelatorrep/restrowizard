import { useState, useMemo, useCallback } from 'react';

export interface POSCartItem {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: string[];
  notes?: string;
  discount_percent?: number;
  discount_amount?: number;
}

export interface POSCart {
  items: POSCartItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  discountName: string | null;
  taxRate: number;
  taxAmount: number;
  tipAmount: number;
  tipPercent: number;
  total: number;
}

export const usePOSCart = (taxRate: number = 0) => {
  const [items, setItems] = useState<POSCartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountName, setDiscountName] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState(0);
  const [tipPercent, setTipPercent] = useState(0);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      let itemTotal = item.price * item.quantity;
      if (item.discount_percent) {
        itemTotal -= itemTotal * (item.discount_percent / 100);
      }
      if (item.discount_amount) {
        itemTotal -= item.discount_amount;
      }
      return sum + itemTotal;
    }, 0);
  }, [items]);

  const calculatedDiscountAmount = useMemo(() => {
    if (discountAmount > 0) return discountAmount;
    if (discountPercent > 0) return subtotal * (discountPercent / 100);
    return 0;
  }, [subtotal, discountAmount, discountPercent]);

  const subtotalAfterDiscount = subtotal - calculatedDiscountAmount;
  
  const taxAmount = useMemo(() => {
    return subtotalAfterDiscount * (taxRate / 100);
  }, [subtotalAfterDiscount, taxRate]);

  const calculatedTipAmount = useMemo(() => {
    if (tipAmount > 0) return tipAmount;
    if (tipPercent > 0) return subtotalAfterDiscount * (tipPercent / 100);
    return 0;
  }, [subtotalAfterDiscount, tipAmount, tipPercent]);

  const total = useMemo(() => {
    return subtotalAfterDiscount + taxAmount + calculatedTipAmount;
  }, [subtotalAfterDiscount, taxAmount, calculatedTipAmount]);

  const addItem = useCallback((item: Omit<POSCartItem, 'id' | 'quantity'>, quantity: number = 1) => {
    setItems(prev => {
      // Check if item already exists (same menu_item_id and no special modifiers/notes)
      const existingIndex = prev.findIndex(
        i => i.menu_item_id === item.menu_item_id && 
             !i.modifiers?.length && 
             !i.notes &&
             !item.modifiers?.length &&
             !item.notes
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      }

      return [...prev, {
        ...item,
        id: crypto.randomUUID(),
        quantity
      }];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
  }, [removeItem]);

  const updateItemNotes = useCallback((itemId: string, notes: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, notes } : item
    ));
  }, []);

  const applyItemDiscount = useCallback((itemId: string, discountPercent: number) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, discount_percent: discountPercent } : item
    ));
  }, []);

  const applyDiscount = useCallback((name: string, type: 'percent' | 'fixed', value: number) => {
    setDiscountName(name);
    if (type === 'percent') {
      setDiscountPercent(value);
      setDiscountAmount(0);
    } else {
      setDiscountAmount(value);
      setDiscountPercent(0);
    }
  }, []);

  const removeDiscount = useCallback(() => {
    setDiscountName(null);
    setDiscountPercent(0);
    setDiscountAmount(0);
  }, []);

  const applyTip = useCallback((type: 'percent' | 'fixed', value: number) => {
    if (type === 'percent') {
      setTipPercent(value);
      setTipAmount(0);
    } else {
      setTipAmount(value);
      setTipPercent(0);
    }
  }, []);

  const removeTip = useCallback(() => {
    setTipPercent(0);
    setTipAmount(0);
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscountPercent(0);
    setDiscountAmount(0);
    setDiscountName(null);
    setTipAmount(0);
    setTipPercent(0);
  }, []);

  const cart: POSCart = {
    items,
    subtotal,
    discountAmount: calculatedDiscountAmount,
    discountPercent,
    discountName,
    taxRate,
    taxAmount,
    tipAmount: calculatedTipAmount,
    tipPercent,
    total
  };

  return {
    cart,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    addItem,
    removeItem,
    updateItemQuantity,
    updateItemNotes,
    applyItemDiscount,
    applyDiscount,
    removeDiscount,
    applyTip,
    removeTip,
    clearCart,
    subtotal,
    discountAmount: calculatedDiscountAmount,
    taxAmount,
    tipAmount: calculatedTipAmount,
    total
  };
};
