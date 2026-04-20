"use client";

import React, { useEffect, useState } from "react";

type OtpVerificationFieldProps = {
  id?: string;
  label?: React.ReactNode;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSendOtp: () => Promise<boolean> | boolean;
  sending?: boolean;
  sendDisabled?: boolean;
  helperText?: string;
  cooldownSeconds?: number;
  className?: string;
  autoStartCooldown?: boolean;
};

const OtpVerificationField = ({
  id = "otp",
  label = "Mã OTP",
  placeholder = "Nhập mã OTP 6 chữ số",
  value,
  onChange,
  onSendOtp,
  sending = false,
  sendDisabled = false,
  helperText,
  cooldownSeconds = 60,
  className = "",
  autoStartCooldown = false,
}: OtpVerificationFieldProps) => {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (autoStartCooldown) {
      setCountdown(cooldownSeconds);
    }
  }, [autoStartCooldown, cooldownSeconds]);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setCountdown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [countdown]);

  const handleSendOtp = async () => {
    const isSuccess = await onSendOtp();
    if (isSuccess) {
      setCountdown(cooldownSeconds);
    }
  };

  const isButtonDisabled = sending || sendDisabled || countdown > 0;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2.5 block">
        {label}
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          name={id}
          id={id}
          inputMode="numeric"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
          className="rounded-lg border border-gray-3 bg-gray-1 placeholder:text-dark-5 flex-grow py-2.5 px-4 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
        />
        <button
          type="button"
          onClick={() => void handleSendOtp()}
          disabled={isButtonDisabled}
          className="min-w-[92px] rounded-lg border border-gray-3 bg-white px-4 py-2.5 text-sm font-medium text-dark transition hover:border-gray-4 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "Đang gửi..." : countdown > 0 ? `${countdown}s` : "Gửi mã"}
        </button>
      </div>

      {helperText ? <p className="mt-2 text-sm text-dark-4">{helperText}</p> : null}
    </div>
  );
};

export default OtpVerificationField;
