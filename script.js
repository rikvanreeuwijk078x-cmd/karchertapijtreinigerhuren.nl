const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-navigation");
const year = document.querySelector("#current-year");
// Zakelijk WhatsApp-nummer in internationaal formaat, alleen cijfers.
const whatsappNumber = "31615346941";

// Start a fresh mobile visit to the homepage at the top instead of restoring
// a previous scroll position. Explicit fragment links such as #reservation remain intact.
const isMobileHomepageEntry = window.matchMedia("(max-width: 700px)").matches && !window.location.hash;
if (isMobileHomepageEntry && "scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
if (isMobileHomepageEntry) {
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted && !window.location.hash) {
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        if ("scrollRestoration" in history) history.scrollRestoration = "auto";
      });
    } else if ("scrollRestoration" in history) {
      history.scrollRestoration = "auto";
    }
  }, { once: true });
}

if (year) {
  year.textContent = new Date().getFullYear();
}

const cleanWhatsappNumber = whatsappNumber.replace(/\D/g, "");
if (/^\d{8,15}$/.test(cleanWhatsappNumber)) {
  document.querySelectorAll(".whatsapp-link").forEach((link) => {
    const message = "Hoi, ik heb een vraag over het huren van de Kärcher reiniger.";
    link.href = `https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent(message)}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });
}

if (menuToggle && navigation) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.querySelector(".sr-only").textContent = isOpen ? "Menu openen" : "Menu sluiten";
    navigation.classList.toggle("is-open", !isOpen);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.querySelector(".sr-only").textContent = "Menu openen";
      navigation.classList.remove("is-open");
    }
  });
}

// Toon één inhoudsweergave tegelijk; elke sectie blijft via de navigatie bereikbaar.
const viewSections = [...document.querySelectorAll("main [data-view]")];
const viewLinks = [...document.querySelectorAll("#primary-navigation a[href^='#']")];
const viewIds = new Set(viewSections.map((section) => section.id));

function showView() {
  const requestedId = window.location.hash.slice(1);
  const requestedSection = document.getElementById(requestedId);
  const activeView = requestedSection?.dataset.view || "home";

  viewSections.forEach((section) => {
    section.hidden = section.dataset.view !== activeView;
  });
  viewLinks.forEach((link) => {
    const target = document.getElementById(link.hash.slice(1));
    if (target?.id === (requestedSection?.id || "home") && viewIds.has(target.id)) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

window.addEventListener("hashchange", showView);
showView();

// Toon de persoonlijke kennismaking één keer per browsersessie, na één seconde.
const welcomeCard = document.querySelector("#welcome-card");
if (welcomeCard) {
  const welcomeKey = "rik-welcome-dismissed-v1";
  const legacyWelcomeKey = "rik-welcome-shown";
  const forceWelcomeForTest = new URLSearchParams(window.location.search).get("welcome") === "1";
  // Oude versies bewaarden ook een status wanneer de melding alleen was getoond.
  // Die status mag de herstelde melding niet onbedoeld blijven verbergen.
  try { sessionStorage.removeItem(legacyWelcomeKey); } catch (_) { /* Sessie-opslag kan geblokkeerd zijn. */ }
  const closeWelcome = () => {
    welcomeCard.classList.remove("is-visible");
    welcomeCard.hidden = true;
  };
  welcomeCard.querySelector(".welcome-close").addEventListener("click", () => {
    try { sessionStorage.setItem(welcomeKey, "1"); } catch (_) { /* Opslag kan door browserinstellingen geblokkeerd zijn. */ }
    closeWelcome();
  });
  welcomeCard.querySelector(".welcome-link").addEventListener("click", () => {
    try { sessionStorage.setItem(welcomeKey, "1"); } catch (_) { /* Opslag kan door browserinstellingen geblokkeerd zijn. */ }
    closeWelcome();
  });
  window.setTimeout(() => {
    let dismissed = false;
    try { dismissed = sessionStorage.getItem(welcomeKey) === "1"; } catch (_) { /* Ga door zonder sessie-opslag. */ }
    const hashTarget = window.location.hash ? document.getElementById(window.location.hash.slice(1)) : null;
    const isHomepageView = !hashTarget || hashTarget.dataset.view === "home";
    if (isHomepageView && (forceWelcomeForTest || !dismissed)) {
      welcomeCard.hidden = false;
      requestAnimationFrame(() => welcomeCard.classList.add("is-visible"));
    }
  }, 1000);
  window.addEventListener("hashchange", () => {
    if (window.location.hash !== "#home" && welcomeCard.classList.contains("is-visible")) closeWelcome();
  });
}

const bookingForm = document.querySelector("#reservation-form");
if (bookingForm) {
  const rentalType = document.querySelector("#rental-type");
  const startDate = document.querySelector("#start-date");
  const endDate = document.querySelector("#end-date");
  const endDateWrap = document.querySelector("#end-date-wrap");
  const dateHint = document.querySelector("#date-hint");
  const rentalHint = document.querySelector("#rental-hint");
  const tabletQuantity = document.querySelector("#tablet-quantity");
  const sprayQuantity = document.querySelector("#spray-quantity");
  const bookingError = document.querySelector("#booking-error");
  const formatMoney = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
  const formatDate = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const formatCalendarMonth = new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric" });
  const dateFromInput = (value) => {
    if (!value) return null;
    const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
    if (!match) return null;
    const [, dayText, monthText, yearText] = match;
    const date = new Date(Number(yearText), Number(monthText) - 1, Number(dayText));
    return date.getFullYear() === Number(yearText) && date.getMonth() === Number(monthText) - 1 && date.getDate() === Number(dayText) ? date : null;
  };
  const toInputDate = (date) => `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
  const addDays = (date, count) => {
    const result = new Date(date);
    result.setDate(result.getDate() + count);
    return result;
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function setupCalendar(input) {
    const wrapper = input.closest(".date-input-wrap");
    const toggle = wrapper.querySelector("[data-calendar-toggle]");
    const picker = wrapper.querySelector(".date-picker");
    const monthTitle = picker.querySelector(".calendar-heading strong");
    const daysGrid = picker.querySelector(".calendar-days");
    let shownMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    function renderCalendar() {
      monthTitle.textContent = formatCalendarMonth.format(shownMonth);
      daysGrid.replaceChildren();
      const firstDay = new Date(shownMonth.getFullYear(), shownMonth.getMonth(), 1);
      const offset = (firstDay.getDay() + 6) % 7;
      for (let blank = 0; blank < offset; blank += 1) {
        const spacer = document.createElement("span");
        spacer.setAttribute("aria-hidden", "true");
        daysGrid.append(spacer);
      }
      const dayCount = new Date(shownMonth.getFullYear(), shownMonth.getMonth() + 1, 0).getDate();
      const selectedDate = dateFromInput(input.value);
      for (let day = 1; day <= dayCount; day += 1) {
        const date = new Date(shownMonth.getFullYear(), shownMonth.getMonth(), day);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "calendar-day";
        button.textContent = String(day);
        button.setAttribute("aria-label", formatDate.format(date));
        button.disabled = input === startDate ? date < today : date <= (dateFromInput(startDate.value) || today);
        if (selectedDate && date.getTime() === selectedDate.getTime()) button.classList.add("is-selected");
        if (date.getTime() === today.getTime()) button.classList.add("is-today");
        button.addEventListener("click", () => {
          input.value = toInputDate(date);
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
          closeCalendar();
          input.focus();
        });
        daysGrid.append(button);
      }
    }

    function openCalendar() {
      if (input.disabled) return;
      const selectedDate = dateFromInput(input.value);
      const initialDate = selectedDate || today;
      shownMonth = new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
      renderCalendar();
      picker.hidden = false;
      input.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-expanded", "true");
    }

    function closeCalendar() {
      picker.hidden = true;
      input.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", () => picker.hidden ? openCalendar() : closeCalendar());
    picker.querySelector("[data-calendar-prev]").addEventListener("click", () => {
      shownMonth = new Date(shownMonth.getFullYear(), shownMonth.getMonth() - 1, 1);
      renderCalendar();
    });
    picker.querySelector("[data-calendar-next]").addEventListener("click", () => {
      shownMonth = new Date(shownMonth.getFullYear(), shownMonth.getMonth() + 1, 1);
      renderCalendar();
    });
    document.addEventListener("click", (event) => {
      if (!wrapper.contains(event.target)) closeCalendar();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !picker.hidden) {
        closeCalendar();
        toggle.focus();
      }
    });
    input.addEventListener("input", renderCalendar);
    input.addEventListener("change", renderCalendar);
  }

  setupCalendar(startDate);
  setupCalendar(endDate);

  function setDateMode() {
    const isWeekend = rentalType.value === "weekend";
    endDateWrap.hidden = isWeekend;
    endDate.disabled = isWeekend;
    endDate.required = !isWeekend;
    rentalHint.textContent = isWeekend
      ? "De weekenddeal geldt van vrijdagavond tot maandagavond en kost € 70,-."
      : "Meerdere dagen nodig? Je betaalt € 40,- per huurdag.";
    dateHint.textContent = isWeekend
      ? "De weekenddeal loopt van vrijdagavond tot maandagavond. Wil je op zaterdag starten, kies dan dagverhuur."
      : "Kies je start- en einddatum. De einddatum telt niet mee als huurdag; maandag tot vrijdag is dus vier dagen.";
    endDate.setCustomValidity("");
    updateSummary();
  }

  function getBooking() {
    const start = dateFromInput(startDate.value);
    let end = dateFromInput(endDate.value);
    const isWeekend = rentalType.value === "weekend";
    const result = { start, end, days: 0, rent: 0, valid: false, message: "" };
    if (startDate.value && !start) {
      result.message = "Vul de datum in als dd-mm-jjjj en kies een geldige datum.";
      return result;
    }
    if (!start) return result;
    if (start < today) {
      result.message = "Kies een datum vanaf vandaag.";
      return result;
    }
    if (isWeekend) {
      if (start.getDay() !== 5) {
        result.message = "De weekenddeal start op vrijdagavond. Kies vrijdag, of selecteer dagverhuur voor een andere startdag.";
        return result;
      }
      end = addDays(start, 3);
      result.days = 3;
      result.rent = 70;
      result.valid = true;
      result.end = end;
      return result;
    }
    if (endDate.value && !end) {
      result.message = "Vul de einddatum in als dd-mm-jjjj en kies een geldige datum.";
      return result;
    }
    if (!end) return result;
    if (end <= start) {
      result.message = "Kies een einddatum na de startdatum.";
      return result;
    }
    result.days = Math.round((end - start) / 86400000);
    result.rent = result.days * 40;
    result.valid = true;
    result.end = end;
    return result;
  }

  function updateSummary() {
    const booking = getBooking();
    const tablets = Math.max(0, Number.parseInt(tabletQuantity.value, 10) || 0);
    const sprays = Math.max(0, Number.parseInt(sprayQuantity.value, 10) || 0);
    const accessoryTotal = tablets * 5 + sprays * 21.5;
    const total = booking.valid ? booking.rent + accessoryTotal : null;
    document.querySelector("#summary-period").textContent = booking.valid
      ? `${rentalType.value === "weekend" ? "Weekenddeal" : `Dagverhuur · ${booking.days} ${booking.days === 1 ? "dag" : "dagen"}`} · ${formatDate.format(booking.start)} t/m ${formatDate.format(booking.end)}`
      : booking.message || "Kies je datum";
    document.querySelector("#summary-rental").textContent = formatMoney.format(booking.rent);
    document.querySelector("#summary-tablets").textContent = tablets ? `${tablets} × verpakking van 3 · ${formatMoney.format(tablets * 5)}` : "Niet geselecteerd";
    document.querySelector("#summary-sprays").textContent = sprays ? `${sprays} × ${formatMoney.format(21.5)} · ${formatMoney.format(sprays * 21.5)}` : "Niet geselecteerd";
    document.querySelector("#summary-total").textContent = total === null ? "Kies datum" : formatMoney.format(total);
    const validStart = dateFromInput(startDate.value);
    const validEnd = dateFromInput(endDate.value);
    const startError = startDate.value && !validStart
      ? "Vul de datum in als dd-mm-jjjj en kies een geldige datum."
      : booking.message && (rentalType.value === "weekend" || booking.message.includes("vanaf vandaag")) ? booking.message : "";
    const endError = endDate.value && !validEnd
      ? "Vul de einddatum in als dd-mm-jjjj en kies een geldige datum."
      : booking.message && rentalType.value === "day" && validStart && !booking.message.includes("vanaf vandaag") ? booking.message : "";
    startDate.setCustomValidity(startError);
    endDate.setCustomValidity(endError);
  }

  rentalType.addEventListener("change", setDateMode);
  startDate.addEventListener("change", () => {
    const start = dateFromInput(startDate.value);
    if (start) {
      if (rentalType.value === "weekend" && start.getDay() === 5) endDate.value = toInputDate(addDays(start, 3));
    }
    updateSummary();
  });
  startDate.addEventListener("input", updateSummary);
  endDate.addEventListener("change", updateSummary);
  endDate.addEventListener("input", updateSummary);
  tabletQuantity.addEventListener("input", updateSummary);
  sprayQuantity.addEventListener("input", updateSummary);
  document.querySelectorAll("[data-add-accessory]").forEach((button) => {
    button.addEventListener("click", () => {
      const quantityInput = button.dataset.addAccessory === "tablets" ? tabletQuantity : sprayQuantity;
      quantityInput.value = String(Math.min(Number(quantityInput.max), Number(quantityInput.value || 0) + 1));
      quantityInput.dispatchEvent(new Event("input", { bubbles: true }));
      window.location.hash = "reservation";
    });
  });
  setDateMode();

  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    bookingError.hidden = true;
    const booking = getBooking();
    updateSummary();
    if (!booking.valid) {
      if (!startDate.value || !dateFromInput(startDate.value) || booking.message.includes("vanaf vandaag") || rentalType.value === "weekend") startDate.reportValidity();
      else endDate.reportValidity();
      return;
    }
    if (!bookingForm.reportValidity()) return;

    const tablets = Math.max(0, Number.parseInt(tabletQuantity.value, 10) || 0);
    const sprays = Math.max(0, Number.parseInt(sprayQuantity.value, 10) || 0);
    const total = booking.rent + tablets * 5 + sprays * 21.5;
    const data = new FormData(bookingForm);
    const address = `${data.get("postcode")} ${data.get("houseNumber")}${data.get("addition") ? ` ${data.get("addition")}` : ""}`;
    const message = [
      "Hallo! Ik wil graag een Kärcher Puzzi 8/1 huren.",
      "",
      `Naam: ${data.get("name")}`,
      `Telefoonnummer: ${data.get("phone")}`,
      `Gewenste huurperiode: ${rentalType.value === "weekend" ? "Weekenddeal (vrijdagavond tot maandagavond)" : `Dagverhuur (${booking.days} ${booking.days === 1 ? "dag" : "dagen"})`}`,
      `Gewenste datum: ${formatDate.format(booking.start)} t/m ${formatDate.format(booking.end)}`,
      `Postcode en huisnummer: ${address}`,
      "",
      "Aanvullende producten:",
      `Aantal reinigingstabletten (verpakkingen van 3): ${tablets}`,
      `Aantal impregneersprays: ${sprays}`,
      "",
      `Totale indicatieve prijs: ${formatMoney.format(total)}`,
      `Opmerkingen: ${data.get("notes") || "Geen"}`,
      "",
      "Kun je de beschikbaarheid bevestigen? Ik begrijp dat dit een aanvraag is en nog geen definitieve reservering."
    ].join("\n");
    const whatsappUrl = `https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  });
}
