const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-navigation");
const year = document.querySelector("#current-year");
// Vul hier je WhatsApp-nummer in met landcode, alleen cijfers (bijv. 31612345678).
const whatsappNumber = "";

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
    if (event.target instanceof HTMLAnchorElement) {
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
    if (target?.dataset.view === activeView && viewIds.has(target.id)) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

window.addEventListener("hashchange", showView);
showView();
