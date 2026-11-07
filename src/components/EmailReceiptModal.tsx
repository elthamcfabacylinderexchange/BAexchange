import React from 'react';
import { X, Printer, Mail, Check } from 'lucide-react';

interface EmailReceiptModalProps {
  receiptId: string | null;
  onClose: () => void;
}

export const EmailReceiptModal: React.FC<EmailReceiptModalProps> = ({ receiptId, onClose }) => {
  if (!receiptId) return null;

  const handlePrint = () => {
    const iframe = document.getElementById('receipt-preview-frame') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-red-500" />
            <span className="font-bold text-sm">Dispatched Email Receipt: {receiptId}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Iframe displaying server rendered HTML */}
        <div className="flex-1 bg-slate-100 p-2 sm:p-4 overflow-hidden">
          <iframe
            id="receipt-preview-frame"
            src={`/api/exchanges/${receiptId}/email-preview`}
            title="Email Receipt Preview"
            className="w-full h-full rounded-xl bg-white border border-slate-300 shadow-inner"
          />
        </div>
      </div>
    </div>
  );
};
