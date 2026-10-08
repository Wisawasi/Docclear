/**
 * Generates realistic high-quality sample documents on surfaces (desks, shadows, folds)
 * for instant testing of document background removal, desk unwarping, and signature extraction.
 */

export interface SampleDoc {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  generator: () => Promise<string>;
}

export async function createContractSample(): Promise<string> {
  const width = 1200;
  const height = 1500;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Draw Wooden Desk Background
  const deskGrad = ctx.createLinearGradient(0, 0, width, height);
  deskGrad.addColorStop(0, '#543d2b');
  deskGrad.addColorStop(0.5, '#422c1c');
  deskGrad.addColorStop(1, '#2c1c11');
  ctx.fillStyle = deskGrad;
  ctx.fillRect(0, 0, width, height);

  // Wood grain lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 3;
  for (let i = 0; i < height; i += 24) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.bezierCurveTo(width * 0.3, i + 8, width * 0.7, i - 8, width, i + 4);
    ctx.stroke();
  }

  // 2. Draw Paper Shadow on Desk
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-0.035); // Slight tilt as if placed naturally on table

  const paperW = 860;
  const paperH = 1200;
  const px = -paperW / 2;
  const py = -paperH / 2;

  // Cast shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 35;
  ctx.shadowOffsetX = 18;
  ctx.shadowOffsetY = 22;

  // Paper base color (slightly aged ivory/warm paper)
  const paperGrad = ctx.createLinearGradient(px, py, px + paperW, py + paperH);
  paperGrad.addColorStop(0, '#faf7f0');
  paperGrad.addColorStop(0.5, '#f5f0e4');
  paperGrad.addColorStop(1, '#e8ded0');
  ctx.fillStyle = paperGrad;
  ctx.fillRect(px, py, paperW, paperH);

  // Reset shadow for paper content
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // 3. Document Content
  ctx.fillStyle = '#222326';
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px "Prompt", sans-serif';
  ctx.fillText('หนังสือสัญญาจ้างบริการและการรักษาความลับ', 0, py + 90);

  ctx.font = '18px "Prompt", sans-serif';
  ctx.fillStyle = '#44464b';
  ctx.fillText('เลขที่เอกสาร: DOC-2026/098-TH | วันที่ 15 ตุลาคม 2568', 0, py + 125);

  // Divider line
  ctx.strokeStyle = '#2b2c30';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px + 60, py + 150);
  ctx.lineTo(px + paperW - 60, py + 150);
  ctx.stroke();

  // Paragraphs
  ctx.textAlign = 'left';
  ctx.font = '16px "Prompt", sans-serif';
  ctx.fillStyle = '#2a2b2f';

  const lines = [
    'สัญญานี้ทำขึ้นระหว่าง บริษัท โซลูชั่น ดิจิทัล ครีเอทีฟ จำกัด (ต่อไปนี้เรียกว่า "ผู้ว่าจ้าง")',
    'ฝ่ายหนึ่ง กับ นายพัฒนพงษ์ เกียรติสกุลชัย (ต่อไปนี้เรียกว่า "ผู้รับจ้าง") อีกฝ่ายหนึ่ง',
    'โดยทั้งสองฝ่ายได้ตกลงทำความเข้าใจและยินยอมผูกพันตามข้อกำหนดและเงื่อนไขดังต่อไปนี้:',
    '',
    'ข้อ 1. วัตถุประสงค์แห่งสัญญา',
    'ผู้ว่าจ้างตกลงมอบหมายและผู้รับจ้างตกลงรับปฏิบัติหน้าที่การพัฒนาระบบซอฟต์แวร์ประมวลผล',
    'ปัญญาประดิษฐ์และระบบคลาวด์ พร้อมทั้งให้คำปรึกษาทางเทคนิคตามขอบเขตงานที่ระบุในเอกสารแนบ',
    '',
    'ข้อ 2. ค่าตอบแทนและการจ่ายเงิน',
    'ผู้ว่าจ้างตกลงจ่ายค่าจ้างเป็นจำนวนเงินทั้งสิ้น 185,000 บาท (หนึ่งแสนแปดหมื่นห้าพันบาทถ้วน)',
    'แบ่งชำระเป็น 3 งวด ตามการส่งมอบงานและผ่านการตรวจรับจากคณะกรรมการตรวจรับพัสดุ',
    '',
    'ข้อ 3. การรักษาความลับทางการค้าและทรัพย์สินทางปัญญา',
    'ข้อมูลใดๆ ข้อมูลซอร์สโค้ด สูตร วิธีการ หรือแบบแผนการดำเนินงาน ถือเป็นความลับสูงสุด',
    'ห้ามมิให้คู่สัญญาฝ่ายใดนำไปเปิดเผยต่อบุคคลภายนอกโดยไม่ได้รับความยินยอมเป็นลายลักษณ์อักษร'
  ];

  let currentY = py + 200;
  for (const line of lines) {
    if (line.startsWith('ข้อ')) {
      ctx.font = 'bold 17px "Prompt", sans-serif';
      ctx.fillText(line, px + 65, currentY);
      currentY += 28;
    } else {
      ctx.font = '16px "Prompt", sans-serif';
      ctx.fillText(line, px + 65, currentY);
      currentY += 26;
    }
  }

  // 4. Signatures Section
  const sigY = py + paperH - 240;
  ctx.font = '16px "Prompt", sans-serif';
  ctx.fillText('ลงชื่อ..................................................ผู้ว่าจ้าง', px + 70, sigY + 80);
  ctx.fillText('( นายสมบูรณ์ เลิศวัฒนากุล )', px + 100, sigY + 115);
  ctx.fillText('กรรมการผู้จัดการ', px + 140, sigY + 140);

  ctx.fillText('ลงชื่อ..................................................ผู้รับจ้าง', px + paperW - 380, sigY + 80);
  ctx.fillText('( นายพัฒนพงษ์ เกียรติสกุลชัย )', px + paperW - 350, sigY + 115);
  ctx.fillText('วิศวกรผู้เชี่ยวชาญ', px + paperW - 310, sigY + 140);

  // Handwritten Blue Signature
  ctx.strokeStyle = '#1d4ed8'; // Blue ballpoint pen ink
  ctx.lineWidth = 2.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(px + paperW - 340, sigY + 65);
  ctx.bezierCurveTo(px + paperW - 310, sigY + 30, px + paperW - 270, sigY + 80, px + paperW - 230, sigY + 45);
  ctx.bezierCurveTo(px + paperW - 200, sigY + 30, px + paperW - 190, sigY + 75, px + paperW - 160, sigY + 50);
  ctx.stroke();

  // Official Red Seal Rubber Stamp
  const stampX = px + 220;
  const stampY = sigY + 90;
  ctx.save();
  ctx.translate(stampX, stampY);
  ctx.rotate(-0.15); // Hand-stamped slight rotation
  ctx.strokeStyle = 'rgba(220, 38, 38, 0.85)';
  ctx.fillStyle = 'rgba(220, 38, 38, 0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 46, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = 'bold 12px "Prompt", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SOLUTION DIGITAL', 0, -18);
  ctx.font = 'bold 11px "Prompt", sans-serif';
  ctx.fillText('★ OFFICIAL SEAL ★', 0, 3);
  ctx.fillText('บริษัท โซลูชั่น ดิจิทัล', 0, 22);
  ctx.restore();

  // 5. Heavy Phone/Body Shadow Across Top-Right to Bottom-Left
  const shadowGrad = ctx.createLinearGradient(px + paperW, py, px, py + paperH);
  shadowGrad.addColorStop(0, 'rgba(15, 20, 35, 0.65)'); // Heavy shadow corner
  shadowGrad.addColorStop(0.35, 'rgba(25, 30, 45, 0.40)');
  shadowGrad.addColorStop(0.7, 'rgba(40, 40, 50, 0.15)');
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(px, py, paperW, paperH);

  // Crease fold line across paper
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px, py + paperH * 0.48);
  ctx.bezierCurveTo(px + paperW * 0.5, py + paperH * 0.47, px + paperW * 0.8, py + paperH * 0.49, px + paperW, py + paperH * 0.48);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.moveTo(px, py + paperH * 0.48 + 2);
  ctx.bezierCurveTo(px + paperW * 0.5, py + paperH * 0.47 + 2, px + paperW * 0.8, py + paperH * 0.49 + 2, px + paperW, py + paperH * 0.48 + 2);
  ctx.stroke();

  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.92);
}

