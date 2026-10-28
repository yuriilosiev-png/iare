// IARE — настройки Firebase.
// Сейчас подключён ТЕСТОВЫЙ проект iare-test-bb650.
// Перед запуском в мастерской заменить на конфиг рабочего проекта iare-94afa.

export const firebaseConfig = {
  apiKey: "AIzaSyCl7sbQyqyy_ODbMnWLHQ3Qx6g1OhIteg8",
  authDomain: "iare-test-bb650.firebaseapp.com",
  projectId: "iare-test-bb650",
  storageBucket: "iare-test-bb650.firebasestorage.app",
  messagingSenderId: "321167156197",
  appId: "1:321167156197:web:8409d790e654f51e10c50c"
};

// Сотрудники входят по нику. Внутри Firebase ник превращается в адрес вида
// nick@staff.iare.local — настоящая почта не нужна и письма туда не уходят.
export const STAFF_EMAIL_DOMAIN = "staff.iare.local";

export const APP_VERSION = "0.1.0";
