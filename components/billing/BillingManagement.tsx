import React, { useState } from "react";
import { Download, Settings, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { createStripePortalSession, getInvoices } from "@/actions/stripe-action";

interface BillingManagementProps {
  onManageClick: () => void;
}

export const BillingManagement: React.FC<BillingManagementProps> = ({ onManageClick }) => {
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const handleDownloadInvoice = async () => {
    setIsDownloadingInvoice(true);
    try {
      const result = await getInvoices();

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.invoices && result.invoices.length > 0) {
        const latestInvoice = result.invoices[0];
        
        if (latestInvoice.pdf) {
          window.open(latestInvoice.pdf, "_blank");
          toast.success("Invoice PDF opened in new tab");
        } else if (latestInvoice.hostedUrl) {
          window.open(latestInvoice.hostedUrl, "_blank");
          toast.success("Invoice page opened in new tab");
        } else {
          toast.error("Invoice not available for download");
        }
      } else {
        toast.info("No invoices found");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to download invoice";
      toast.error(message);
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    setIsOpeningPortal(true);
    try {
      const result = await createStripePortalSession();

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to open billing portal";
      toast.error(message);
      setIsOpeningPortal(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-700 bg-gray-800/50">
        <h3 className="text-lg font-semibold text-white">Billing Management</h3>
        <p className="text-gray-500 text-xs mt-0.5">
          Manage payment methods and download invoices
        </p>
      </div>

      <div className="p-6">
        <div className="flex flex-wrap gap-3">
          <button
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 border border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDownloadInvoice}
            disabled={isDownloadingInvoice}
          >
            {isDownloadingInvoice ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Latest Invoice
              </>
            )}
          </button>

          <button
            className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleOpenBillingPortal}
            disabled={isOpeningPortal}
          >
            {isOpeningPortal ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Opening...
              </>
            ) : (
              <>
                <Settings className="w-4 h-4" />
                Manage in Stripe Portal
              </>
            )}
          </button>

          <button
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 border border-purple-600"
            onClick={onManageClick}
          >
            <FileText className="w-4 h-4" />
            View Subscription Details
          </button>
        </div>
        <p className="text-gray-400 text-xs mt-3">
          Download your latest invoice or manage your subscription, payment methods, and billing
          history through the Stripe portal.
        </p>
      </div>
    </div>
  );
};
