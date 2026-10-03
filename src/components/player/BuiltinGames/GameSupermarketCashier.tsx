import React, { useState, useEffect, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { ShoppingCart, Check, RotateCcw, Barcode } from 'lucide-react';

interface GroceryItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
}

const STORE_ITEMS: GroceryItem[] = [
  { id: 'item-milk', name: 'Fresh Milk', price: 3.5, emoji: '🥛' },
  { id: 'item-bread', name: 'Artisan Bread', price: 2.25, emoji: '🍞' },
  { id: 'item-apple', name: 'Red Apples', price: 1.75, emoji: '🍎' },
  { id: 'item-chips', name: 'Crispy Chips', price: 2.5, emoji: '🥔' },
  { id: 'item-soda', name: 'Sparkling Soda', price: 1.5, emoji: '🥤' },
  { id: 'item-cheese', name: 'Cheddar Block', price: 4.0, emoji: '🧀' },
];

export const GameSupermarketCashier: React.FC<{ title?: string; onScoreUpdate?: (score: number) => void }> = ({
  title = 'Supermarket Simulator',
  onScoreUpdate,
}) => {
  const [cart, setCart] = useState<GroceryItem[]>([]);
  const [scannedItems, setScannedItems] = useState<string[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [customersServed, setCustomersServed] = useState(0);

  const spawnCustomer = useCallback(() => {
    // Pick 3-4 random items
    const count = 3 + Math.floor(Math.random() * 2);
    const customerCart: GroceryItem[] = [];
    for (let i = 0; i < count; i++) {
      customerCart.push(STORE_ITEMS[Math.floor(Math.random() * STORE_ITEMS.length)]);
    }
    setCart(customerCart);
    setScannedItems([]);
  }, []);

  useEffect(() => {
    spawnCustomer();
  }, [spawnCustomer]);

  const scanItem = (uniqueIdx: number, item: GroceryItem) => {
    const key = `${uniqueIdx}`;
    if (scannedItems.includes(key)) return;

    playSound('point'); // Register beep
    const nextScanned = [...scannedItems, key];
    setScannedItems(nextScanned);

    // If all items scanned in customer's cart
    if (nextScanned.length === cart.length) {
      playSound('win');
      confetti({ particleCount: 30, spread: 40 });
      const cartTotal = cart.reduce((sum, it) => sum + it.price, 0);
      const nextRev = totalRevenue + cartTotal;
      setTotalRevenue(nextRev);
      setCustomersServed(c => c + 1);
      if (onScoreUpdate) onScoreUpdate(Math.round(nextRev * 10));
      setTimeout(spawnCustomer, 700);
    }
  };

  const currentTotal = cart
    .filter((_, idx) => scannedItems.includes(`${idx}`))
    .reduce((sum, it) => sum + it.price, 0);

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-md mx-auto text-neutral-100 select-none">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          <p className="text-xs text-neutral-400">Scan customer groceries across the checkout counter</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Customers</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">{customersServed}</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Revenue</span>
            <span className="text-sm font-bold font-mono tabular-nums text-emerald-400">${totalRevenue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* POS Register Screen */}
      <div className="relative w-full aspect-square max-w-[340px] bg-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-2xl flex flex-col justify-between">
        {/* Cash Register Display */}
        <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Register #1 Active
            </span>
          </div>
          <span className="text-base font-bold font-mono text-emerald-400">
            ${currentTotal.toFixed(2)}
          </span>
        </div>

        {/* Conveyor Belt with Grocery Items */}
        <div className="flex-1 my-3 bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 flex flex-col justify-center">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold block mb-2 text-center">
            Tap items to scan barcodes:
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            {cart.map((item, idx) => {
              const isScanned = scannedItems.includes(`${idx}`);
              return (
                <button
                  key={`${item.id}-${idx}`}
                  onClick={() => scanItem(idx, item)}
                  disabled={isScanned}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    isScanned
                      ? 'bg-emerald-950/40 border-emerald-500/50 opacity-50 scale-95'
                      : 'bg-neutral-800 hover:bg-neutral-750 border-neutral-700 hover:scale-102 shadow-md cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="text-left">
                      <span className="text-xs font-bold text-white block">{item.name}</span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {isScanned && <Check className="w-4 h-4 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-center text-[11px] text-neutral-400 font-mono">
          Items left in basket: {cart.length - scannedItems.length}
        </div>
      </div>
    </div>
  );
};
