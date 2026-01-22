import React, { useState } from "react";
import { Download, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface BillingManagementProps {
  onManageClick: () => void;
  vaultId: string;
  userId: string;
}

export const BillingManagement: React.FC<BillingManagementProps> = ({ 
  onManageClick,
  vaultId,
  userId 
}) => {
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);

  const handleDownloadInvoice = async () => {
    setIsDownloadingInvoice(true);
    try {
      const result = await axios.get(`/api/invoices?vaultId=${vaultId}&userId=${userId}`)
        .then(res => res.data)
        .catch(err => {
          throw new Error(err.response?.data?.error || "Failed to fetch invoices");
        });

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.invoices && result.invoices.length > 0) {
        const latestInvoice = result.invoices[0];
        
        const invoiceUrl = `/api/invoices/${latestInvoice.id}/download`;
        window.open(invoiceUrl, "_blank");
        toast.success("Invoice downloaded successfully");
      } else {
        toast.info("No invoices found for your subscription");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to download invoice";
      toast.error(message);
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Billing Management</h3>
        <p className="text-gray-600 text-sm mt-0.5">
          Manage your subscription and download invoices
        </p>
      </div>

      <div className="p-6">
        <div className="flex flex-wrap gap-3">
          <button
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
            onClick={onManageClick}
          >
            <FileText className="w-4 h-4" />
            View Subscription Details
          </button>
        </div>
        <p className="text-gray-600 text-sm mt-4 leading-relaxed">
          Download your latest invoice or view detailed subscription information including payment history and billing cycle.
        </p>
      </div>
    </div>
  );
};
