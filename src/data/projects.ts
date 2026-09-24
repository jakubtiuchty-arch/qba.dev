import type { ImageMetadata } from 'astro';
import serwisZebry from '../assets/portfolio/serwis-zebry.jpg';
import luxMeble from '../assets/portfolio/lux-meble.jpg';
import rejestratory from '../assets/portfolio/rejestratory.jpg';
import ezdrp24 from '../assets/portfolio/ezdrp24.jpg';

// Realizacje. Tylko fakty. Pola `results` i `year` uzupełniaj wyłącznie prawdziwymi danymi —
// `null` oznacza, że dana sekcja się nie pokaże.
export interface Project {
  slug: string;
  name: string;
  url: string;
  domain: string;
  sector: string;
  /** Jedno zdanie do kart i opisów. */
  summary: string;
  /** Czym zajmuje się klient i do czego służy strona. */
  context: string;
  /** Co zostało zrobione. */
  scope: string[];
  stack: string[];
  image: ImageMetadata;
  imageAlt: string;
  year: number | null;
  /** Mierzalne efekty, np. „Liczba zapytań z formularza wzrosła z 4 do 11 miesięcznie”. */
  results: string[] | null;
}

export const projects: Project[] = [
  {
    slug: 'lux-meble',
    name: 'Lux Meble',
    url: 'https://www.lux-meble.pl/',
    domain: 'lux-meble.pl',
    sector: 'Meble na wymiar · klienci indywidualni',
    summary: 'Strona producenta mebli na wymiar, która pokazuje realizacje i zbiera zapytania o wycenę.',
    context:
      'Lux Meble projektuje i wykonuje meble na wymiar. Strona ma pokazać gotowe realizacje i ułatwić zamówienie bezpłatnej wyceny.',
    scope: [
      'Projekt graficzny podkreślający charakter marki',
      'Prezentacja oferty i realizacji',
      'Prosta nawigacja i formularz bezpłatnej wyceny',
      'Wersja na telefon i podstawowe SEO',
    ],
    stack: ['Strona firmowa', 'Wersja mobilna', 'SEO'],
    image: luxMeble,
    imageAlt: 'Strona główna Lux Meble: zdjęcie drewnianych schodów, nagłówek „Precyzja rzemiosła spotyka wyjątkowy design” i przycisk bezpłatnej wyceny',
    year: null,
    results: null,
  },
  {
    slug: 'serwis-zebry',
    name: 'Serwis-Zebry.pl',
    url: 'https://serwis-zebry.pl/',
    domain: 'serwis-zebry.pl',
    sector: 'Serwis urządzeń Zebra · firmy',
    summary: 'System serwisowy z asystentem AI, który prowadzi klienta od opisu usterki do opłaconej naprawy.',
    context:
      'Serwis naprawia urządzenia Zebra. Celem było, żeby zgłoszenie, płatność i faktura nie wymagały ręcznej obsługi.',
    scope: [
      'Asystent AI do wstępnej diagnozy usterek, oparty na dokumentacji urządzeń (RAG)',
      'Automatyczny obieg zgłoszeń od usterki do naprawy',
      'Płatności online przez Stripe i faktury PDF',
      'Integracja z BaseLinkerem',
    ],
    stack: ['Next.js', 'Supabase', 'Stripe', 'Vertex AI / Gemini', 'RAG', 'Framer Motion'],
    image: serwisZebry,
    imageAlt: 'Strona główna Serwis-Zebry.pl: nagłówek „Serwis Zebra” i pole do opisania usterki',
    year: null,
    results: null,
  },
  {
    slug: 'rejestratory',
    name: 'Rejestratory.info',
    url: 'https://www.rejestratory.info/',
    domain: 'rejestratory.info',
    sector: 'Sprzęt IT dla leśnictwa · firmy',
    summary: 'Platforma dla branży leśnej: katalog sprzętu, panel urządzeń i zgłoszenia serwisowe z zamówieniem kuriera.',
    context:
      'Rejestratory.info dostarcza leśnictwu terminale terenowe, komputery i drukarki. Platforma łączy katalog sprzętu z obsługą serwisową.',
    scope: [
      'Panel zarządzania urządzeniami klienta',
      'Formularze serwisowe z zamówieniem kuriera',
      'Kontrola przeglądów drukarek fiskalnych wraz z protokołami',
      'Katalog produktów z wyszukiwarką',
    ],
    stack: ['Panel klienta', 'Serwis', 'Drukarki fiskalne'],
    image: rejestratory,
    imageAlt: 'Strona główna Rejestratory.info: zdjęcie lasu, nagłówek o sprzęcie IT dla leśnictwa i wyszukiwarka produktów',
    year: null,
    results: null,
  },
  {
    slug: 'ezdrp24',
    name: 'EZDRP24',
    url: 'https://ezdrp24.com.pl/',
    domain: 'ezdrp24.com.pl',
    sector: 'Sektor publiczny · urzędy i jednostki',
    summary: 'Strona z panelem klienta, przez którą jednostki publiczne zamawiają zestawy do EZD RP i materiały eksploatacyjne.',
    context:
      'EZDRP24 oferuje jednostkom publicznym zestawy sprzętu do elektronicznego zarządzania dokumentacją (EZD RP) oraz materiały eksploatacyjne.',
    scope: [
      'Strona z ofertą zestawów do EZD RP',
      'Panel klienta dla jednostek publicznych',
      'Zamawianie materiałów eksploatacyjnych: etykiet i taśm termotransferowych',
    ],
    stack: ['Strona firmowa', 'Panel klienta', 'Zamówienia online'],
    image: ezdrp24,
    imageAlt: 'Strona główna EZDRP24: nagłówek „EZD RP – zestawy dla jednostek publicznych” i ilustracja zestawu komputer, skaner, drukarka etykiet',
    year: null,
    results: null,
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
