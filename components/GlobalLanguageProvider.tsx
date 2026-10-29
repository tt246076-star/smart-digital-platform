"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type SiteLanguage = "ar" | "fr" | "en";
type LanguageContextValue = { language: SiteLanguage; setLanguage: (language: SiteLanguage) => void };
const LanguageContext = createContext<LanguageContextValue>({ language: "ar", setLanguage: () => {} });

const phrases: Record<string, [string, string]> = {
  "الرئيسية": ["Accueil", "Home"],
  "المميزات": ["Avantages", "Features"],
  "طريقة العمل": ["Fonctionnement", "How it works"],
  "كيفية الاستخدام": ["Mode d’utilisation", "How to use"],
  "المنتجات": ["Produits", "Products"],
  "المنتجات والأسعار": ["Produits et prix", "Products and prices"],
  "معرض النماذج": ["Exemples", "Examples"],
  "الأسئلة الشائعة": ["Questions fréquentes", "FAQ"],
  "تواصل معنا": ["Contactez-nous", "Contact us"],
  "جرّب البروفايل": ["Essayer le profil", "Try the profile"],
  "معاينة توضيحية": ["Aperçu illustratif", "Illustrative preview"],
  "تسجيل الدخول": ["Connexion", "Log in"],
  "إنشاء حساب": ["Créer un compte", "Create account"],
  "لوحة التحكم": ["Tableau de bord", "Dashboard"],
  "لوحة الإدارة": ["Administration", "Admin panel"],
  "الإعدادات": ["Paramètres", "Settings"],
  "تسجيل الخروج": ["Déconnexion", "Log out"],
  "اطلب بطاقتك الآن": ["Commander maintenant", "Order your card now"],
  "اطلب الآن": ["Commander", "Order now"],
  "تأكيد الطلب": ["Confirmer la commande", "Confirm order"],
  "إخفاء نموذج الطلب": ["Masquer le formulaire", "Hide order form"],
  "بطاقة واحدة...": ["Une carte...", "One card..."],
  "سكان واحد...": ["Un seul scan...", "One scan..."],
  "عالم كامل من روابطك": ["Tout votre univers de liens", "A world of links"],
  "بطاقة ذكية بتقنية NFC و QR": ["Carte intelligente NFC et QR", "Smart NFC & QR card"],
  "اختار بطاقتك": ["Choisissez votre carte", "Choose your card"],
  "كيفاش تخدم؟": ["Comment ça marche ?", "How it works"],
  "بلا تطبيق إضافي": ["Sans application supplémentaire", "No extra app needed"],
  "تحديث معلوماتك": ["Mise à jour de vos informations", "Update your information"],
  "كل معلوماتك في صفحة واحدة": ["Toutes vos informations sur une page", "All your information on one page"],
  "بروفايلك الرقمي": ["Votre profil numérique", "Your digital profile"],
  "اسم نشاطك": ["Nom de votre activité", "Your business name"],
  "هل يحتاج الزبون تطبيق؟ لا.": ["Le client a-t-il besoin d’une application ? Non.", "Does the customer need an app? No."],
  "يمسح رمز QR": ["Scanner le QR", "Scan the QR code"],
  "لمسة NFC": ["Un contact NFC", "Tap with NFC"],
  "بطاقتك تخدم أكثر من مجرد مشاركة رقم": ["Votre carte fait bien plus que partager un numéro", "Your card does more than share a number"],
  "خمسة خطوات بسيطة للحصول على بطاقتك": ["Cinq étapes simples pour obtenir votre carte", "Five simple steps to get your card"],
  "اطلب البطاقة": ["Commander la carte", "Order the card"],
  "استلم شحنتك": ["Recevoir votre colis", "Receive your delivery"],
  "فعّل بروفايلك": ["Activer votre profil", "Activate your profile"],
  "جرّب QR أو NFC": ["Essayez le QR ou le NFC", "Try QR or NFC"],
  "شارك وابدأ": ["Partagez et démarrez", "Share and get started"],
  "اختار البطاقة المناسبة لك": ["Choisissez la carte qui vous convient", "Choose the right card for you"],
  "منتجات وعروض": ["Produits et offres", "Products and offers"],
  "حاب تعرف أكثر؟": ["Vous voulez en savoir plus ?", "Want to know more?"],
  "جاهز تبدأ؟": ["Prêt à commencer ?", "Ready to get started?"],
  "خلي بطاقتك تخدم عليك": ["Laissez votre carte travailler pour vous", "Let your card work for you"],
  "شوف المنتجات": ["Voir les produits", "View products"],
  "الصفحة الرئيسية": ["Accueil", "Home"],
  "كل الحقوق محفوظة.": ["Tous droits réservés.", "All rights reserved."],
  "واتساب": ["WhatsApp", "WhatsApp"],
  "اسم المنتج": ["Nom du produit", "Product name"],
  "السعر بالدينار الجزائري": ["Prix en dinars algériens", "Price in Algerian dinars"],
  "صورة المنتج (اختياري)": ["Image du produit (facultatif)", "Product image (optional)"],
  "وصف المنتج": ["Description du produit", "Product description"],
  "ترتيب العرض": ["Ordre d’affichage", "Display order"],
  "عرض المنتج في الموقع": ["Afficher le produit sur le site", "Show product on site"],
  "إضافة منتج جديد": ["Ajouter un produit", "Add a product"],
  "منتجاتك": ["Vos produits", "Your products"],
  "حفظ التعديلات": ["Enregistrer les modifications", "Save changes"],
  "حذف المنتج": ["Supprimer le produit", "Delete product"],
  "حذف الطلب": ["Supprimer la commande", "Delete order"],
  "طلبات الزبائن": ["Commandes clients", "Customer orders"],
  "حالة الطلب": ["État de la commande", "Order status"],
  "طلب جديد": ["Nouvelle commande", "New order"],
  "تم التأكيد": ["Confirmée", "Confirmed"],
  "خرج للتوصيل": ["En livraison", "Out for delivery"],
  "مكتمل": ["Terminée", "Completed"],
  "ملغي": ["Annulée", "Cancelled"],
  "تحديث الطلبات": ["Actualiser les commandes", "Refresh orders"],
  "تفعيل الإشعارات": ["Activer les notifications", "Enable notifications"],
  "اتصال بالزبون": ["Appeler le client", "Call customer"],
  "الولاية": ["Wilaya", "Province"],
  "البلدية": ["Commune", "Municipality"],
  "العنوان بالتفصيل": ["Adresse détaillée", "Full address"],
  "الاسم الكامل": ["Nom complet", "Full name"],
  "رقم الهاتف الجزائري": ["Téléphone algérien", "Algerian phone number"],
  "ملاحظات (اختياري)": ["Notes (facultatif)", "Notes (optional)"],
  "المنتج غير متاح.": ["Produit indisponible.", "Product unavailable."],
  "تم تسجيل طلبك بنجاح! نتواصل معك قريبًا لتأكيد العنوان والتفاصيل.": ["Commande enregistrée ! Nous vous contacterons pour confirmer l’adresse et les détails.", "Order received! We’ll contact you to confirm the address and details."],
  "البريد الإلكتروني": ["E-mail", "Email"],
  "كلمة السر الجديدة": ["Nouveau mot de passe", "New password"],
  "الاسم الظاهر": ["Nom affiché", "Display name"],
  "حفظ الملف الشخصي": ["Enregistrer le profil", "Save profile"],
  "تغيير كلمة السر": ["Changer le mot de passe", "Change password"],
  "المصادقة الثنائية (2FA)": ["Authentification à deux facteurs (2FA)", "Two-factor authentication (2FA)"],
  "الملف الشخصي": ["Profil", "Profile"],
  "حفظ": ["Enregistrer", "Save"],
  "إلغاء": ["Annuler", "Cancel"],
  "بحث": ["Rechercher", "Search"],
  "عرض": ["Afficher", "Show"],
  "تعديل": ["Modifier", "Edit"],
  "حذف": ["Supprimer", "Delete"],
  "إدارة المتجر": ["Gérer la boutique", "Manage store"],
  "بطاقة مكتب": ["Carte de bureau", "Desk card"],
  "بطاقة باب": ["Carte de porte", "Door card"],
  "بطاقة عرض ذكية": ["Présentoir intelligent", "Smart display card"],
  "حزمة 3 بطاقات": ["Pack de 3 cartes", "3-card bundle"],
  "بطاقة تعريف ذكية مناسبة للمكتب أو مكان الاستقبال.": ["Carte d’identification intelligente pour bureau ou accueil.", "Smart ID card for a desk or reception area."],
  "عرّف الزوار بنشاطك من أمام المحل أو المكتب.": ["Présentez votre activité à l’entrée du magasin ou du bureau.", "Introduce your business at the shop or office entrance."],
  "حل عملي لعرض معلومات نشاطك ومشاركة بياناتك بسرعة.": ["Une solution pratique pour afficher vos informations et les partager rapidement.", "A practical way to display and share your business details."],
  "اختر اللغة": ["Choisir la langue", "Choose language"],
  "العربية": ["العربية", "Arabic"],
  "الفرنسية": ["Français", "French"],
  "الإنجليزية": ["Anglais", "English"],
  "اللغة": ["Langue", "Language"],
  "الوضع الداكن": ["Mode sombre", "Dark mode"],
  "معاينة الواجهة": ["Aperçu de l’interface", "Preview mode"],
  "افتح القائمة": ["Ouvrir le menu", "Open menu"],
  "إغلاق القائمة": ["Fermer le menu", "Close menu"],
  "بطاقة واحدة لكل شيء": ["Une carte pour tout", "One card for everything"],
  "اجمع روابطك ومعلوماتك وطرق التواصل في بطاقة ذكية واحدة.": ["Regroupez vos liens, informations et contacts sur une seule carte intelligente.", "Bring your links, information, and contact details together on one smart card."],
  "تحديث فوري": ["Mise à jour instantanée", "Instant updates"],
  "حدّث بيانات بروفايلك الرقمي وقت ما تحتاج، بلا إعادة طباعة البطاقة.": ["Mettez à jour votre profil sans réimprimer la carte.", "Update your digital profile without reprinting the card."],
  "شارك بروفايلك بالمسح أو بلمسة هاتف متوافق مع NFC.": ["Partagez votre profil par scan ou avec un téléphone compatible NFC.", "Share your profile by scanning or tapping with an NFC-compatible phone."],
  "تصميم حسب نشاطك": ["Un design adapté à votre activité", "A design for your business"],
  "واجهة رقمية منظمة تعكس هوية نشاطك وتعرض المعلومات المهمة.": ["Une page numérique organisée qui présente votre activité et les informations importantes.", "An organized digital page that presents your business and key information."],
  "سهل وسريع": ["Simple et rapide", "Simple and fast"],
  "الزبون يوصل للمعلومات من المتصفح، بلا ما يثبت تطبيق.": ["Le client accède aux informations dans son navigateur, sans installer d’application.", "Customers access your information in their browser without installing an app."],
  "مناسب لمختلف الأنشطة": ["Pour différents types d’activités", "For different types of businesses"],
  "للمحلات والمكاتب والمطاعم والمهنيين وأصحاب الخدمات.": ["Pour les commerces, bureaux, restaurants, professionnels et prestataires.", "For shops, offices, restaurants, professionals, and service providers."],
  "حل بسيط للهواتف اللي فيها كاميرا، بدون تثبيت تطبيق خاص.": ["Une solution simple avec l’appareil photo, sans application spéciale.", "A simple solution using the camera, with no special app."],
  "قرّب البطاقة من هاتف يدعم NFC لفتح الرابط بسرعة.": ["Approchez la carte d’un téléphone compatible NFC pour ouvrir le lien rapidement.", "Tap the card on an NFC-compatible phone to open the link quickly."],
  "خلي معلوماتك المهنية وروابطك قريبة من الزبون في تجربة سهلة وواضحة.": ["Gardez vos informations professionnelles et vos liens facilement accessibles à vos clients.", "Keep your professional information and links easy for customers to access."],
  "اختار المنتج، عمّر معلومات الطلب ونعاودوا نتواصلوا معك لتأكيد التفاصيل والتوصيل.": ["Choisissez un produit, renseignez les informations de commande et nous vous contacterons pour confirmer la livraison.", "Choose a product, enter your order details, and we’ll contact you to confirm delivery."],
  "السعر النهائي والتوصيل يتم تأكيدهما هاتفيًا قبل إتمام الطلب.": ["Le prix final et la livraison seront confirmés par téléphone.", "The final price and delivery will be confirmed by phone."],
  "هل يحتاج الزبون إلى تطبيق؟": ["Le client a-t-il besoin d’une application ?", "Does the customer need an app?"],
  "لا، البروفايل يفتح مباشرة في متصفح الهاتف أو الكمبيوتر.": ["Non, le profil s’ouvre directement dans le navigateur du téléphone ou de l’ordinateur.", "No, the profile opens directly in a phone or computer browser."],
  "كيف تتم مشاركة البطاقة؟": ["Comment partager la carte ?", "How do I share the card?"],
  "باستعمال رمز QR أو NFC على هاتف يدعم NFC، كما يمكنك مشاركة رابط البروفايل.": ["Avec un QR code ou le NFC sur un téléphone compatible. Vous pouvez aussi partager le lien du profil.", "Use a QR code or NFC on a compatible phone. You can also share the profile link."],
  "هل أقدر نحدّث معلوماتي؟": ["Puis-je mettre à jour mes informations ?", "Can I update my information?"],
  "تقدر تدير التعديلات المتاحة في بروفايلك من حسابك، والبطاقة تبقى مرتبطة بنفس الرابط.": ["Vous pouvez modifier les informations de votre profil depuis votre compte ; la carte conserve le même lien.", "You can edit your profile information from your account; the card keeps the same link."],
  "هل تعمل مع جميع الهواتف؟": ["Est-ce compatible avec tous les téléphones ?", "Does it work with all phones?"],
  "رابط البروفايل يفتح من المتصفح. استعمال NFC يتطلب هاتفًا يدعم التقنية؛ ويمكن استخدام QR كبديل.": ["Le lien du profil s’ouvre dans le navigateur. Le NFC nécessite un téléphone compatible ; le QR reste une alternative.", "The profile link opens in the browser. NFC requires a compatible phone; QR is an alternative."],
  "معلومات النشاط والموقع": ["Informations et emplacement de l’activité", "Business information and location"],
  "روابط التواصل والخدمات": ["Liens de contact et services", "Contact and service links"],
  "مثال: الجزائر": ["Exemple : Alger", "Example: Algiers"],
  "اكتب اسم البلدية": ["Saisissez le nom de la commune", "Enter your municipality"],
  "الحي، الشارع، رقم المنزل": ["Quartier, rue, numéro", "District, street, house number"],
  "جاري التحديث...": ["Actualisation...", "Refreshing..."],
  "جاري إرسال الطلب...": ["Envoi de la commande...", "Submitting order..."],
  "تم تحديث حالة الطلب.": ["Statut de commande mis à jour.", "Order status updated."],
  "تم حذف الطلب.": ["Commande supprimée.", "Order deleted."],
  "متأكد تحب تحذف هذا الطلب نهائيًا؟": ["Voulez-vous vraiment supprimer définitivement cette commande ?", "Are you sure you want to permanently delete this order?"],
  "ما كاين حتى طلب جديد لحد الآن": ["Aucune nouvelle commande pour le moment", "No new orders yet"],
  "كي يطلب زبون منتج من صفحة متجر، الطلب يبان هنا تلقائيًا.": ["Lorsqu’un client commande depuis la boutique, la commande apparaît ici automatiquement.", "When a customer orders from the storefront, the order appears here automatically."],
  "تتحدّث القائمة تلقائيًا كل 15 ثانية.": ["La liste s’actualise automatiquement toutes les 15 secondes.", "The list refreshes automatically every 15 seconds."],
  "لوحة إدارة الاشتراكات": ["Gestion des abonnements", "Subscription administration"],
  "إدارة الحسابات والخطط بعد التأكد من الدفع.": ["Gérer les comptes et les forfaits après confirmation du paiement.", "Manage accounts and plans after payment confirmation."],
  "الحسابات المسجلة": ["Comptes inscrits", "Registered accounts"],
  "إدارة الصفحات": ["Gestion des pages", "Page management"],
  "خطط الاشتراك": ["Forfaits d’abonnement", "Subscription plans"],
  "تجربة مجانية": ["Essai gratuit", "Free trial"],
  "عملاء عاديون": ["Clients standard", "Standard customers"],
  "عملاء خاصون": ["Clients premium", "Premium customers"],
  "الصفحات المنشورة": ["Pages publiées", "Published pages"],
  "زيارات الصفحات": ["Visites des pages", "Page visits"],
  "أهلًا": ["Bienvenue", "Welcome"],
  "مساحة العمل الخاصة بك": ["Votre espace de travail", "Your workspace"],
  "أنشئ صفحات نشاطك التجاري وصمّمها من مكان واحد.": ["Créez et concevez vos pages professionnelles depuis un seul endroit.", "Create and design your business pages in one place."],
  "تحديث الطلبات ↻": ["Actualiser les commandes ↻", "Refresh orders ↻"],
  "الولاية (اختار بالرقم)": ["Wilaya (choisissez le numéro)", "Wilaya (choose number)"],
};