export async function createSignatureSample(): Promise<string> {
  const width = 1000;
  const height = 700;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Crumpled, warm yellowish paper texture with shadow
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#f9f5ea');
  grad.addColorStop(0.5, '#eddcc7');
  grad.addColorStop(1, '#dec7ad');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Uneven room lighting shadow
  const shadowGrad = ctx.createRadialGradient(width * 0.8, height * 0.2, 50, width * 0.5, height * 0.5, 600);
  shadowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
  shadowGrad.addColorStop(0.6, 'rgba(80, 60, 40, 0.25)');
  shadowGrad.addColorStop(1, 'rgba(50, 30, 20, 0.55)');
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(0, 0, width, height);

  // Dotted signature guide line
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = '#85786c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(150, 450);
  ctx.lineTo(850, 450);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = '20px "Prompt", sans-serif';
  ctx.fillStyle = '#6e6255';
  ctx.textAlign = 'center';
  ctx.fillText('ลายมือชื่อผู้มีอำนาจลงนาม / Authorized Signature', 500, 495);

  // Handwritten blue ink signature
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(220, 420);
  ctx.bezierCurveTo(270, 320, 340, 440, 390, 350);
  ctx.bezierCurveTo(420, 300, 440, 430, 490, 360);
  ctx.bezierCurveTo(550, 300, 520, 440, 620, 380);
  ctx.bezierCurveTo(700, 330, 750, 460, 780, 390);
  // Swirl loop
  ctx.bezierCurveTo(800, 330, 750, 260, 680, 270);
  ctx.bezierCurveTo(560, 290, 380, 460, 790, 420);
  ctx.stroke();

  // Official Red Stamp
  ctx.save();
  ctx.translate(680, 380);
  ctx.rotate(0.2);
  ctx.strokeStyle = 'rgba(220, 38, 38, 0.88)';
  ctx.fillStyle = 'rgba(220, 38, 38, 0.88)';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, 0, 75, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 68, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = 'bold 15px "Prompt", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★ CERTIFIED ★', 0, -28);
  ctx.font = 'bold 13px "Prompt", sans-serif';
  ctx.fillText('รับรองเอกสารถูกต้อง', 0, 0);
  ctx.fillText('BANGKOK THAILAND', 0, 32);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.92);
}

