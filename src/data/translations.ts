import { Language } from '../types';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'hinglish', name: 'Hinglish', nativeName: 'Hinglish (हिंग्लिश)', region: 'Pan-India Kirana' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'North / Central India' },
  { code: 'en', name: 'English', nativeName: 'English', region: 'Standard' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'Andhra Pradesh & Telangana' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'Tamil Nadu' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'Karnataka' },
];

/**
 * Generates an empathetic, high-converting customer recovery message
 * in the customer's native script.
 * Every message ends with an opt-out line.
 */
export function generateCustomerMessage(
  name: string,
  amountPaise: number,
  linkUrl: string,
  language: Language
): string {
  const amountStr = (amountPaise / 100).toLocaleString('en-IN');

  switch (language) {
    case 'hi':
      return `नमस्ते ${name} जी, बैंक की समस्या के कारण आपका ₹${amountStr} का भुगतान पूरा नहीं हुआ। इस लिंक से दोबारा भुगतान करें: ${linkUrl}\nरद्द करने के लिए STOP लिखें।`;
    
    case 'kn':
      return `ನಮಸ್ಕಾರ ${name}, ಬ್ಯಾಂಕ್ ಸಮಸ್ಯೆಯಿಂದ ನಿಮ್ಮ ₹${amountStr} ಪಾವತಿ ಪೂರ್ಣಗೊಂಡಿಲ್ಲ. ಈ ಲಿಂಕ್ ಮೂಲಕ ಮತ್ತೆ ಪಾವತಿಸಬಹುದು: ${linkUrl}\nಬೇಡವೆಂದಲ್ಲಿ STOP ಎಂದು ಉತ್ತರಿಸಿ.`;
    
    case 'ta':
      return `வணக்கம் ${name}, வங்கிக் கோளாறு காரணமாக உங்கள் ₹${amountStr} கட்டணம் நிறைவடையவில்லை. இந்த இணைப்பில் மீண்டும் செலுத்தலாம்: ${linkUrl}\nவிலக STOP என பதிலளிக்கவும்.`;
    
    case 'te':
      return `నమస్తే ${name} గారు, బ్యాంక్ సమస్య వల్ల మీ ₹${amountStr} చెల్లింపు పూర్తి కాలేదు. ఈ లింక్ ద్వారా మళ్ళీ చెల్లించవచ్చు: ${linkUrl}\nఆపడానికి STOP అని రిప్లై చేయండి.`;
    
    case 'en':
      return `Hello ${name}, due to a bank technical issue your payment of ₹${amountStr} was not completed. Please tap this link to complete it securely: ${linkUrl}\nReply STOP to opt out.`;
    
    case 'hinglish':
    default:
      return `Namaste ${name} ji, bank technical issue ki wajah se aapka ₹${amountStr} ka payment complete nahi hua. Is secure Paytm link se payment pura karein: ${linkUrl}\nReply STOP to opt out.`;
  }
}

