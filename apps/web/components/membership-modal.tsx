"use client";

import { Membership } from "@/lib/types";
import { Check, CreditCard, X } from "lucide-react";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

interface MembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMembership: Membership;
}

export function MembershipModal({
  isOpen,
  onClose,
  currentMembership,
}: MembershipModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    // TODO: Implement Stripe checkout for premium upgrade
    toast.success("Redirecting to upgrade...");
    onClose();
  };

  const handleDowngrade = async () => {
    // TODO: Implement downgrade logic
    toast.success("Downgrade request submitted");
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isFree = currentMembership === Membership.FREE;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="mx-6 w-full max-w-md rounded-xl bg-white shadow-xl"
      >
        {/* Modal Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-5 w-5 text-gray-600" />
            <h2 className="text-base font-medium text-gray-900">
              Manage Subscription
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {isFree ? (
            // Free User - Show Upgrade Options
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-base font-medium text-gray-900">
                  Upgrade to Premium
                </h3>
                <p className="text-sm text-gray-600">
                  Get more storage and faster support.
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={handleUpgrade}
                className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                Upgrade to Premium
              </button>

              {/* Pricing */}
              <div className="py-2">
                <p className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
                  From
                </p>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    $8.99
                  </span>
                  <span className="text-lg text-gray-600">/month</span>
                </div>
                <p className="text-xs text-gray-500">Cancel anytime</p>
              </div>

              {/* Premium Benefits */}
              <div className="space-y-3">
                <ul className="space-y-3 text-sm text-gray-600">
                  <li>
                    <div className="flex items-center space-x-3">
                      <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                      <span>100 GB Storage (vs 15 GB)</span>
                    </div>
                    <div className="mt-0.5 ml-7 text-xs text-gray-500">
                      then $0.10/GB
                    </div>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>Priority Support</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            // Premium User - Show Current Plan and Downgrade Option
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-base font-medium text-gray-900">
                  Premium Subscription
                </h3>
                <p className="text-sm text-gray-600">
                  You&apos;re currently on the Premium plan.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    // TODO: Open billing portal
                    toast.success("Opening billing portal...");
                    onClose();
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Manage Billing
                </button>
                <button
                  onClick={handleDowngrade}
                  className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  Downgrade to Free
                </button>
              </div>

              {/* Billing Info */}
              <div className="py-2">
                <p className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
                  Current Plan
                </p>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    $8.99
                  </span>
                  <span className="text-lg text-gray-600">/month</span>
                </div>
                <p className="text-xs text-gray-500">
                  Next billing:{" "}
                  {new Date(
                    Date.now() + 30 * 24 * 60 * 60 * 1000,
                  ).toLocaleDateString()}
                </p>
              </div>

              {/* Premium Benefits */}
              <div className="space-y-3">
                <ul className="space-y-3 text-sm text-gray-600">
                  <li>
                    <div className="flex items-center space-x-3">
                      <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                      <span>100 GB Storage</span>
                    </div>
                    <div className="mt-0.5 ml-7 text-xs text-gray-500">
                      then $0.10/GB
                    </div>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>Priority Support</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3">
          <p className="text-center text-xs text-gray-500">
            Questions? Contact{" "}
            <a
              href="mailto:support@disposal.space"
              className="text-green-600 hover:underline"
            >
              support@disposal.space
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