export async function createReceiptSample(): Promise<string> {
  const width = 900;
  const height = 1300;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Dark slate table
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(0.02);

  const paperW = 580;
  const paperH = 1100;
  const px = -paperW / 2;
  const py = -paperH / 2;

  // Paper shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 12;
  ctx.shadowOffsetY = 16;

  // Thermal receipt paper with yellow-gray tone
  const grad = ctx.createLinearGradient(px, py, px + paperW, py + paperH);
  grad.addColorStop(0, '#f8f8f5');
  grad.addColorStop(0.5, '#eeebe1');
  grad.addColorStop(1, '#dedad0');
  ctx.fillStyle = grad;
  ctx.fillRect(px, py, paperW, paperH);

  ctx.shadowColor = 'transparent';

  // Receipt Content
  ctx.fillStyle = '#18181b';
  ctx.textAlign = 'center';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('SIAM SUPERMARKET', 0, py + 70);
  ctx.font = '14px monospace';
  ctx.fillText('สาขา สยามพารากอน กรุงเทพมหานคร', 0, py + 100);
  ctx.fillText('TAX ID: 0105558019284  POS: #04', 0, py + 125);
  ctx.fillText('วันที่ 04/10/2026  14:32:18 น.', 0, py + 148);

  ctx.fillText('--------------------------------------------', 0, py + 175);

  ctx.textAlign = 'left';
  const items = [
    { name: '1. ข้าวหอมมะลิคัดพิเศษ 5กก.', price: '249.00' },
    { name: '2. นมสดพาสเจอร์ไรส์ 2000มล.', price: '98.00' },
    { name: '3. กาแฟอาราบิกาคั่วบด 250ก.', price: '185.00' },
    { name: '4. ไข่ไก่อนามัย เบอร์ 2 (แพ็ก 30)', price: '145.00' },
    { name: '5. น้ำมันมะกอก Extra Virgin 500มล.', price: '320.00' },
    { name: '6. แอปเปิ้ลฟูจิ นำเข้า 4 ผล', price: '129.00' },
  ];

  let iy = py + 215;
  for (const it of items) {
    ctx.fillText(it.name, px + 40, iy);
    ctx.textAlign = 'right';
    ctx.fillText(it.price, px + paperW - 40, iy);
    ctx.textAlign = 'left';
    iy += 38;
  }

  ctx.textAlign = 'center';
  ctx.fillText('--------------------------------------------', 0, iy + 10);

  ctx.textAlign = 'left';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('ยอดรวมราคาสินค้า (Subtotal)', px + 40, iy + 45);
  ctx.textAlign = 'right';
  ctx.fillText('1,126.00', px + paperW - 40, iy + 45);

  ctx.textAlign = 'left';
  ctx.fillText('ภาษีมูลค่าเพิ่ม 7% (VAT)', px + 40, iy + 75);
  ctx.textAlign = 'right';
  ctx.fillText('78.82', px + paperW - 40, iy + 75);

  ctx.font = 'bold 20px monospace';
  ctx.fillText('ยอดสุทธิ (TOTAL)', px + 40, iy + 115);
  ctx.textAlign = 'right';
  ctx.fillText('1,126.00 THB', px + paperW - 40, iy + 115);

  // Barcode
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000000';
  for (let bx = px + 90; bx < px + paperW - 90; bx += 7) {
    const barW = (bx % 3 === 0) ? 4 : 2;
    ctx.fillRect(bx, iy + 160, barW, 60);
  }
  ctx.font = '13px monospace';
  ctx.fillText('*88591823901284*', 0, iy + 240);

  // Creases and heavy hand shadow
  const shadowGrad = ctx.createLinearGradient(px, py, px + paperW, py + paperH);
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
  shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.15)');
  shadowGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(px, py, paperW, paperH);

  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.92);
}

