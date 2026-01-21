"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Download, IdCard } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import {
  Card,
  CardContent,
  Skeleton,
  Avatar,
  Button,
} from "@/components/ui";
import { getChildIdCard, type ChildIdCard } from "@/lib/api/parent";

/**
 * ID Card component that can be captured as image
 */
function StudentIdCard({ data }: { data: ChildIdCard }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-sm mx-auto">
      {/* Header with school info */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4">
        <div className="flex items-center gap-3">
          {data.orgLogoUrl ? (
            <img
              src={data.orgLogoUrl}
              alt={data.orgName}
              className="w-12 h-12 rounded-full bg-white p-1 object-contain"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <IdCard className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg truncate">{data.orgName}</h2>
            <p className="text-sm text-primary-100 truncate">{data.branchName}</p>
          </div>
        </div>
      </div>

      {/* Student info */}
      <div className="p-4">
        <div className="flex gap-4">
          {/* Photo */}
          <div className="flex-shrink-0">
            <Avatar
              src={data.photoUrl ?? undefined}
              fallback={`${data.firstName.charAt(0)}${data.lastName.charAt(0)}`}
              alt={`${data.firstName} ${data.lastName}`}
              size="xl"
              className="border-2 border-primary-200"
            />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900">
              {data.firstName} {data.lastName}
            </h3>
            <div className="mt-2 space-y-1 text-sm">
              <p className="text-gray-600">
                <span className="font-medium text-gray-700">Class:</span>{" "}
                {data.batchName || "Not assigned"}
              </p>
              <p className="text-gray-600">
                <span className="font-medium text-gray-700">Admission:</span>{" "}
                {data.admissionYear}
              </p>
              <p className="text-gray-600">
                <span className="font-medium text-gray-700">ID:</span>{" "}
                <span className="font-mono text-xs">{data.studentId.slice(0, 8).toUpperCase()}</span>
              </p>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
          <div className="bg-white p-2 rounded-lg shadow-inner">
            <QRCodeSVG
              value={data.qrData}
              size={80}
              level="M"
              includeMargin={false}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-2 text-center">
        <p className="text-xs text-gray-500">
          This is a digital student ID card
        </p>
      </div>
    </div>
  );
}

/**
 * Loading skeleton
 */
function IdCardPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="flex justify-center">
        <Skeleton className="h-96 w-80" />
      </div>
    </div>
  );
}

/**
 * Child ID Card Page
 *
 * Shows a digital ID card with student info and QR code
 * Includes download functionality
 */
export default function ChildIdCardPage() {
  const params = useParams();
  const studentId = params.id as string;
  const cardRef = useRef<HTMLDivElement>(null);

  // Fetch ID card data
  const {
    data: idCardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["parent", "children", studentId, "id-card"],
    queryFn: () => getChildIdCard(studentId),
    enabled: !!studentId,
  });

  // Download card as image
  const handleDownload = useCallback(async () => {
    if (!cardRef.current || !idCardData) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#ffffff",
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `${idCardData.firstName}-${idCardData.lastName}-ID-Card.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Failed to download ID card:", err);
    }
  }, [idCardData]);

  if (isLoading) {
    return <IdCardPageSkeleton />;
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-error mb-2">Failed to load ID card</p>
        <p className="text-sm text-text-muted">
          {error instanceof Error ? error.message : "Please try again later"}
        </p>
      </div>
    );
  }

  if (!idCardData) {
    return (
      <div className="py-8 text-center">
        <IdCard className="h-12 w-12 mx-auto text-text-muted mb-3" />
        <p className="text-text-muted">ID card data not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/parent/children/${studentId}`}
            className="p-1.5 rounded-lg hover:bg-bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-text-muted" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">ID Card</h1>
            <p className="text-sm text-text-muted">
              {idCardData.firstName}&apos;s digital ID
            </p>
          </div>
        </div>
        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>

      {/* ID Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-6 bg-gray-100">
          <div ref={cardRef}>
            <StudentIdCard data={idCardData} />
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <div className="text-center text-sm text-text-muted">
        <p>Tap &quot;Download&quot; to save this ID card as an image</p>
      </div>
    </div>
  );
}
