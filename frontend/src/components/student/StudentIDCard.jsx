import { useState, useRef } from 'react';
import { Download, CreditCard, Mail, Phone, MapPin, Calendar, User, GraduationCap,Hash,Building,RefreshCw } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Barcode from 'react-barcode';
import { API_ENDPOINTS } from '../../config/api';

const StudentIDCard = ({ studentData }) => {
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const frontCardRef = useRef(null);
  const backCardRef = useRef(null);

  // Generate QR Code data
  const qrCodeData = JSON.stringify({
    admissionNo: studentData.admissionNumber,
    name: studentData.fullName,
    course: studentData.courseCategory,
    batch: studentData.batchType,
    mobile: studentData.mobile,
    email: studentData.email,
    validUntil: new Date(new Date(studentData.admissionDate).setFullYear(new Date(studentData.admissionDate).getFullYear() + 1)).toISOString()
  });

  // Generate unique barcode from admission number
  const barcodeValue = studentData.admissionNumber || 'FV20260001';

  const downloadIDCard = async () => {
    try {
      setGenerating(true);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 53.98] // Standard credit card size
      });

      // Capture front card
      if (frontCardRef.current) {
        const frontCanvas = await html2canvas(frontCardRef.current, {
          scale: 3,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        const frontImgData = frontCanvas.toDataURL('image/png');
        pdf.addImage(frontImgData, 'PNG', 0, 0, 85.6, 53.98);
      }

      // Add new page for back
      pdf.addPage();

      // Capture back card
      if (backCardRef.current) {
        const backCanvas = await html2canvas(backCardRef.current, {
          scale: 3,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        const backImgData = backCanvas.toDataURL('image/png');
        pdf.addImage(backImgData, 'PNG', 0, 0, 85.6, 53.98);
      }

      // Save PDF
      pdf.save(`ID_Card_${studentData.admissionNumber}.pdf`);
    } catch (error) {
      console.error('Error generating ID card:', error);
      alert('Failed to generate ID card. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (!studentData._id) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
        <CreditCard className="w-20 h-20 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Linked</h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Your account is not linked to a student profile yet. Please contact administration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <CreditCard className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Student ID Card</h2>
              <p className="text-indigo-100">Generate and download your digital ID card</p>
            </div>
          </div>
          <button
            onClick={downloadIDCard}
            disabled={generating}
            className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download ID Card</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Toggle */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setShowPreview(true)}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            showPreview
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Front
        </button>
        <button
          onClick={() => setShowPreview(false)}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            !showPreview
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Back
        </button>
      </div>

      {/* ID Card Preview */}
      <div className="flex justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 inline-block">
          {/* Front Side */}
          {showPreview && (
            <div
              ref={frontCardRef}
              className="w-[540px] h-[340px] relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl overflow-hidden shadow-2xl"
              style={{ aspectRatio: '85.6/53.98' }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
              </div>

              {/* Header */}
              <div className="relative z-10 bg-white/95 backdrop-blur-sm px-6 py-4 flex items-center gap-4 border-b-4 border-yellow-400">
                <img 
                  src="/assets/images/finvision-logo.png" 
                  alt="Logo" 
                  className="h-12 w-12 object-contain"
                />
                <div>
                  <h3 className="text-lg font-bold text-indigo-900">FINVISION ACADEMY</h3>
                  <p className="text-xs text-indigo-600 font-medium">Institute of Financial Excellence</p>
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10 p-6 flex gap-6">
                {/* Photo */}
                <div className="flex-shrink-0">
                  {studentData.profilePhoto ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${studentData.profilePhoto}`}
                      alt="Student"
                      className="w-28 h-28 rounded-xl border-4 border-white shadow-xl"
                    />
                  ) : (
                    <div className="w-28 h-28 bg-white rounded-xl flex items-center justify-center border-4 border-white shadow-xl">
                      <User className="w-16 h-16 text-indigo-600" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 text-white space-y-2">
                  <h4 className="text-2xl font-bold mb-3">{studentData.fullName}</h4>
                  
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      <span className="font-semibold">ID:</span>
                      <span className="font-mono">{studentData.admissionNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      <span className="font-semibold">Course:</span>
                      <span>{studentData.courseCategory}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      <span className="font-semibold">Batch:</span>
                      <span>{studentData.batchType} - {studentData.batchSection}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-semibold">Valid Until:</span>
                      <span>
                        {new Date(new Date(studentData.admissionDate).setFullYear(
                          new Date(studentData.admissionDate).getFullYear() + 1
                        )).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex-shrink-0 bg-white p-2 rounded-xl shadow-xl">
                  <QRCodeCanvas
                    value={qrCodeData}
                    size={80}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 bg-yellow-400 text-indigo-900 px-6 py-2 text-xs font-semibold text-center">
                This card is property of Finvision Academy. If found, please return.
              </div>
            </div>
          )}

          {/* Back Side */}
          {!showPreview && (
            <div
              ref={backCardRef}
              className="w-[540px] h-[340px] relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-2xl"
              style={{ aspectRatio: '85.6/53.98' }}
            >
              {/* Header Strip */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-16"></div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Barcode */}
                <div className="bg-white rounded-xl p-3 shadow-lg flex justify-center">
                  <Barcode
                    value={barcodeValue}
                    width={2}
                    height={60}
                    fontSize={14}
                    displayValue={true}
                  />
                </div>

                {/* Contact Details */}
                <div className="bg-white rounded-xl p-4 shadow-lg space-y-3">
                  <h4 className="text-sm font-bold text-indigo-900 mb-2 border-b border-indigo-200 pb-2">
                    CONTACT INFORMATION
                  </h4>
                  <div className="space-y-2 text-xs text-gray-700">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-semibold">Mobile:</span>
                      <span>{studentData.mobile}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-semibold">Email:</span>
                      <span className="truncate">{studentData.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-semibold">City:</span>
                      <span>{studentData.city}</span>
                    </div>
                  </div>
                </div>

                {/* Emergency & Terms */}
                <div className="space-y-2">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                    <p className="text-xs text-red-800 font-semibold">
                      <span className="font-bold">Emergency:</span> +91 98765 43210
                    </p>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2">
                    <p className="text-xs text-indigo-800 leading-relaxed">
                      <span className="font-bold">Terms:</span> This card must be carried at all times on campus. 
                      Loss of card must be reported immediately. Non-transferable.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2">
                <div className="flex justify-between items-center text-xs">
                  <span>www.finvisionacademy.com</span>
                  <span className="font-mono">{studentData.admissionNumber}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          ID Card Instructions
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Click "Download ID Card" to generate a PDF with both front and back sides</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Print on standard credit card size (85.6mm x 53.98mm) plastic or cardstock</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>QR code contains your complete student information for quick verification</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Barcode on the back is your unique admission number in scannable format</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Keep your ID card safe and report immediately if lost or damaged</span>
          </li>
        </ul>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-green-700 font-medium">Admission Date</p>
              <p className="text-lg font-bold text-green-900">
                {new Date(studentData.admissionDate).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Hash className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-purple-700 font-medium">Admission Number</p>
              <p className="text-lg font-bold text-purple-900 font-mono">
                {studentData.admissionNumber}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-orange-700 font-medium">Valid Until</p>
              <p className="text-lg font-bold text-orange-900">
                {new Date(new Date(studentData.admissionDate).setFullYear(
                  new Date(studentData.admissionDate).getFullYear() + 1
                )).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentIDCard;
