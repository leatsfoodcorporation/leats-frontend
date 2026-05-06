"use client";

import React, { useState } from "react";
import { CartItem } from "./pos-interface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/hooks/useCurrency";

interface CartPanelProps {
  cartItems: CartItem[];
  subtotal: number;
  total: number;
  totalDiscount: number;
  orderDiscountValue: number;
  orderDiscountType: "percentage" | "flat";
  roundingOff: number;
  finalTotal: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onUpdateUOM: (productId: string, uom: string, value: number) => void;
  onRemoveItem: (productId: string) => void;
  onApplyDiscount: (
    productId: string,
    discount: number,
    discountType: "percentage" | "flat"
  ) => void;
  onApplyOrderDiscount: (
    discount: number,
    discountType: "percentage" | "flat"
  ) => void;
  onClearCart: () => void;
  onHoldOrder: () => void;
  onCheckout: () => void;
  formatCurrency: (
    amount: number,
    options?: { showSymbol?: boolean; showCode?: boolean; precision?: number }
  ) => string;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  cartItems,
  subtotal,
  total,
  totalDiscount,
  orderDiscountValue: currentOrderDiscountValue,
  orderDiscountType: currentOrderDiscountType,
  roundingOff,
  finalTotal,
  onUpdateQuantity,
  onUpdateUOM,
  onRemoveItem,
  onApplyDiscount,
  onApplyOrderDiscount,
  onClearCart,
  onHoldOrder,
  onCheckout,
  formatCurrency,
}) => {
  const [editingDiscount, setEditingDiscount] = useState<string | null>(null);
  const [discountStates, setDiscountStates] = useState<
    Record<string, { type: "percentage" | "flat"; value: number }>
  >({});
  const [editingOrderDiscount, setEditingOrderDiscount] = useState(false);
  const [localOrderDiscountValue, setLocalOrderDiscountValue] =
    useState<number>(0);
  const [localOrderDiscountType, setLocalOrderDiscountType] = useState<
    "percentage" | "flat"
  >("flat");

  const currencySymbol = useCurrency();

  return (
    <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Cart Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Current Order
          </h2>
          {cartItems.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Clear All
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
        </p>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <svg
              className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">Cart is empty</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Add products to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cartItems.map((item) => {
              const itemTotal = item.price * item.quantity;

              // Calculate discount based on type
              let discountAmount = 0;
              if (item.discount && item.discount > 0) {
                if (item.discountType === "flat") {
                  discountAmount = item.discount;
                } else {
                  // percentage
                  discountAmount = (itemTotal * item.discount) / 100;
                }
              }

              const finalPrice = itemTotal - discountAmount;

              return (
                <div
                  key={item.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(item.price)} each
                      </p>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity - 1)
                      }
                      className="w-8 h-8 rounded-lg bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-500"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 12H4"
                        />
                      </svg>
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        onUpdateQuantity(item.id, parseInt(e.target.value) || 1)
                      }
                      className="w-16 h-8 text-center rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      min="1"
                      max={item.stock}
                    />
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity + 1)
                      }
                      className="w-8 h-8 rounded-lg bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-500"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Multi-UOM Selection */}
                  {((item.availableUoms && item.availableUoms.length > 0) || (item.uomVariants && item.uomVariants.length > 0)) && (
                    <div className="space-y-2 mb-2 p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600">
                      {/* Predefined Variants Dropdown */}
                      {item.uomVariants && item.uomVariants.length > 0 && (
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400">Select Variant</label>
                          <select
                            value={`${item.variantUom}-${item.variantUomValue}`}
                            onChange={(e) => {
                              const [uom, valStr] = e.target.value.split('-');
                              onUpdateUOM(item.id, uom, parseFloat(valStr));
                            }}
                            className="w-full text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-1.5"
                          >
                            <option value={`${item.uom}-${1}`}>Default ({item.uom})</option>
                            {item.uomVariants.map((v, i) => (
                              <option key={i} value={`${v.uom}-${v.value}`}>
                                {v.value}{v.uom} - {formatCurrency(v.price)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Manual Override (if no variants or for fine-tuning) */}
                      {(!item.uomVariants || item.uomVariants.length === 0) && (
                        <div className="flex items-center gap-2">
                          <select
                            value={item.variantUom}
                            onChange={(e) => onUpdateUOM(item.id, e.target.value, item.variantUomValue || 1)}
                            className="text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-1"
                          >
                            {item.availableUoms?.map((uom) => (
                              <option key={uom} value={uom}>
                                {uom}
                              </option>
                            ))}
                          </select>
                          <div className="flex-1 flex items-center gap-1">
                            <Input
                              type="number"
                              value={item.variantUomValue || 1}
                              onChange={(e) => onUpdateUOM(item.id, item.variantUom || item.baseUom || "pcs", parseFloat(e.target.value) || 1)}
                              className="h-7 text-xs"
                              placeholder="Value"
                            />
                            <span className="text-[10px] text-gray-500">{item.variantUom}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Discount */}
                  <div className="flex items-center justify-between">
                    {editingDiscount === item.id ? (
                      <div className="flex flex-col gap-2 flex-1 mr-2">
                        <div className="flex items-center gap-2">
                          <select
                            value={
                              discountStates[item.id]?.type || "percentage"
                            }
                            onChange={(e) => {
                              e.stopPropagation();
                              const newType = e.target.value as
                                | "percentage"
                                | "flat";
                              setDiscountStates({
                                ...discountStates,
                                [item.id]: {
                                  type: newType,
                                  value: discountStates[item.id]?.value || 0,
                                },
                              });
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            className="h-7 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 cursor-pointer"
                          >
                            <option value="percentage">%</option>
                            <option value="flat">{currencySymbol}</option>
                          </select>
                          <Input
                            type="number"
                            placeholder={
                              discountStates[item.id]?.type === "percentage"
                                ? "%"
                                : "Amount"
                            }
                            value={discountStates[item.id]?.value || ""}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value) || 0;
                              setDiscountStates({
                                ...discountStates,
                                [item.id]: {
                                  type:
                                    discountStates[item.id]?.type ||
                                    "percentage",
                                  value: newValue,
                                },
                              });
                            }}
                            onBlur={(e) => {
                              // Don't close if clicking on the select dropdown
                              const relatedTarget =
                                e.relatedTarget as HTMLElement;
                              if (
                                relatedTarget &&
                                relatedTarget.tagName === "SELECT"
                              ) {
                                return;
                              }

                              const state = discountStates[item.id];
                              if (state && state.value > 0) {
                                onApplyDiscount(
                                  item.id,
                                  state.value,
                                  state.type
                                );
                              }
                              setEditingDiscount(null);
                              // Clean up state for this item
                              const newStates = { ...discountStates };
                              delete newStates[item.id];
                              setDiscountStates(newStates);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const state = discountStates[item.id];
                                if (state && state.value > 0) {
                                  onApplyDiscount(
                                    item.id,
                                    state.value,
                                    state.type
                                  );
                                }
                                setEditingDiscount(null);
                                // Clean up state for this item
                                const newStates = { ...discountStates };
                                delete newStates[item.id];
                                setDiscountStates(newStates);
                              } else if (e.key === "Escape") {
                                setEditingDiscount(null);
                                // Clean up state for this item
                                const newStates = { ...discountStates };
                                delete newStates[item.id];
                                setDiscountStates(newStates);
                              }
                            }}
                            className="h-7 w-20 text-xs"
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingDiscount(item.id);
                          setDiscountStates({
                            ...discountStates,
                            [item.id]: {
                              type: item.discountType || "percentage",
                              value: item.discount || 0,
                            },
                          });
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        {item.discount && item.discount > 0
                          ? item.discountType === "flat"
                            ? `${formatCurrency(item.discount)} off`
                            : `${item.discount}% off`
                          : "Add discount"}
                      </button>
                    )}
                    <div className="text-right">
                      {item.discount && item.discount > 0 && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatCurrency(itemTotal)}
                        </p>
                      )}
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(finalPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Summary */}
      {cartItems.length > 0 && (
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 space-y-4 bg-white dark:bg-gray-800">
          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(subtotal)}
              </span>
            </div>

            {/* Additional Order Discount */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Order Discount
              </span>
              {editingOrderDiscount ? (
                <div className="flex items-center gap-2">
                  <select
                    value={localOrderDiscountType}
                    onChange={(e) => {
                      e.stopPropagation();
                      setLocalOrderDiscountType(
                        e.target.value as "percentage" | "flat"
                      );
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="h-6 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-1 cursor-pointer"
                  >
                    <option value="percentage">%</option>
                    <option value="flat">{currencySymbol}</option>
                  </select>
                  <Input
                    type="number"
                    placeholder="0"
                    value={localOrderDiscountValue || ""}
                    onChange={(e) =>
                      setLocalOrderDiscountValue(
                        parseFloat(e.target.value) || 0
                      )
                    }
                    onBlur={(e) => {
                      // Don't close if clicking on the select dropdown
                      const relatedTarget = e.relatedTarget as HTMLElement;
                      if (relatedTarget && relatedTarget.tagName === "SELECT") {
                        return;
                      }

                      onApplyOrderDiscount(
                        localOrderDiscountValue,
                        localOrderDiscountType
                      );
                      setEditingOrderDiscount(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onApplyOrderDiscount(
                          localOrderDiscountValue,
                          localOrderDiscountType
                        );
                        setEditingOrderDiscount(false);
                      } else if (e.key === "Escape") {
                        setEditingOrderDiscount(false);
                        setLocalOrderDiscountValue(currentOrderDiscountValue);
                      }
                    }}
                    className="h-6 w-16 text-xs"
                  />
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingOrderDiscount(true);
                    setLocalOrderDiscountType(currentOrderDiscountType);
                    setLocalOrderDiscountValue(currentOrderDiscountValue);
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  {totalDiscount > 0
                    ? currentOrderDiscountType === "flat"
                      ? `-${formatCurrency(totalDiscount)}`
                      : `-${formatCurrency(
                          totalDiscount
                        )} (${currentOrderDiscountValue}%)`
                    : "Add"}
                </button>
              )}
            </div>

            <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Total</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(total)}
              </span>
            </div>

            {/* Rounding Off */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Rounding Off
              </span>
              <span
                className={`font-medium ${
                  roundingOff >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {roundingOff >= 0 ? "+" : ""}
                {formatCurrency(Math.abs(roundingOff))}
              </span>
            </div>

            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-900 dark:text-white">Final Total</span>
              <span className="text-primary">{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={onHoldOrder}
              variant="outline"
              className="flex-1 h-12"
              size="lg"
            >
              Hold Order
            </Button>
            <Button
              onClick={onCheckout}
              className="flex-1 h-12 text-lg font-semibold"
              size="lg"
            >
              Proceed to Payment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
