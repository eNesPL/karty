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
* **Wyszukiwarka i zaawansowane filtry**:
  * Szukanie po nazwie, dodatku lub typie.
  * Filtry kolorów: Biały {W}, Niebieski {U}, Czarny {B}, Czerwony {R}, Zielony {G}, Wielokolorowe {M}, Bezbarwne {C}.
  * Filtr wersji Foil ✨ i sortowanie cenowe.
* **Panel Administratora (`/admin`)**:
  * Zabezpieczony kodem PIN (domyślny: `1234`, zmienny w ustawieniach).
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
