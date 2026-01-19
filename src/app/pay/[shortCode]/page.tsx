"use client";

import { useParams } from "next/navigation";
import { usePublicPaymentLink } from "@/lib/api";
import { Button, Card, CardContent, CardHeader, CardTitle, Spinner } from "@/components/ui";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, AlertTriangle, ExternalLink } from "lucide-react";

/**
 * Public Payment Page
 * No authentication required - accessible via short link
 */
export default function PaymentPage() {
  const params = useParams();
  const shortCode = params.shortCode as string;
  
  const { data: paymentLink, isLoading, error } = usePublicPaymentLink(shortCode);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !paymentLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Link Not Found</h1>
            <p className="text-gray-600">
              This payment link may have expired or been cancelled. Please contact the school for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(paymentLink.expiresAt) < new Date();
  const isPaid = paymentLink.status === "paid";
  const isCancelled = paymentLink.status === "cancelled";

  // Status banner based on payment link status
  const renderStatus = () => {
    if (isPaid) {
      return (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
            <div>
              <h3 className="font-semibold text-green-800">Payment Completed</h3>
              <p className="text-sm text-green-700">This fee has already been paid. Thank you!</p>
            </div>
          </div>
        </div>
      );
    }

    if (isCancelled) {
      return (
        <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mb-6">
          <div className="flex items-center">
            <XCircle className="w-6 h-6 text-gray-600 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-800">Payment Link Cancelled</h3>
              <p className="text-sm text-gray-700">This payment link is no longer active.</p>
            </div>
          </div>
        </div>
      );
    }

    if (isExpired) {
      return (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
          <div className="flex items-center">
            <Clock className="w-6 h-6 text-amber-600 mr-3" />
            <div>
              <h3 className="font-semibold text-amber-800">Payment Link Expired</h3>
              <p className="text-sm text-amber-700">Please contact the school for a new payment link.</p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const canPay = paymentLink.status === "active" && !isExpired;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Organization Header */}
        <div className="text-center mb-8">
          {paymentLink.organization?.logoUrl ? (
            <img
              src={paymentLink.organization.logoUrl}
              alt={paymentLink.organization.name}
              className="h-16 mx-auto mb-4 object-contain"
            />
          ) : (
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">
                {paymentLink.organization?.name?.charAt(0) || "S"}
              </span>
            </div>
          )}
          <h1 className="text-xl font-semibold text-gray-900">
            {paymentLink.organization?.name || "School Fee Payment"}
          </h1>
        </div>

        {/* Payment Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="text-center">
              <div className="text-3xl font-bold mb-1">₹{paymentLink.amount.toLocaleString("en-IN")}</div>
              <div className="text-sm opacity-90">Fee Payment</div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            {renderStatus()}

            {/* Payment Details */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Student Name</span>
                <span className="font-medium text-gray-900">{paymentLink.student.name}</span>
              </div>
              
              {paymentLink.student.batchName && (
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Class/Batch</span>
                  <span className="font-medium text-gray-900">{paymentLink.student.batchName}</span>
                </div>
              )}
              
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Fee Type</span>
                <span className="font-medium text-gray-900">{paymentLink.feePlan}</span>
              </div>
              
              {paymentLink.description && (
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Description</span>
                  <span className="font-medium text-gray-900 text-right max-w-[200px]">
                    {paymentLink.description}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between py-3">
                <span className="text-gray-600">Valid Until</span>
                <span className={`font-medium ${isExpired ? "text-red-600" : "text-gray-900"}`}>
                  {format(new Date(paymentLink.expiresAt), "dd MMM yyyy, hh:mm a")}
                </span>
              </div>
            </div>

            {/* Pay Button */}
            {canPay && (
              <>
                {paymentLink.razorpayUrl ? (
                  <a
                    href={paymentLink.razorpayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button className="w-full h-14 text-lg bg-green-600 hover:bg-green-700">
                      <span>Pay Now</span>
                      <ExternalLink className="w-5 h-5 ml-2" />
                    </Button>
                  </a>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                    <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                    <p className="text-sm text-amber-800">
                      Online payment is not available. Please contact the school to make the payment.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Help Text */}
            <p className="text-xs text-gray-500 text-center mt-6">
              Secure payment powered by Razorpay. For any issues, contact the school administration.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
