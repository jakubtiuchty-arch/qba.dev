// Jedno źródło prawdy dla faktów na stronie.
// Zasada: na stronie pojawia się tylko to, co jest tu wpisane. Pola ustawione na `null`
// (albo puste tablice) nie są renderowane — nic nie jest dopowiadane ani zmyślane.

export const site = {
  url: 'https://qba.dev',
  brand: 'qba.dev',
  person: {
    name: 'Jakub Tiuchty',
    shortName: 'Kuba',
    role: 'Projektuję i koduję strony internetowe',
    // Rok, od którego zajmujesz się stronami. `null` = zdanie o stażu się nie pokaże.
    since: null as number | null,
    // Zdjęcie z sesji: plik w src/assets/people/, np. 'kuba-portret.jpg'. `null` = brak zdjęcia.
    photo: null as string | null,
    photoAlt: 'Jakub Tiuchty',
  },
  contact: {
    email: 'hello@qba.dev',
    phone: '726 151 515',
    phoneHref: 'tel:+48726151515',
    phoneE164: '+48726151515',
    hours: 'pn–pt, 9:00–17:00',
    responseTime: 'Odpowiadam w ciągu 24 godzin w dni robocze.',
  },
  area: {
    label: 'Trzebnica, Wrocław i okolice',
    places: ['Trzebnica', 'Wrocław', 'powiat trzebnicki', 'Dolny Śląsk'],
  },
  // Dane podmiotu, który wystawia faktury (art. 206 KSH, art. 20 ust. 2 Prawa przedsiębiorców).
  company: {
    name: 'Scanter Sp. z o.o.',
    street: 'ul. Poświęcka 1A',
    postalCode: '51-128',
    city: 'Wrocław',
    nip: '8952040169',
    regon: '360788259',
    krs: '0000543463',
    court: 'Sąd Rejonowy dla Wrocławia-Fabrycznej we Wrocławiu, Wydział Gospodarczy Krajowego Rejestru Sądowego',
    capital: '6 000,00 zł',
  },
  // Profile zewnętrzne. `null` = link się nie pokaże.
  profiles: {
    googleBusiness: null as string | null,
    linkedin: null as string | null,
    github: null as string | null,
  },
} as const;

// Ceny: kwoty są netto, faktura z VAT 23% (Scanter Sp. z o.o.).
// Jeśli kwoty mają być cenami brutto, ustaw `pricesAreNet` na false.
export const pricing = {
  pricesAreNet: true,
  vatRate: 0.23,
  packages: [
    {
      id: 'starter',
      name: 'Starter',
      for: 'Jedna strona dla małej firmy albo osoby, która dopiero startuje.',
      price: 2500,
      support: 14,
      includes: [
        'Strona jednostronicowa (jedna podstrona z sekcjami)',
        'Wersja na telefon, tablet i komputer',
        'Formularz kontaktowy',
        'Podstawowe SEO: tytuły, opisy, dane dla Google, mapa strony',
        '14 dni wsparcia po publikacji',
      ],
      addons: [
        { name: 'Dodatkowa podstrona', price: 400 },
        { name: 'Integracja z systemem mailingowym', price: 500 },
        { name: 'Obsługa SEO', price: 300, monthly: true },
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      for: 'Strona z rozbudowaną ofertą, animacjami i analityką.',
      price: 4500,
      support: 30,
      includes: [
        'Strona z maksymalnie 3 dodatkowymi sekcjami',
        'Wersja na telefon, tablet i komputer',
        'Rozbudowany formularz',
        'Pełne SEO i analityka',
        'Animacje dopasowane do marki',
        '30 dni wsparcia po publikacji',
      ],
      addons: [
        { name: 'Dodatkowa podstrona', price: 400 },
        { name: 'System rezerwacji', price: 600 },
        { name: 'Chatbot AI', price: 800 },
        { name: 'Obsługa SEO', price: 800, monthly: true },
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      for: 'Kilka podstron, projekt od zera i samodzielna edycja treści.',
      price: 7500,
      support: 60,
      includes: [
        'Do 5 podstron',
        'Projekt graficzny od zera',
        'CMS, czyli samodzielna edycja treści',
        'Integracje z CRM i systemem mailingowym',
        'Rozbudowane animacje',
        '60 dni wsparcia po publikacji',
      ],
      addons: [
        { name: 'Wielojęzyczność', price: 1000 },
        { name: 'Panel administracyjny', price: 3500 },
        { name: 'Sklep internetowy', price: 7000 },
        { name: 'Obsługa SEO', price: 1499, monthly: true },
      ],
    },
  ],
  note: 'Ceny nie obejmują domeny i hostingu. Jeśli potrzebujesz czegoś spoza pakietów, wycenię to osobno.',
} as const;

export const process = [
  {
    when: 'Dzień 1',
    title: 'Rozmowa',
    text: '30 minut rozmowy o firmie, klientach i celu strony. Po rozmowie wysyłasz materiały: logo, teksty, zdjęcia.',
  },
  {
    when: 'Dni 2–3',
    title: 'Projekt',
    text: 'Dostajesz projekt strony do akceptacji. W cenie są dwie rundy poprawek.',
  },
  {
    when: 'Dni 4–6',
    title: 'Kodowanie',
    text: 'Zamieniam projekt w działającą stronę: wersja na telefon, formularze, dane dla Google.',
  },
  {
    when: 'Dzień 7',
    title: 'Publikacja',
    text: 'Strona trafia na Twoją domenę i hosting. Pokazuję, jak z niej korzystać.',
  },
] as const;

export const guarantees = [
  {
    title: '7 dni roboczych albo zwrot zaliczki',
    text: 'Liczę od dnia, w którym dostanę komplet materiałów. Jeśli strona nie będzie gotowa w tym terminie, zwracam całą wpłaconą zaliczkę.',
  },
  {
    title: 'Strona i kod należą do Ciebie',
    text: 'Dostajesz pełne prawa do kodu. Domena i hosting są zapisane na Ciebie, więc w każdej chwili możesz przejść do kogoś innego.',
  },
] as const;

// Opinie klientów. Wpisuj tylko prawdziwe opinie, za zgodą autora.
// Pusta tablica = sekcja z opiniami się nie pokaże.
export const testimonials: ReadonlyArray<{
  quote: string;
  author: string;
  company: string;
  town: string;
  url?: string;
  project?: string; // slug realizacji, np. 'lux-meble'
}> = [];

export const nav = [
  { href: '/realizacje/', label: 'Realizacje' },
  { href: '/oferta/', label: 'Oferta i ceny' },
  { href: '/o-mnie/', label: 'O mnie' },
  { href: '/kontakt/', label: 'Kontakt' },
] as const;

export function gross(net: number): number {
  return Math.round(net * (1 + pricing.vatRate));
}

export function formatPLN(amount: number): string {
  // Polski zapis: spacja niełamliwa jako separator tysięcy, "zł" na końcu.
  return `${new Intl.NumberFormat('pl-PL', { useGrouping: 'always' } as Intl.NumberFormatOptions)
    .format(amount)
    .replace(/\s/g, ' ')} zł`;
}
