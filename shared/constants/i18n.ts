/**
 * PETWO Platform — Multilingual Localization Strings
 * Languages supported: English (en), Telugu (te - Hyderabad regional), Hindi (hi - National)
 */

export type SupportedLocale = 'en' | 'te' | 'hi';

export const I18N_STRINGS = {
  en: {
    app_title: 'PETWO — Pet Care Marketplace',
    tagline: 'World-Class Care For Your Furry Family',
    location_hyderabad: 'Banjara Hills, Hyderabad',
    search_placeholder: 'Search veterinarians, grooming spas, clinics...',
    book_now: 'Book Appointment',
    now_serving: 'Now Serving',
    up_next: 'Up Next in Queue',
    emergency_sos: 'Emergency 24/7 SOS',
    paw_rewards: 'PawRewards Balance',
    health_passport: 'Digital Health Passport',
    verified_partner: 'Verified Partner',
    categories: {
      veterinary: 'Veterinary Care',
      grooming: 'Grooming & Spa',
      boarding: 'Boarding & Resorts',
      daycare: 'Day Care',
      training: 'Pet Training',
      diagnostics: 'Diagnostics & Labs',
      home_services: 'Doorstep Vet & Grooming',
    },
    actions: {
      confirm: 'Confirm',
      cancel: 'Cancel',
      reschedule: 'Reschedule',
      pay_now: 'Pay with UPI / Card',
      view_passport: 'View Health Passport',
      claim_insurance: 'File Cashless Claim',
    },
  },
  te: {
    app_title: 'పెట్వో (PETWO) — పెట్ కేర్ మార్కెట్‌ప్లేస్',
    tagline: 'మీ ప్రియమైన మూగజీవుల కోసం ఉత్తమ సంరక్షణ',
    location_hyderabad: 'బంజారా హిల్స్, హైదరాబాద్',
    search_placeholder: 'పశువైద్యులు, గ్రూమింగ్ స్పా, క్లినిక్‌ల కోసం వెతకండి...',
    book_now: 'అపాయింట్‌మెంట్ బుక్ చేసుకోండి',
    now_serving: 'ప్రస్తుతం సేవలు పొందుతున్నారు',
    up_next: 'తదుపరి క్యూలో ఉన్నారు',
    emergency_sos: '24/7 అత్యవసర సహాయం (SOS)',
    paw_rewards: 'పా రివార్డ్స్ పాయింట్లు',
    health_passport: 'డిజిటల్ హెల్త్ పాస్‌పోర్ట్',
    verified_partner: 'ధృవీకరించబడిన భాగస్వామి',
    categories: {
      veterinary: 'పశువైద్య సేవలు',
      grooming: 'గ్రూమింగ్ మరియు స్పా',
      boarding: 'బోర్డింగ్ మరియు రిసార్ట్',
      daycare: 'డే కేర్ సెంటర్',
      training: 'శిక్షణ సేవలు',
      diagnostics: 'ల్యాబ్ మరియు డయాగ్నస్టిక్స్',
      home_services: 'ఇంటి వద్దకే పశువైద్య సేవలు',
    },
    actions: {
      confirm: 'నిర్ధారించండి',
      cancel: 'రద్దు చేయండి',
      reschedule: 'తేదీ మార్చండి',
      pay_now: 'UPI / కార్డ్ ద్వారా చెల్లించండి',
      view_passport: 'హెల్త్ పాస్‌పోర్ట్ చూడండి',
      claim_insurance: 'క్లెయిమ్ సమర్పించండి',
    },
  },
  hi: {
    app_title: 'पेटवो (PETWO) — पेट केयर मार्केटप्लेस',
    tagline: 'आपके प्यारे पालतू जानवरों के लिए सर्वोत्तम देखभाल',
    location_hyderabad: 'बंजारा हिल्स, हैदराबाद',
    search_placeholder: 'पशु चिकित्सक, ग्रूमिंग स्पा, क्लीनिक खोजें...',
    book_now: 'अपॉइंटमेंट बुक करें',
    now_serving: 'अभी सेवा दी जा रही है',
    up_next: 'कतार में अगला',
    emergency_sos: '24/7 आपातकालीन सहायता (SOS)',
    paw_rewards: 'पाव रिवार्ड्स बैलेंस',
    health_passport: 'डिजिटल हेल्थ पासपोर्ट',
    verified_partner: 'सत्यापित पार्टनर',
    categories: {
      veterinary: 'पशु चिकित्सा सेवाएँ',
      grooming: 'ग्रूमिंग और स्पा',
      boarding: 'बोर्डिंग और रिसॉर्ट्स',
      daycare: 'डे केयर',
      training: 'पालतू पशु प्रशिक्षण',
      diagnostics: 'डायग्नोस्टिक्स और पैथोलॉजी',
      home_services: 'डोरस्टेप वेट और ग्रूमिंग',
    },
    actions: {
      confirm: 'पुष्टि करें',
      cancel: 'रद्द करें',
      reschedule: 'पुनर्निर्धारित करें',
      pay_now: 'UPI / कार्ड से भुगतान करें',
      view_passport: 'हेल्थ पासपोर्ट देखें',
      claim_insurance: 'कैशलेस क्लेम करें',
    },
  },
} as const;

export function getTranslation(locale: SupportedLocale = 'en') {
  return I18N_STRINGS[locale] || I18N_STRINGS.en;
}
