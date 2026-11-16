# MTG Klaser & Rezerwacje 🃏

Lekka, szybka aplikacja webowa stworzona specjalnie dla graczy i kolekcjonerów *Magic: The Gathering*, którzy chcą wystawiać swoje karty z cenami i umożliwić znajomym/klientom **rezerwację na konkretny dzień gry (np. wtorek / czwartek) za pomocą kodu QR**.

---

## 🚀 Jak to działa?

1. **Naklejasz Kod QR na swój deckbox lub klaser** (kod generuje się w panelu admina jednym kliknięciem).
2. Gracz na turnieju skanuje kod telefonem → otwiera się mobilny katalog Twoich kart.
3. Wybiera karty, wpisuje swój nick, kontakt i wybiera dzień odbioru (*Wtorek (turniej)* lub *Czwartek (commander)*).
4. Kliknięcie „Potwierdź rezerwację”:
   - Karta zostaje automatycznie zarezerwowana (stan magazynowy pomniejsza się o wybraną ilość, nikt inny jej nie podkradnie).
   - Otrzymujesz natychmiastowe powiadomienie na swój prywatny kanał **Discord** (bogaty embed z listą kart, zdjęciem, łączną kwotą i kontaktem do gracza).

---

## 🛠️ Funkcje

* **Eksport i Import z ManaBox (CSV)**:
  * Wgrywasz plik `.csv` wyeksportowany prosto z aplikacji ManaBox.
  * Karty automatycznie otrzymują oficjalne zdjęcia w wysokiej rozdzielczości ze Scryfall CDN.
  * Opcje cenowe: zachowanie cen z ManaBoxa, pobranie świeżych cen Cardmarket EUR ze Scryfall (z przelicznikiem EUR → PLN) lub stała cena.
* **Skup Kart (Buylist / „Kupię / Poszukuję”)**:
  * Nowa zakładka na stronie głównej dla graczy: mogą zobaczyć, jakie karty chcesz od nich kupić na turnieju i ile za nie płacisz (w PLN).
  * Przycisk „Mam tę kartę”: gracz wybiera ilość, stan i wersję foil, wpisuje nick i termin spotkania, a Ty otrzymujesz natychmiastowe powiadomienie na Discord.
  * W panelu admina (`/admin`):
    * **Masowe dodawanie kart do skupu**: wklejanie listy tekstowej (wantlist / decklist np. `4 Orcish Bowmasters`, `2 Sheoldred (DMU) 107`, `1 The One Ring *F*`) lub wgrywanie pliku CSV z ManaBoxa.
    * Automatyczna wycena hurtowa ze Scryfall (np. 75% wartości rynkowej Cardmarket EUR przeliczonej na PLN lub stała cena).
    * Podgląd wszystkich rozpoznanych kart z edycją cen bezpośrednio w tabeli przed importem.
    * Ręczne dodawanie pojedynczych kart ze Scryfall oraz zarządzanie ofertami odkupu od graczy.
* **Wyszukiwarka i zaawansowane filtry**:
  * Szukanie pełnotekstowe po nazwie, dodatku, numerze lub typie karty.
  * Filtry kolorów: Wszystkie, Biały {W}, Niebieski {U}, Czarny {B}, Czerwony {R}, Zielony {G}, Wielokolorowe {M}, Bezbarwne {C}.
  * Rozwijany panel zaawansowanych filtrów z licznikiem aktywnych reguł:
    * **Typ karty**: Stwory (Creature), Instanty, Czary (Sorcery), Zauroczenia (Enchantment), Artefakty, Planeswalkerzy, Lądy (Land), Bitwy.
    * **Rzadkość (Rarity)**: Mityczna (Mythic), Rzadka (Rare), Niezwykła (Uncommon), Zwykła (Common) z kolorowymi wskaźnikami.
    * **Dodatek (Set)**: Dynamiczna lista dodatków z liczbą sztuk w ofercie (np. Modern Horizons 2, Dominaria Remastered).
    * **Cena (PLN)**: Szybkie presety (&lt; 10 zł, 10-50 zł, 50-100 zł, &gt; 100 zł) oraz precyzyjne pola Od / Do.
    * **Wykończenie**: Wszystkie, Tylko Foil ✨, Tylko Non-foil (Zwykłe).
    * **Stan karty**: Near Mint (NM), Lightly Played (LP/EX), Moderately Played (MP), Heavily Played (HP), Damaged (DMG).
    * **Dostępność**: Tylko karty na stanie (ilość &gt; 0) lub wszystkie (w tym wyprzedane).
  * Pasek aktywnych filtrów (chips) z możliwością usuwania pojedynczych filtrów jednym kliknięciem oraz przyciskiem „Wyczyść wszystko”.
  * Sortowanie: Cena (najwyższa / najniższa), Nazwa (A-Z / Z-A), Rzadkość (od mitycznych), Najnowsze.
  * Filtrowanie w panelu magazynu administratora (`/admin`) po dodatku, rzadkości, wersji foil i stanie magazynowym.