const originalTextNodes = new WeakMap<Text, string>();
const originalElementAttributes = new WeakMap<Element, Map<string, string>>();

function translateText(source: string, language: SiteLanguage) {
  if (language === "ar") return source;
  let result = source;
  const keys = Object.keys(phrases).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const translated = phrases[key][language === "fr" ? 0 : 1];
    result = result.split(key).join(translated);
  }
  return result;
}

export function GlobalLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, updateLanguage] = useState<SiteLanguage>("ar");
  const setLanguage = useCallback((value: SiteLanguage) => {
    updateLanguage(value);
    try { window.localStorage.setItem("bitaqati-language", value); } catch {}
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("bitaqati-language");
      if (saved === "ar" || saved === "fr" || saved === "en") updateLanguage(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    const attributeNames = ["placeholder", "title", "aria-label", "alt"];
    let applying = false;

    const translate = () => {
      if (applying) return;
      applying = true;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const textNode = node as Text;
        const parent = textNode.parentElement;
        if (!parent || parent.closest("script,style,noscript,svg,[data-no-translate]")) continue;
        const original = originalTextNodes.get(textNode) ?? textNode.nodeValue ?? "";
        if (!originalTextNodes.has(textNode)) originalTextNodes.set(textNode, original);
        const translated = translateText(original, language);
        if (textNode.nodeValue !== translated) textNode.nodeValue = translated;
      }
      const elements = document.body.querySelectorAll("*");
      elements.forEach(element => {
        const saved = originalElementAttributes.get(element) ?? new Map<string,string>();
        attributeNames.forEach(name => {
          const value = element.getAttribute(name);
          if (value !== null && !saved.has(name)) saved.set(name, value);
          if (saved.has(name)) {
            const translated = translateText(saved.get(name)!, language);
            if (element.getAttribute(name) !== translated) element.setAttribute(name, translated);
          }
        });
        if (saved.size) originalElementAttributes.set(element, saved);
        if (element.hasAttribute("dir")) {
          if (!element.hasAttribute("data-original-dir")) element.setAttribute("data-original-dir", element.getAttribute("dir") || "");
          const originalDir = element.getAttribute("data-original-dir");
          if (originalDir === "rtl" || originalDir === "ltr") element.setAttribute("dir", language === "ar" ? "rtl" : "ltr");
        }
      });
      applying = false;
    };

    translate();
    const observer = new MutationObserver(() => {
      if (!applying) translate();
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "title", "aria-label", "alt", "dir"] });
    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useSiteLanguage() { return useContext(LanguageContext); }
