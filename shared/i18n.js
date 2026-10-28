// IARE — тексты интерфейса на трёх языках: русский, английский, грузинский.
// Новый текст добавляется ключом во все три словаря.

const DICT = {
  ru: {
    appTitle: "IARE",
    staff_app: "для сотрудников",
    loading: "Загрузка…",
    login_title: "Вход для сотрудников",
    nick: "Ник",
    password: "Пароль",
    login_btn: "Войти",
    logout: "Выйти",
    version: "Версия",
    retry: "Повторить",
    offline: "Нет интернета — изменения сохранятся, когда связь вернётся",

    err_fill: "Заполните все поля",
    err_login: "Неверный ник или пароль",
    err_noprofile: "Профиль сотрудника не найден или отключён",
    err_network: "Нет связи с сервером",
    err_toomany: "Слишком много попыток. Попробуйте позже",
    err_generic: "Ошибка: {msg}",
    err_nobranches: "Точки ещё не созданы. Первым должен войти главный администратор",
    err_name: "Укажите имя",
    err_nick: "Ник: латиница, цифры, точка, дефис, 3–20 символов",
    err_pass: "Пароль: не меньше 6 символов",
    err_exists: "Такой ник уже занят",

    role_chief: "Главный администратор",
    role_admin: "Администратор",
    role_master: "Мастер",

    hello: "Здравствуйте, {name}",
    branch: "Точка",
    choose_branch: "Выберите вашу точку",
    change_branch: "Сменить точку",

    menu_new_order: "Новый заказ",
    menu_orders: "Заказы",
    menu_settings: "Настройки",
    menu_staff: "Сотрудники",
    menu_money: "Деньги",
    menu_ready: "Отметить готовые",
    menu_earnings: "Мой заработок",
    soon: "Будет на следующих шагах",

    staff_add: "Добавить сотрудника",
    name: "Имя",
    role: "Роль",
    nick_hint: "Латиница, цифры, точка, дефис, 3–20 символов",
    pass_hint: "Не меньше 6 символов. Передайте сотруднику лично",
    save: "Сохранить",
    cancel: "Отмена",
    saved: "Сохранено",
    active: "Активен",
    disabled: "Отключён",
    disable: "Отключить",
    enable: "Включить"
  },

  en: {
    appTitle: "IARE",
    staff_app: "Staff",
    loading: "Loading…",
    login_title: "Staff sign-in",
    nick: "Nickname",
    password: "Password",
    login_btn: "Sign in",
    logout: "Sign out",
    version: "Version",
    retry: "Retry",
    offline: "No internet — changes will be saved when the connection is back",

    err_fill: "Fill in all fields",
    err_login: "Wrong nickname or password",
    err_noprofile: "Staff profile not found or disabled",
    err_network: "No connection to the server",
    err_toomany: "Too many attempts. Try again later",
    err_generic: "Error: {msg}",
    err_nobranches: "No locations yet. The chief admin must sign in first",
    err_name: "Enter a name",
    err_nick: "Nickname: Latin letters, digits, dot, dash, 3–20 characters",
    err_pass: "Password: at least 6 characters",
    err_exists: "This nickname is already taken",

    role_chief: "Chief admin",
    role_admin: "Admin",
    role_master: "Master",

    hello: "Hello, {name}",
    branch: "Location",
    choose_branch: "Choose your location",
    change_branch: "Change location",

    menu_new_order: "New order",
    menu_orders: "Orders",
    menu_settings: "Settings",
    menu_staff: "Staff",
    menu_money: "Money",
    menu_ready: "Mark ready",
    menu_earnings: "My earnings",
    soon: "Coming in the next steps",

    staff_add: "Add staff member",
    name: "Name",
    role: "Role",
    nick_hint: "Latin letters, digits, dot, dash, 3–20 characters",
    pass_hint: "At least 6 characters. Give it to the employee in person",
    save: "Save",
    cancel: "Cancel",
    saved: "Saved",
    active: "Active",
    disabled: "Disabled",
    disable: "Disable",
    enable: "Enable"
  },

  ka: {
    appTitle: "იარე",
    staff_app: "თანამშრომლებისთვის",
    loading: "იტვირთება…",
    login_title: "თანამშრომლის შესვლა",
    nick: "მეტსახელი",
    password: "პაროლი",
    login_btn: "შესვლა",
    logout: "გასვლა",
    version: "ვერსია",
    retry: "ხელახლა ცდა",
    offline: "ინტერნეტი არ არის — ცვლილებები შეინახება კავშირის აღდგენისას",

    err_fill: "შეავსეთ ყველა ველი",
    err_login: "არასწორი მეტსახელი ან პაროლი",
    err_noprofile: "თანამშრომლის პროფილი ვერ მოიძებნა ან გათიშულია",
    err_network: "სერვერთან კავშირი არ არის",
    err_toomany: "ძალიან ბევრი მცდელობა. სცადეთ მოგვიანებით",
    err_generic: "შეცდომა: {msg}",
    err_nobranches: "ფილიალები ჯერ არ არის. პირველად მთავარი ადმინისტრატორი უნდა შევიდეს",
    err_name: "მიუთითეთ სახელი",
    err_nick: "მეტსახელი: ლათინური ასოები, ციფრები, წერტილი, ტირე, 3–20 სიმბოლო",
    err_pass: "პაროლი: მინიმუმ 6 სიმბოლო",
    err_exists: "ეს მეტსახელი უკვე დაკავებულია",

    role_chief: "მთავარი ადმინისტრატორი",
    role_admin: "ადმინისტრატორი",
    role_master: "ოსტატი",

    hello: "გამარჯობა, {name}",
    branch: "ფილიალი",
    choose_branch: "აირჩიეთ თქვენი ფილიალი",
    change_branch: "ფილიალის შეცვლა",

    menu_new_order: "ახალი შეკვეთა",
    menu_orders: "შეკვეთები",
    menu_settings: "პარამეტრები",
    menu_staff: "თანამშრომლები",
    menu_money: "ფინანსები",
    menu_ready: "მზადის მონიშვნა",
    menu_earnings: "ჩემი შემოსავალი",
    soon: "დაემატება შემდეგ ეტაპებზე",

    staff_add: "თანამშრომლის დამატება",
    name: "სახელი",
    role: "როლი",
    nick_hint: "ლათინური ასოები, ციფრები, წერტილი, ტირე, 3–20 სიმბოლო",
    pass_hint: "მინიმუმ 6 სიმბოლო. გადაეცით თანამშრომელს პირადად",
    save: "შენახვა",
    cancel: "გაუქმება",
    saved: "შენახულია",
    active: "აქტიური",
    disabled: "გათიშული",
    disable: "გათიშვა",
    enable: "ჩართვა"
  }
};

export const LANG_LIST = ["ru", "en", "ka"];

let current = detectLang();

function detectLang() {
  try {
    const saved = localStorage.getItem("iare_lang");
    if (LANG_LIST.includes(saved)) return saved;
  } catch (e) { /* хранилище недоступно — берём язык телефона */ }
  const n = (navigator.language || "ru").slice(0, 2).toLowerCase();
  if (n === "ka") return "ka";
  if (n === "en") return "en";
  return "ru";
}

export function getLang() {
  return current;
}

export function setLang(lang) {
  if (!LANG_LIST.includes(lang)) return;
  current = lang;
  try { localStorage.setItem("iare_lang", lang); } catch (e) { /* не критично */ }
  document.documentElement.lang = lang;
}

// t("hello", { name: "Нино" }) → "Здравствуйте, Нино"
export function t(key, vars) {
  let s = (DICT[current] && DICT[current][key]) ?? DICT.ru[key] ?? key;
  if (vars) {
    for (const k of Object.keys(vars)) s = s.split("{" + k + "}").join(String(vars[k]));
  }
  return s;
}

// Названия, которые хранятся в базе на трёх языках: { ru, en, ka }
export function localized(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[current] || value.ru || value.en || "";
}

document.documentElement.lang = current;
