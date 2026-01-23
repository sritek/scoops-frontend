"use client";

import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Avatar,
} from "@/components/ui";
import { Printer, Download, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface IdCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    photoUrl: string | null;
    batchName: string | null;
    admissionYear: number;
  };
  organization?: {
    name: string;
    logoUrl?: string | null;
  };
  branch?: {
    name: string;
  };
}

/**
 * ID Card Dialog Component
 *
 * Displays a student ID card preview with:
 * - Student photo
 * - Name and batch
 * - QR code for verification
 * - Print functionality
 */
export function IdCardDialog({
  open,
  onOpenChange,
  student,
  organization,
  branch,
}: IdCardDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!cardRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const cardHtml = cardRef.current.innerHTML;
    const orgName = organization?.name ?? "Institution";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ID Card - ${student.fullName}</title>
          <style>
            @page {
              size: 3.375in 2.125in;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .id-card {
              width: 3.375in;
              height: 2.125in;
              padding: 12px;
              box-sizing: border-box;
              border: 2px solid #1e3a5f;
              border-radius: 8px;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            }
            .id-card-header {
              text-align: center;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 6px;
              margin-bottom: 8px;
            }
            .org-name {
              font-size: 12px;
              font-weight: bold;
              color: #1e3a5f;
              text-transform: uppercase;
            }
            .branch-name {
              font-size: 8px;
              color: #64748b;
            }
            .id-card-body {
              display: flex;
              gap: 10px;
            }
            .photo-section {
              flex-shrink: 0;
            }
            .student-photo {
              width: 60px;
              height: 72px;
              border-radius: 4px;
              object-fit: cover;
              border: 1px solid #cbd5e1;
              background-color: #f1f5f9;
            }
            .student-photo-placeholder {
              width: 60px;
              height: 72px;
              border-radius: 4px;
              background-color: #e2e8f0;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
              font-weight: bold;
              color: #64748b;
            }
            .info-section {
              flex: 1;
            }
            .student-name {
              font-size: 12px;
              font-weight: bold;
              color: #0f172a;
              margin-bottom: 4px;
            }
            .info-row {
              font-size: 9px;
              color: #475569;
              margin-bottom: 2px;
            }
            .info-label {
              color: #64748b;
            }
            .qr-section {
              text-align: center;
            }
            .qr-code {
              width: 48px;
              height: 48px;
            }
            .id-card-footer {
              text-align: center;
              font-size: 7px;
              color: #94a3b8;
              margin-top: 6px;
              padding-top: 4px;
              border-top: 1px solid #e2e8f0;
            }
          </style>
        </head>
        <body>
          ${cardHtml}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Wait for images to load before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // QR code data
  const qrData = JSON.stringify({
    type: "student_id",
    id: student.id,
    name: student.fullName,
    batch: student.batchName,
    year: student.admissionYear,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Student ID Card
          </DialogTitle>
          <DialogDescription>
            Preview and print the student ID card.
          </DialogDescription>
        </DialogHeader>

        {/* ID Card Preview */}
        <div className="flex justify-center py-4">
          <div
            ref={cardRef}
            className="id-card w-[324px] bg-gradient-to-br from-white to-slate-100 border-2 border-primary-600 rounded-lg p-3 shadow-lg"
          >
            {/* Header */}
            <div className="id-card-header text-center border-b border-slate-300 pb-2 mb-2">
              <p className="org-name text-sm font-bold text-primary-800 uppercase">
                {organization?.name ?? "Institution Name"}
              </p>
              {branch && (
                <p className="branch-name text-xs text-slate-500">
                  {branch.name}
                </p>
              )}
            </div>

            {/* Body */}
            <div className="id-card-body flex gap-3">
              {/* Photo Section */}
              <div className="photo-section shrink-0">
                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={student.fullName}
                    className="student-photo w-16 h-20 rounded object-cover border border-slate-300"
                  />
                ) : (
                  <div className="student-photo-placeholder w-16 h-20 rounded bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-500">
                    {student.firstName.charAt(0)}
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="info-section flex-1">
                <p className="student-name text-sm font-bold text-slate-900 mb-1">
                  {student.fullName}
                </p>
                <p className="info-row text-xs text-slate-600">
                  <span className="info-label text-slate-400">Batch: </span>
                  {student.batchName || "Not Assigned"}
                </p>
                <p className="info-row text-xs text-slate-600">
                  <span className="info-label text-slate-400">Admission: </span>
                  {student.admissionYear}
                </p>
                <p className="info-row text-xs text-slate-600">
                  <span className="info-label text-slate-400">ID: </span>
                  {student.id.substring(0, 8).toUpperCase()}
                </p>
              </div>

              {/* QR Section */}
              <div className="qr-section shrink-0">
                <QRCodeSVG
                  value={qrData}
                  size={56}
                  level="M"
                  className="qr-code"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="id-card-footer text-center text-[8px] text-slate-400 mt-2 pt-1 border-t border-slate-200">
              This card is the property of {organization?.name ?? "the institution"}.
              If found, please return to the office.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print ID Card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
