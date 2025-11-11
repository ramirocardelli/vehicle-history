import jsPDF from 'jspdf';
import type { Vehicle, ServiceLog } from './types';

export function generateServiceHistoryPDF(vehicle: Vehicle, serviceLogs: ServiceLog[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Helper function to add text with word wrapping
  const addText = (text: string, fontSize: number, isBold: boolean = false, color: number[] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, maxWidth);
    
    // Check if we need a new page
    if (yPos + (lines.length * fontSize * 0.5) > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
    
    doc.text(lines, margin, yPos);
    yPos += lines.length * fontSize * 0.5;
  };

  const addSpace = (space: number) => {
    yPos += space;
  };

  const addLine = () => {
    doc.setDrawColor(14, 165, 164); // #0ea5a4
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
  };

  // Header
  addText('VEHICLE SERVICE HISTORY REPORT', 18, true, [7, 32, 58]);
  addText('Blockchain-Verified Maintenance Records', 10, false, [102, 102, 102]);
  addSpace(5);
  addLine();
  addSpace(5);

  // Vehicle Information
  addText(`${vehicle.make} ${vehicle.model} (${vehicle.year})`, 16, true, [7, 32, 58]);
  addSpace(5);
  
  addText(`VIN: ${vehicle.vin}`, 10, true);
  addText(`Current Mileage: ${vehicle.currentMileage ? vehicle.currentMileage.toLocaleString() + ' miles' : 'N/A'}`, 10);
  addText(`Owner: ${vehicle.ownerAddress}`, 10);
  addSpace(3);
  addText(`Token ID: ${vehicle.tokenId.substring(0, 32)}...`, 9, false, [102, 102, 102]);
  addSpace(5);

  // Blockchain Verification
  doc.setFillColor(230, 247, 247);
  const boxHeight = 25;
  if (yPos + boxHeight > pageHeight - margin) {
    doc.addPage();
    yPos = margin;
  }
  doc.rect(margin, yPos, maxWidth, boxHeight, 'F');
  yPos += 5;
  addText('🔗 BLOCKCHAIN VERIFICATION', 9, true, [14, 165, 164]);
  addText(`https://whatsonchain.com/tx/${vehicle.tokenId.substring(0, 40)}...`, 8, false, [51, 51, 51]);
  if (vehicle.onchainAt) {
    addText(`Created: ${new Date(vehicle.onchainAt).toLocaleString()}`, 8, false, [102, 102, 102]);
  }
  yPos += 5;
  addSpace(10);

  // Service History Header
  addLine();
  addText(`SERVICE HISTORY (${serviceLogs.length} Record${serviceLogs.length !== 1 ? 's' : ''})`, 14, true, [7, 32, 58]);
  addSpace(5);

  if (serviceLogs.length === 0) {
    addText('No service records found for this vehicle.', 10, false, [153, 153, 153]);
  } else {
    // Service Logs
    serviceLogs.forEach((log, index) => {
      // Check if we need a new page for this entry
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = margin;
      }

      // Log entry box
      const entryStartY = yPos;
      
      // Title and Date
      addText(`${index + 1}. ${log.serviceType}`, 12, true, [7, 32, 58]);
      const dateY = yPos - 8;
      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102);
      doc.text(new Date(log.serviceDate).toLocaleDateString(), pageWidth - margin - 40, dateY);
      
      addSpace(2);
      
      // Details
      addText(`Mileage: ${log.mileage.toLocaleString()} miles`, 9);
      if (log.cost) {
        addText(`Cost: $${log.cost.toFixed(2)}`, 9);
      }
      addSpace(3);
      
      // Description
      addText('Description:', 9, true);
      addText(log.description, 9, false, [51, 51, 51]);
      addSpace(3);
      
      // Blockchain Proof
      if (log.txid) {
        doc.setFillColor(240, 249, 255);
        const proofHeight = 20;
        doc.rect(margin, yPos, maxWidth, proofHeight, 'F');
        yPos += 4;
        addText('⛓️ BLOCKCHAIN PROOF', 8, true, [14, 165, 164]);
        addText(`TX: ${log.txid.substring(0, 50)}...`, 7, false, [85, 85, 85]);
        if (log.onchainAt) {
          addText(`Recorded: ${new Date(log.onchainAt).toLocaleString()}`, 7, false, [102, 102, 102]);
        }
        yPos += 4;
      }
      
      // Draw border around entry
      doc.setDrawColor(221, 221, 221);
      doc.setLineWidth(0.3);
      doc.rect(margin, entryStartY, maxWidth, yPos - entryStartY);
      
      addSpace(8);
    });
  }

  // Footer
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = margin;
  }
  addSpace(10);
  addLine();
  addText('Vehicle History Report', 10, true, [0, 0, 0]);
  addText('All service records are permanently stored and verifiable on the BSV blockchain', 9, false, [102, 102, 102]);
  addText(`Report generated: ${new Date().toLocaleString()}`, 9, false, [102, 102, 102]);

  // Save the PDF
  const filename = `vehicle-history-${vehicle.vin}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
