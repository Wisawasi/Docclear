export interface Point {
  x: number;
  y: number;
}

export interface QuadCorners {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

export type ProcessingMode =
  | 'studio_white'      // กระดาษขาวใสระดับสตูดิโอ (Studio Clean White)
  | 'transparent_png'   // ลบพื้นหลังโปร่งใส (Transparent PNG)
  | 'signature_stamp'   // สกัดเฉพาะลายเซ็น/ตรายาง (Signature & Seal Isolator)
  | 'high_contrast_bw'  // ขาวดำคมชัดระดับจัดเก็บ (B&W High Contrast)
  | 'color_enhanced';   // สีสดใสตัดแสงเงา (Enhanced Color Document)

export interface CleaningSettings {
  mode: ProcessingMode;
  shadowRemoval: number;     // 0.0 - 1.0 (ระดับการลบเงาและปรับแสงเรียบ)
  backgroundWhiteness: number; // 0.0 - 1.0 (ความขาวสะอาดของพื้นหลัง)
  textContrast: number;      // 0.8 - 2.5 (ความคมเข้มของตัวหนังสือ/หมึก)
  edgeSoftness: number;      // 0.0 - 1.0 (ความเนียนของขอบ Anti-aliasing)
  colorBoost: number;        // 0.0 - 2.0 (เร่งสีตรายาง/หมึกปากกาน้ำเงิน)
  despeckle: boolean;        // ลบจุดฝุ่น/เม็ดสแกน (Noise reduction)
  brightness: number;        // -50 to 50
  blackLevel: number;        // 0 - 50 (ความดำสนิทของตัวอักษร)
}

export interface DocumentAnalysisResult {
  hasOuterBackground: boolean;
  corners: {
    topLeft: [number, number];
    topRight: [number, number];
    bottomRight: [number, number];
    bottomLeft: [number, number];
  };
  documentType: string;
  documentTitleOrSummary: string;
  hasColoredStampsOrSignatures: boolean;
  lightingCondition: string;
  recommendedSettings: {
    shadowRemovalStrength: number;
    backgroundWhiteness: number;
    contrast: number;
    sharpness: number;
    preserveColorMode: string;
  };
  aiQualityTips?: string[];
}

export interface DocumentItem {
  id: string;
  name: string;
  originalImage: string; // Base64 or object URL
  originalWidth: number;
  originalHeight: number;
  croppedImage?: string;
  processedImage?: string;
  corners?: QuadCorners;
  hasCropped: boolean;
  analysis?: DocumentAnalysisResult;
  isAnalyzing: boolean;
  isProcessing: boolean;
  settings: CleaningSettings;
}