* **Panel Administratora (`/admin`)**:
  * Zabezpieczony hasłem (domyślne: `haslo`, zmienne w ustawieniach).
  * Zarządzanie zamówieniami: oznaczanie jako odebrane lub anulowanie (anulowanie automatycznie zwraca karty do magazynu).
  * Ręczne dodawanie pojedynczych kart z podpowiedzią na żywo ze Scryfall.
  * Wbudowany generator i drukowanie kodu QR.
  * Konfiguracja webhooka Discord z przyciskiem testowym.

---

## 🏃 Uruchomienie lokalne

Aplikacja jest już w pełni zbudowana w Twoim katalogu.

```bash
# Uruchomienie serwera produkcyjnego:
pnpm start

# Albo w trybie deweloperskim:
pnpm dev
```

Aplikacja wystartuje pod adresem:
* **Lokalnie:** `http://localhost:3000`
* **W Twojej sieci Wi-Fi (dostępna z telefonu):** np. `http://192.168.1.X:3000` (dokładny adres wyświetli się w konsoli po uruchomieniu).

---

## 📱 Dostęp z telefonu na turnieju (Wdrożenie w 2 minuty)

Aby kod QR działał z dowolnego telefonu bez bycia w tym samym Wi-Fi, możesz wdrożyć tę aplikację całkowicie za darmo:

1. **Vercel / Render / Railway / VPS**:
   * Projekt to standardowy **Next.js (App Router)** z bazą danych w SQLite (`data/karty.db`).
   * Jeśli wrzucasz na VPS lub Render/Railway z dyskiem persistent: wystarczy `pnpm build && pnpm start`.
   * Jeśli używasz darmowego tunelu do testów na żywo: możesz użyć np. `ngrok http 3000` lub `cloudflared tunnel`.

---

## 🔗 Integracja z MTGSpot Scraper (Monitoring ofert dla skupu)

Aplikacja `karty` pełni rolę **źródła prawdy dla buylisty (skupu)** i udostępnia dedykowane endpointy integracyjne dla serwisu `eNesPL/mtgspot-scraper`. Integracja ma charakter wyłącznie **informacyjno-monitoringowy** (wyszukuje i prezentuje dopasowane oferty z MTGSpot w zakładce `Oferty skupu` w panelu `/admin`, bez automatycznego zakupu czy rezerwacji).

### Zmienne środowiskowe (`karty`)
Skopiuj `.env.example` do `.env.local` i skonfiguruj:
* `MTGSPOT_SYNC_TOKEN` — wspólny, losowy token autoryzacyjny (min. 8 znaków), identyczny z `KARTY_SYNC_TOKEN` w serwisie `mtgspot-scraper`. Nie używaj tutaj hasła administratora (`admin_password`).
* `MTGSPOT_SCRAPER_API_URL` *(opcjonalnie)* — adres URL serwisu `mtgspot-scraper` (np. `http://localhost:8000`), pozwalający ręcznie wyzwolić pełny cykl synchronizacji przyciskiem w panelu `/admin`.
* `KARTY_ALLOW_HTTP=true` *(opcjonalnie)* — zezwala na komunikację po HTTP w sieci wewnętrznej przy `NODE_ENV=production`.

### Endpointy integracyjne (chronione nagłówkiem `Authorization: Bearer <MTGSPOT_SYNC_TOKEN>`)
* `GET /api/integrations/mtgspot/wantlist` — zwraca aktywne pozycje buylisty (`buylist_cards` z `active = 1` oraz `quantity > 0`), z rozdzieleniem ceny docelowej (`target_price`) od ceny ofertowej.
* `POST /api/integrations/mtgspot/offers` — przyjmuje paczkę dopasowanych ofert z `mtgspot-scraper`, wykonuje idempotentny upsert po `(buylist_item_id, external_id)` i oznacza wcześniejsze oferty jako niedostępne (`is_available = 0`, `stock = 0`) wyłącznie dla kart, których skan na MTGSpot zakończył się pełnym sukcesem (`synced_buylist_item_ids`).
* `GET /api/integrations/mtgspot/status` — zwraca status ostatniej synchronizacji, liczniki ofert, czas ostatniej próby/sukcesu oraz ewentualny komunikat błędu.