export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    id: 'sample-contract',
    title: 'สัญญาจ้างบนโต๊ะไม้ (มีเงาบัง+ตรายางแดง+ลายเซ็นน้ำเงิน)',
    description: 'ทดสอบตัดขอบโต๊ะไม้ ลบเงาโทรศัพท์ ปรับกระดาษขาวใส และคงความสดของตรายางสีแดง',
    category: 'เอกสารสัญญา',
    thumbnail: '📜',
    generator: createContractSample,
  },
  {
    id: 'sample-signature',
    title: 'สกัดลายเซ็นและตรายาง (บนกระดาษยับมีเงา)',
    description: 'ทดสอบโหมดสกัดลายเซ็นเป็นไฟล์ PNG โปร่งใส ลบพื้นผิวกระดาษยับออก 100%',
    category: 'ลายเซ็น/ตรายาง',
    thumbnail: '✍️',
    generator: createSignatureSample,
  },
  {
    id: 'sample-receipt',
    title: 'สลิปใบเสร็จรับเงิน (บนโต๊ะสีเข้ม มีรอยพับ)',
    description: 'ทดสอบลบพื้นหลังสีเข้ม คืนความคมชัดให้ตัวหนังสือความร้อนและบาร์โค้ด',
    category: 'ใบเสร็จ/สลิป',
    thumbnail: '🧾',
    generator: createReceiptSample,
  },
];