export const UI_STRINGS: Record<Language, {
  shopName: string;
  tagline: string;
  simulatorBadge: string;
  confirmedBySimulator: string;
  tonightRun: string;
  flagged: string;
  contacted: string;
  recovered: string;
  waitingForYou: string;
  stoppedByPolicy: string;
  rupeesRecovered: string;
  simulateBurst: string;
  resetDemo: string;
  allCases: string;
  autoVerdict: string;
  askOwnerVerdict: string;
  blockedVerdict: string;
  corePrinciple: string;
  needsApproval: string;
  approve: string;
  edit: string;
  skip: string;
  metrics: string;
  settings: string;
  idempotentSafe: string;
}> = {
  hinglish: {
    shopName: 'Sharma Electronics',
    tagline: 'Autonomous AI Teammate for Failed UPI Payments',
    simulatorBadge: 'Paytm-compatible simulator · sample data',
    confirmedBySimulator: 'Confirmed by simulator',
    tonightRun: "Tonight's recovery run",
    flagged: 'Payments flagged',
    contacted: 'Customers contacted',
    recovered: 'Recovered (confirmed)',
    waitingForYou: 'Waiting for you',
    stoppedByPolicy: 'Stopped by policy',
    rupeesRecovered: 'Rupees recovered',
    simulateBurst: 'Simulate failure burst (14 cases)',
    resetDemo: 'Reset demo',
    allCases: 'All Cases',
    autoVerdict: 'Auto Sent',
    askOwnerVerdict: 'Ask Owner',
    blockedVerdict: 'Blocked by Policy',
    corePrinciple: 'AI proposes. Policy authorizes. Code executes. Paytm confirms.',
    needsApproval: 'Needs your approval',
    approve: 'Approve & Send Link',
    edit: 'Edit Amount',
    skip: 'Skip & Block',
    metrics: 'Metrics & Pilot ROI',
    settings: 'Policy Controls',
    idempotentSafe: 'Exactly-once delivery guaranteed',
  },
  hi: {
    shopName: 'शर्मा इलेक्ट्रॉनिक्स',
    tagline: 'विफल UPI भुगतानों के लिए स्वायत्त AI सहायक',
    simulatorBadge: 'Paytm-compatible simulator · sample data',
    confirmedBySimulator: 'Confirmed by simulator',
    tonightRun: 'आज रात का रिकवरी रन',
    flagged: 'चिह्नित विफल भुगतान',
    contacted: 'संपर्क किए गए ग्राहक',
    recovered: 'सफलतापूर्वक रिकवर',
    waitingForYou: 'आपकी स्वीकृति का इंतज़ार',
    stoppedByPolicy: 'पॉलिसी द्वारा रोका गया',
    rupeesRecovered: 'कुल रिकवर राशि',
    simulateBurst: 'विफलता सिमुलेट करें (14 केस)',
    resetDemo: 'डेमो रीसेट करें',
    allCases: 'सभी केस',
    autoVerdict: 'ऑटो भेजा गया',
    askOwnerVerdict: 'दुकानदार से पूछें',
    blockedVerdict: 'पॉलिसी द्वारा ब्लॉक',
    corePrinciple: 'AI proposes. Policy authorizes. Code executes. Paytm confirms.',
    needsApproval: 'आपकी स्वीकृति की आवश्यकता है',
    approve: 'स्वीकृत करें और लिंक भेजें',
    edit: 'राशि संपादित करें',
    skip: 'छोड़ें और ब्लॉक करें',
    metrics: 'मीट्रिक्स व पायलट परिणाम',
    settings: 'पॉलिसी सेटिंग्स',
    idempotentSafe: 'शून्य डुप्लिकेट संदेश की गारंटी',
  },
  en: {
    shopName: 'Sharma Electronics',
    tagline: 'Autonomous AI Teammate for Failed UPI Payments',
    simulatorBadge: 'Paytm-compatible simulator · sample data',
    confirmedBySimulator: 'Confirmed by simulator',
    tonightRun: "Tonight's recovery run",
    flagged: 'Payments flagged',
    contacted: 'Customers contacted',
    recovered: 'Recovered (confirmed)',
    waitingForYou: 'Waiting for you',
    stoppedByPolicy: 'Stopped by policy',
    rupeesRecovered: 'Rupees recovered',
    simulateBurst: 'Simulate failure burst (14 cases)',
    resetDemo: 'Reset demo',
    allCases: 'All Cases',
    autoVerdict: 'Auto Allowed',
    askOwnerVerdict: 'Ask Owner',
    blockedVerdict: 'Blocked by Policy',
    corePrinciple: 'AI proposes. Policy authorizes. Code executes. Paytm confirms.',
    needsApproval: 'Needs your approval',
    approve: 'Approve & Send Link',
    edit: 'Edit Link',
    skip: 'Skip & Block',
    metrics: 'Metrics & Pilot ROI',
    settings: 'Policy Settings',
    idempotentSafe: 'Zero duplicate delivery guarantee',
  },
  te: {
    shopName: 'శర్మ ఎలక్ట్రానిక్స్',
    tagline: 'ఫెయిల్ అయిన UPI చెల్లింపుల రికవరీ కోసం అటానమస్ AI సహచరుడు',
    simulatorBadge: 'Paytm-compatible simulator · sample data',
    confirmedBySimulator: 'Confirmed by simulator',
    tonightRun: 'ఈ రాత్రి రికవరీ రన్',
    flagged: 'గుర్తించబడిన విఫల చెల్లింపులు',
    contacted: 'సంప్రదించిన కస్టమర్లు',
    recovered: 'రికవర్ చేయబడినవి',
    waitingForYou: 'మీ ఆమోదం కోసం వేచి ఉన్నాయి',
    stoppedByPolicy: 'పాలసీ ద్వారా నిరోధించబడినవి',
    rupeesRecovered: 'రికవర్ అయిన మొత్తం',
    simulateBurst: 'సిమ్యులేట్ ఫెయిల్యూర్ బరస్ట్ (14 కేసులు)',
    resetDemo: 'రీసెట్ డెమో',
    allCases: 'అన్ని కేసులు',
    autoVerdict: 'ఆటో అనుమతించబడింది',
    askOwnerVerdict: 'యజమానిని అడగండి',
    blockedVerdict: 'పాలసీ ద్వారా బ్లాక్ చేయబడింది',
    corePrinciple: 'AI proposes. Policy authorizes. Code executes. Paytm confirms.',
    needsApproval: 'మీ ఆమోదం అవసరం',
    approve: 'ఆమోదించి లింక్ పంపండి',
    edit: 'ఎడిట్ చేయండి',
    skip: 'వదిలివేయండి & బ్లాక్ చేయండి',
    metrics: 'మెట్రిక్స్ & ఫలితాలు',
    settings: 'పాలసీ సెట్టింగ్స్',
    idempotentSafe: 'ఎగ్జాక్ట్లీ-వన్స్ డెలివరీ గ్యారెంటీ',
  },
  ta: {
    shopName: 'சர்மா எலக்ட்ரானிக்ஸ்',
    tagline: 'தோல்வியுற்ற UPI செலுத்துதல்களை மீட்டெடுக்கும் தன்னாட்சி AI',
    simulatorBadge: 'Paytm-compatible simulator · sample data',
    confirmedBySimulator: 'Confirmed by simulator',
    tonightRun: 'இன்றிரவு மீட்பு ஓட்டம்',
    flagged: 'தோல்வியுற்ற கட்டணங்கள்',
    contacted: 'தொடர்பு கொண்ட வாடிக்கையாளர்கள்',
    recovered: 'மீட்டெடுக்கப்பட்டது',
    waitingForYou: 'உங்கள் அனுமதிக்காக காத்திருக்கிறது',
    stoppedByPolicy: 'விதியால் நிறுத்தப்பட்டது',
    rupeesRecovered: 'மீட்டெடுக்கப்பட்ட ரூபாய்',
    simulateBurst: 'தோல்விகளை இயக்கு (14 வழக்குகள்)',
    resetDemo: 'மீட்டமைக்கவும்',
    allCases: 'அனைத்து வழக்குகள்',
    autoVerdict: 'தானியங்கி அனுமதி',
    askOwnerVerdict: 'உரிமையாளரிடம் கேளுங்கள்',
    blockedVerdict: 'விதியால் தடுக்கப்பட்டது',
    corePrinciple: 'AI proposes. Policy authorizes. Code executes. Paytm confirms.',
    needsApproval: 'உங்கள் ஒப்புதல் தேவை',
    approve: 'ஒப்புதல் அளித்து இணைப்பை அனுப்பு',
    edit: 'திருத்து',
    skip: 'தவிர் & தடு',
    metrics: 'அளவீடுகள்',
    settings: 'அமைப்புகள்',
    idempotentSafe: 'ஒருமுறை மட்டுமே அனுப்பப்படும் உத்தரவாதம்',
  },
  kn: {
    shopName: 'ಶರ್ಮಾ ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್',
    tagline: 'ವಿಫಲವಾದ UPI ಪಾವತಿಗಳ ಮರುಪಡೆಯುವಿಕೆಗೆ ಸ್ವಾಯತ್ತ AI ಸಹವರ್ತಿ',
    simulatorBadge: 'Paytm-compatible simulator · sample data',
    confirmedBySimulator: 'Confirmed by simulator',
    tonightRun: 'ಇಂದಿನ ರಾತ್ರಿಯ ರಿಕವರಿ ರನ್',
    flagged: 'ಗುರುತಿಸಲಾದ ವಿಫಲ ಪಾವತಿಗಳು',
    contacted: 'ಸಂಪರ್ಕಿಸಲಾದ ಗ್ರಾಹಕರು',
    recovered: 'ಮರುಪಡೆಯಲಾಗಿದೆ',
    waitingForYou: 'ನಿಮ್ಮ ಅನುಮೋದನೆಗಾಗಿ ಕಾಯುತ್ತಿದೆ',
    stoppedByPolicy: 'ನಿಯಮದಿಂದ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ',
    rupeesRecovered: 'ಮರುಪಡೆಯಲಾದ ಒಟ್ಟು ರೂಪಾಯಿ',
    simulateBurst: 'ವೈಫಲ್ಯಗಳನ್ನು ಸಿಮ್ಯುಲೇಟ್ ಮಾಡಿ (14)',
    resetDemo: 'ಮರುಹೊಂದಿಸಿ',
    allCases: 'ಎಲ್ಲಾ ಪ್ರಕರಣಗಳು',
    autoVerdict: 'ಸ್ವಯಂಚಾಲಿತ ಅನುಮೋದನೆ',
    askOwnerVerdict: 'ಮಾಲೀಕರನ್ನು ಕೇಳಿ',
    blockedVerdict: 'ನಿಯಮದಿಂದ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ',
    corePrinciple: 'AI proposes. Policy authorizes. Code executes. Paytm confirms.',
    needsApproval: 'ನಿಮ್ಮ ಅನುಮೋದನೆ ಅಗತ್ಯವಿದೆ',
    approve: 'ಅನುಮೋದಿಸಿ & ಲಿಂಕ್ ಕಳುಹಿಸಿ',
    edit: 'ಸಂಪಾದಿಸಿ',
    skip: 'ಬಿಟ್ಟುಬಿಡಿ & ಬ್ಲಾಕ್ ಮಾಡಿ',
    metrics: 'ಮೆಟ್ರಿಕ್ಸ್',
    settings: 'ಸೆಟ್ಟಿಂಗ್ಸ್',
    idempotentSafe: 'ಏಕೈಕ ವಿತರಣೆ ಭರವಸೆ',
  },
};
