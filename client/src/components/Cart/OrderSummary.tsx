import {
  selectSelectedCartItems,
  selectSelectedTotalPrice,
} from "@/redux/features/cart-slice";
import { useAppSelector } from "@/redux/store";
import React from "react";
import Link from "next/link";

const OrderSummary = () => {
  const cartItems = useAppSelector(selectSelectedCartItems);
  const totalPrice = useAppSelector(selectSelectedTotalPrice);
  const hasSelectedItems = cartItems.length > 0;

  return (
    <div className="lg:max-w-[455px] w-full">
      {/* <!-- order list box --> */}
      <div className="bg-white shadow-1 rounded-[10px]">
        <div className="border-b border-gray-3 py-5 px-4 sm:px-8.5">
          <h3 className="font-medium text-xl text-dark">Tóm tắt đơn hàng</h3>
        </div>

        <div className="pt-2.5 pb-8.5 px-4 sm:px-8.5">
          {/* <!-- title --> */}
          <div className="flex items-center justify-between py-5 border-b border-gray-3">
            <div>
              <h4 className="font-medium text-dark">Sản phẩm</h4>
            </div>
            <div>
              <h4 className="font-medium text-dark text-right">Tạm tính</h4>
            </div>
          </div>

          {/* <!-- product item --> */}
          {cartItems.map((item, key) => (
            <div key={key} className="flex items-center justify-between py-5 border-b border-gray-3">
              <div>
                <p className="text-dark">{item.title}</p>
              </div>
              <div>
                <p className="text-dark text-right">
                  {(item.discountedPrice * item.quantity).toLocaleString("vi-VN")}₫
                </p>
              </div>
            </div>
          ))}

          {/* <!-- total --> */}
          <div className="flex items-center justify-between pt-5">
            <div>
              <p className="font-medium text-lg text-dark">Tổng cộng</p>
              <p className="text-sm text-dark-4">Tính trên các sản phẩm đang được chọn</p>
            </div>
            <div>
              <p className="font-medium text-lg text-dark text-right">
                {totalPrice.toLocaleString("vi-VN")}₫
              </p>
            </div>
          </div>

          {/* <!-- checkout button --> */}
          <Link
            href={hasSelectedItems ? "/checkout" : "#"}
            aria-disabled={!hasSelectedItems}
            className={`mt-7.5 flex w-full justify-center rounded-md px-6 py-3 font-medium ease-out duration-200 ${
              hasSelectedItems
                ? "bg-blue text-white hover:bg-blue-dark"
                : "pointer-events-none bg-gray-3 text-dark-4"
            }`}
          >
            Tiến hành thanh toán
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
