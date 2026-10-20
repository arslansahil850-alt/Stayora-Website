
document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

  const toastContainer = $(".toast-container");

  function showToast(message, type = "success") {
    if (!toastContainer) {
      console.log(message);
      return;
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "toast-error" : ""}`;

    const icon = document.createElement("span");
    icon.textContent = type === "error" ? "!" : "✓";
    icon.setAttribute("aria-hidden", "true");

    const text = document.createElement("span");
    text.textContent = message;

    toast.append(icon, text);
    toastContainer.appendChild(toast);

    window.setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";

      window.setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  window.showToast = showToast;

  /* Loader */

  const loader = $(".site-loader");

  function hideLoader() {
    if (!loader) return;

    loader.classList.add("is-hidden");

    window.setTimeout(() => {
      loader.style.display = "none";
    }, 500);
  }

  window.addEventListener("load", hideLoader);
  window.setTimeout(hideLoader, 2500);

  /* Mobile navigation */

  const menuToggle = $(".mobile-menu-toggle");
  const navLinks = $(".nav-links");

  function closeMobileMenu() {
    if (!menuToggle || !navLinks) return;

    menuToggle.classList.remove("is-active");
    navLinks.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  if (menuToggle && navLinks) {
    menuToggle.setAttribute("aria-expanded", "false");

    menuToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("is-open");

      menuToggle.classList.toggle("is-active", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    $$(".nav-link", navLinks).forEach(link => {
      link.addEventListener("click", closeMobileMenu);
    });

    document.addEventListener("click", event => {
      if (
        navLinks.classList.contains("is-open") &&
        !navLinks.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        closeMobileMenu();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) closeMobileMenu();
    });
  }

  /* Sticky header */

  const header = $(".site-header");

  function updateHeader() {
    if (!header) return;

    header.classList.toggle("is-scrolled", window.scrollY > 20);
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  /* Expandable sections */

  $$("[data-expand-target]").forEach(button => {
    const targetId = button.getAttribute("data-expand-target");
    const target = targetId ? document.getElementById(targetId) : null;

    if (!target) return;

    const updateButton = expanded => {
      button.setAttribute("aria-expanded", String(expanded));

      const label = $("[data-expand-label]", button);

      if (label) {
        label.textContent = expanded
          ? button.dataset.collapseText || "Show less"
          : button.dataset.expandText || "Explore more";
      }
    };

    updateButton(!target.hidden);

    button.addEventListener("click", () => {
      const willExpand = target.hidden;

      target.hidden = !willExpand;
      target.classList.toggle("is-expanded", willExpand);
      updateButton(willExpand);

      if (willExpand) {
        window.setTimeout(() => {
          target.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
          });
        }, 80);
      }
    });
  });

  $$("[data-collapse-target]").forEach(button => {
    button.addEventListener("click", () => {
      const target = document.getElementById(
        button.getAttribute("data-collapse-target")
      );

      if (!target) return;

      target.hidden = true;
      target.classList.remove("is-expanded");

      const expandButton = $(
        `[data-expand-target="${target.id}"]`
      );

      if (expandButton) {
        expandButton.setAttribute("aria-expanded", "false");

        const label = $("[data-expand-label]", expandButton);

        if (label) {
          label.textContent =
            expandButton.dataset.expandText || "Explore more";
        }
      }
    });
  });

  /* FAQ accordion */

  $$(".faq-item").forEach(item => {
    const trigger = $("button", item);
    const answer = $(".faq-answer", item);

    if (!trigger || !answer) return;

    trigger.setAttribute("aria-expanded", String(!answer.hidden));

    trigger.addEventListener("click", () => {
      const shouldOpen = answer.hidden;

      $$(".faq-item").forEach(otherItem => {
        const otherButton = $("button", otherItem);
        const otherAnswer = $(".faq-answer", otherItem);

        if (!otherButton || !otherAnswer) return;

        otherAnswer.hidden = true;
        otherItem.classList.remove("is-open");
        otherButton.setAttribute("aria-expanded", "false");
      });

      if (shouldOpen) {
        answer.hidden = false;
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* Hotel cards and filtering */

  const hotelGrid = $(".hotel-results-grid");
  const hotelSearchInput = $(".filter-search");
  const hotelSort = $("#hotelSort");
  const hotelCategory = $("#hotelCategory");
  const hotelCount = $("#hotelCount");
  const hotelEmpty = $(".empty-state");

  let activeHotelQuery = "";
  let activeCategory = "all";
  let activeSort = "recommended";

  function getHotelCards() {
    if (!hotelGrid) return [];

    return $$(".hotel-card", hotelGrid);
  }

  function getHotelName(card) {
    return ($("h3", card)?.textContent || "").trim();
  }

  function getHotelPrice(card) {
    const priceElement = $(".hotel-price", card);
    const priceText = priceElement?.textContent || "";
    const match = priceText.replace(/,/g, "").match(/\d+(?:\.\d+)?/);

    return match ? Number(match[0]) : 0;
  }

  function getHotelRating(card) {
    const ratingText = card.dataset.rating ||
      $(".hotel-rating", card)?.textContent ||
      "";

    const match = ratingText.match(/\d+(?:\.\d+)?/);

    return match ? Number(match[0]) : 0;
  }

  function getHotelCategory(card) {
    return (
      card.dataset.category ||
      card.dataset.type ||
      "all"
    ).toLowerCase();
  }

  function applyHotelFilters() {
    if (!hotelGrid) return;

    const cards = getHotelCards();
    let visibleCount = 0;

    cards.forEach(card => {
      const searchableText = [
        getHotelName(card),
        card.textContent || "",
        card.dataset.location || "",
        card.dataset.category || "",
        card.dataset.type || ""
      ].join(" ").toLowerCase();

      const matchesQuery = searchableText.includes(
        activeHotelQuery.toLowerCase()
      );

      const category = getHotelCategory(card);

      const matchesCategory =
        activeCategory === "all" ||
        category === activeCategory.toLowerCase() ||
        (card.dataset.type || "").toLowerCase() ===
        activeCategory.toLowerCase();

      const matches = matchesQuery && matchesCategory;

      card.hidden = !matches;

      if (matches) visibleCount++;
    });

    const sortedCards = [...cards];

    if (activeSort === "price-low") {
      sortedCards.sort((a, b) => getHotelPrice(a) - getHotelPrice(b));
    } else if (activeSort === "price-high") {
      sortedCards.sort((a, b) => getHotelPrice(b) - getHotelPrice(a));
    } else if (activeSort === "rating") {
      sortedCards.sort((a, b) => getHotelRating(b) - getHotelRating(a));
    }

    sortedCards.forEach(card => hotelGrid.appendChild(card));

    if (hotelCount) {
      hotelCount.textContent = `${visibleCount} ${visibleCount === 1 ? "stay" : "stays"
        } found`;
    }

    if (hotelEmpty) {
      hotelEmpty.hidden = visibleCount !== 0;
    }
  }

  if (hotelSearchInput) {
    hotelSearchInput.addEventListener("input", () => {
      activeHotelQuery = hotelSearchInput.value.trim();
      applyHotelFilters();
    });
  }

  if (hotelSort) {
    hotelSort.addEventListener("change", () => {
      activeSort = hotelSort.value;
      applyHotelFilters();
    });
  }

  if (hotelCategory) {
    hotelCategory.addEventListener("change", () => {
      activeCategory = hotelCategory.value;
      applyHotelFilters();
    });
  }

  $$("[data-filter-category]").forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.filterCategory || "all";

      $$("[data-filter-category]").forEach(otherButton => {
        otherButton.classList.toggle(
          "is-active",
          otherButton === button
        );
      });

      if (hotelCategory) hotelCategory.value = activeCategory;

      applyHotelFilters();
    });
  });

  /* Hotel detail modal */

  const hotelModal = $(".hotel-modal");

  function closeDialog(dialog) {
    if (dialog && typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    }
  }

  function openDialog(dialog) {
    if (!dialog) return;

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  $$("[data-hotel-details]").forEach(button => {
    button.addEventListener("click", () => {
      const card = button.closest(".hotel-card");
      if (!card || !hotelModal) return;

      const title = getHotelName(card);
      const image = $("img", card);
      const description =
        card.dataset.description ||
        $(".hotel-description", card)?.textContent ||
        "Explore this stay and check its available amenities.";

      const modalTitle = $("[data-modal-title]", hotelModal);
      const modalImage = $("[data-modal-image]", hotelModal);
      const modalDescription = $("[data-modal-description]", hotelModal);
      const modalPrice = $("[data-modal-price]", hotelModal);
      const modalLocation = $("[data-modal-location]", hotelModal);

      if (modalTitle) modalTitle.textContent = title;

      if (modalImage && image) {
        modalImage.src = image.currentSrc || image.src;
        modalImage.alt = image.alt || title;
      }

      if (modalDescription) {
        modalDescription.textContent = description;
      }

      if (modalPrice) {
        modalPrice.textContent =
          $(".hotel-price", card)?.textContent.trim() || "";
      }

      if (modalLocation) {
        modalLocation.textContent =
          $(".hotel-location", card)?.textContent.trim() || "";
      }

      const bookButton = $("[data-modal-book]", hotelModal);

      if (bookButton) {
        bookButton.dataset.hotelName = title;
      }

      openDialog(hotelModal);
    });
  });

  $$("[data-close-modal]").forEach(button => {
    button.addEventListener("click", () => {
      closeDialog(button.closest("dialog"));
    });
  });

  $$(".hotel-modal, .booking-modal").forEach(dialog => {
    dialog.addEventListener("click", event => {
      if (event.target === dialog) closeDialog(dialog);
    });
  });

  /* Favorites */

  const favoritesPanel = $(".favorites-panel");
  const favoritesList = $(".favorites-list");
  const favoritesEmpty = $("#favoritesEmpty");
  const favoritesCount = $(".favorites-count");

  const favoriteHotels = new Set();

  function getFavoriteButton(card) {
    return $(".favorite-btn", card);
  }

  function updateFavoriteButton(card, isFavorite) {
    const button = getFavoriteButton(card);
    if (!button) return;

    button.classList.toggle("is-favorite", isFavorite);
    button.setAttribute("aria-pressed", String(isFavorite));
    button.setAttribute(
      "aria-label",
      isFavorite ? "Remove from favorites" : "Add to favorites"
    );

    const icon = $("svg", button);

    if (icon) {
      icon.style.fill = isFavorite ? "currentColor" : "none";
    }
  }

  function renderFavorites() {
    if (favoritesCount) {
      favoritesCount.textContent = String(favoriteHotels.size);
      favoritesCount.hidden = favoriteHotels.size === 0;
    }

    if (favoritesList) {
      $$(".favorite-item", favoritesList).forEach(item => item.remove());

      favoriteHotels.forEach(name => {
        const card = getHotelCards().find(
          hotel => getHotelName(hotel) === name
        );

        if (!card) return;

        const item = document.createElement("article");
        item.className = "favorite-item";

        const image = $("img", card);

        if (image) {
          const img = document.createElement("img");
          img.src = image.currentSrc || image.src;
          img.alt = image.alt || name;
          item.appendChild(img);
        }

        const details = document.createElement("div");
        const heading = document.createElement("h3");
        heading.textContent = name;

        const price = document.createElement("p");
        price.textContent =
          $(".hotel-price", card)?.textContent.trim() || "";

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", () => {
          favoriteHotels.delete(name);
          updateFavoriteButton(card, false);
          renderFavorites();
          showToast("Removed from your saved stays.");
        });

        details.append(heading, price, removeButton);
        item.appendChild(details);
        favoritesList.appendChild(item);
      });
    }

    if (favoritesEmpty) {
      favoritesEmpty.hidden = favoriteHotels.size !== 0;
    }
  }

  $$(".favorite-btn").forEach(button => {
    const card = button.closest(".hotel-card");
    if (!card) return;

    const name = getHotelName(card);
    updateFavoriteButton(card, favoriteHotels.has(name));

    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      if (favoriteHotels.has(name)) {
        favoriteHotels.delete(name);
        updateFavoriteButton(card, false);
        showToast("Removed from your saved stays.");
      } else {
        favoriteHotels.add(name);
        updateFavoriteButton(card, true);
        showToast("Stay added to your favorites.");
      }

      renderFavorites();
    });
  });

  const openFavoritesButton = $("#favoritesNav");
  const closeFavoritesButton = $("#closeFavorites");

  function openFavorites() {
    if (!favoritesPanel) return;

    favoritesPanel.classList.add("is-open");
    favoritesPanel.setAttribute("aria-hidden", "false");
    renderFavorites();
  }

  function closeFavorites() {
    if (!favoritesPanel) return;

    favoritesPanel.classList.remove("is-open");
    favoritesPanel.setAttribute("aria-hidden", "true");
  }

  if (openFavoritesButton) {
    openFavoritesButton.addEventListener("click", openFavorites);
  }

  if (closeFavoritesButton) {
    closeFavoritesButton.addEventListener("click", closeFavorites);
  }

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeFavorites();
      closeMobileMenu();
    }
  });

  /* Initial state */

  applyHotelFilters();
  renderFavorites();
});

document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

  const notify = (message, type = "success") => {
    if (typeof window.showToast === "function") {
      window.showToast(message, type);
    } else {
      alert(message);
    }
  };

  /* Booking search */

  const bookingForm = $(".booking-search");
  const destinationInput = $("[name='destination']", bookingForm || document);
  const checkInInput = $("[name='checkin']", bookingForm || document);
  const checkOutInput = $("[name='checkout']", bookingForm || document);
  const guestsInput = $("[name='guests']", bookingForm || document);
  const bookingFeedback = $(".booking-feedback");

  function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function configureDates() {
    const today = localDateString(new Date());

    [checkInInput, checkOutInput].forEach(input => {
      if (input && input.type === "date") {
        input.min = today;
      }
    });

    if (checkInInput && checkOutInput) {
      checkInInput.addEventListener("change", () => {
        if (checkInInput.value) {
          checkOutInput.min = checkInInput.value;

          if (
            checkOutInput.value &&
            checkOutInput.value <= checkInInput.value
          ) {
            checkOutInput.value = "";
          }
        } else {
          checkOutInput.min = today;
        }
      });
    }
  }

  configureDates();

  function validateBookingSearch() {
    const destination = destinationInput?.value.trim() || "";
    const checkIn = checkInInput?.value || "";
    const checkOut = checkOutInput?.value || "";
    const guests = Number(guestsInput?.value || 1);
    const today = localDateString(new Date());

    if (!destination) {
      notify("Please enter a destination.", "error");
      destinationInput?.focus();
      return false;
    }

    if (checkIn && checkIn < today) {
      notify("Check-in cannot be in the past.", "error");
      checkInInput?.focus();
      return false;
    }

    if (checkOut && checkOut < today) {
      notify("Check-out cannot be in the past.", "error");
      checkOutInput?.focus();
      return false;
    }

    if (checkIn && checkOut && checkOut <= checkIn) {
      notify("Check-out must be after check-in.", "error");
      checkOutInput?.focus();
      return false;
    }

    if (!Number.isFinite(guests) || guests < 1 || guests > 30) {
      notify("Please select between 1 and 30 guests.", "error");
      guestsInput?.focus();
      return false;
    }

    return true;
  }

  function findHotelResults() {
    const resultsSection =
      $("#hotels") ||
      $("#featured-hotels") ||
      $(".hotel-results-grid")?.closest("section");

    if (resultsSection) {
      resultsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  if (bookingForm) {
    bookingForm.addEventListener("submit", event => {
      event.preventDefault();

      if (!validateBookingSearch()) return;

      const destination = destinationInput?.value.trim().toLowerCase() || "";

      const searchInput = $(".filter-search");
      const categorySelect = $("#hotelCategory");

      if (searchInput) {
        searchInput.value = destination;
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      }

      if (categorySelect) {
        categorySelect.value = "all";
        categorySelect.dispatchEvent(new Event("change", { bubbles: true }));
      }

      if (bookingFeedback) {
        bookingFeedback.textContent =
          "Search updated. Choose a stay to view its details.";
      }

      findHotelResults();
    });
  }

  /* Booking modal */

  const bookingModal = $(".booking-modal");
  const bookingModalForm = $("form", bookingModal || document);

  const bookingNameInput = $("[name='hotel']", bookingModal || document);
  const bookingModalCheckIn = $("[name='booking-checkin']", bookingModal || document);
  const bookingModalCheckOut = $("[name='booking-checkout']", bookingModal || document);
  const bookingModalGuests = $("[name='booking-guests']", bookingModal || document);

  function openBookingModal(hotelName = "") {
    if (!bookingModal) {
      notify("Booking form is not available on this page.", "error");
      return;
    }

    if (bookingNameInput && hotelName) {
      bookingNameInput.value = hotelName;
    }

    if (bookingModalCheckIn && checkInInput?.value) {
      bookingModalCheckIn.value = checkInInput.value;
    }

    if (bookingModalCheckOut && checkOutInput?.value) {
      bookingModalCheckOut.value = checkOutInput.value;
    }

    if (bookingModalGuests && guestsInput?.value) {
      bookingModalGuests.value = guestsInput.value;
    }

    const today = localDateString(new Date());

    [bookingModalCheckIn, bookingModalCheckOut].forEach(input => {
      if (input && input.type === "date") {
        input.min = today;
      }
    });

    if (bookingModalCheckIn && bookingModalCheckOut) {
      bookingModalCheckIn.addEventListener("change", () => {
        if (bookingModalCheckIn.value) {
          bookingModalCheckOut.min = bookingModalCheckIn.value;

          if (
            bookingModalCheckOut.value &&
            bookingModalCheckOut.value <= bookingModalCheckIn.value
          ) {
            bookingModalCheckOut.value = "";
          }
        }
      });
    }

    if (typeof bookingModal.showModal === "function") {
      if (!bookingModal.open) bookingModal.showModal();
    } else {
      bookingModal.setAttribute("open", "");
    }
  }

  $$("[data-book-now], [data-modal-book]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();

      const card = button.closest(".hotel-card");
      const hotelName =
        button.dataset.hotelName ||
        card?.querySelector("h3")?.textContent.trim() ||
        bookingNameInput?.value ||
        "";

      if (bookingModal) {
        const detailModal = $(".hotel-modal");

        if (detailModal?.open) detailModal.close();

        openBookingModal(hotelName);
      } else {
        const bookingSection = $("#booking") || $(".booking-section");

        if (bookingSection) {
          bookingSection.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });

          if (destinationInput && hotelName) {
            destinationInput.value = hotelName;
          }
        } else {
          notify("The booking form is not available.", "error");
        }
      }
    });
  });

  $$("[data-open-booking]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      openBookingModal(button.dataset.hotelName || "");
    });
  });

  if (bookingModalCheckIn && bookingModalCheckOut) {
    bookingModalCheckIn.addEventListener("change", () => {
      if (bookingModalCheckIn.value) {
        bookingModalCheckOut.min = bookingModalCheckIn.value;
      }
    });
  }

  if (bookingModalForm) {
    bookingModalForm.addEventListener("submit", event => {
      event.preventDefault();

      const checkIn = bookingModalCheckIn?.value || "";
      const checkOut = bookingModalCheckOut?.value || "";
      const guests = Number(bookingModalGuests?.value || 1);
      const today = localDateString(new Date());

      if (bookingModalCheckIn && !checkIn) {
        notify("Please select your check-in date.", "error");
        bookingModalCheckIn.focus();
        return;
      }

      if (bookingModalCheckOut && !checkOut) {
        notify("Please select your check-out date.", "error");
        bookingModalCheckOut.focus();
        return;
      }

      if (checkIn && checkIn < today) {
        notify("Check-in cannot be in the past.", "error");
        bookingModalCheckIn?.focus();
        return;
      }

      if (checkOut && checkIn && checkOut <= checkIn) {
        notify("Check-out must be after check-in.", "error");
        bookingModalCheckOut?.focus();
        return;
      }

      if (!Number.isFinite(guests) || guests < 1 || guests > 30) {
        notify("Please select between 1 and 30 guests.", "error");
        bookingModalGuests?.focus();
        return;
      }

      const nameInput = $("[name='name']", bookingModalForm);
      const emailInput = $("[name='email']", bookingModalForm);

      if (nameInput && !nameInput.value.trim()) {
        notify("Please enter your name.", "error");
        nameInput.focus();
        return;
      }

      if (emailInput && !emailInput.checkValidity()) {
        notify("Please enter a valid email address.", "error");
        emailInput.focus();
        return;
      }

      notify(
        "Your demo booking request is ready. Connect a booking backend to confirm real reservations."
      );

      bookingModalForm.reset();

      if (typeof bookingModal.close === "function" && bookingModal.open) {
        bookingModal.close();
      } else {
        bookingModal?.removeAttribute("open");
      }
    });
  }

  /* Newsletter */

  const newsletterForm = $(".newsletter-form");
  const newsletterFeedback = $(".newsletter-feedback");

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", event => {
      event.preventDefault();

      const emailInput = $("input[type='email']", newsletterForm);

      if (!emailInput || !emailInput.checkValidity()) {
        notify("Please enter a valid email address.", "error");
        emailInput?.focus();
        return;
      }

      if (newsletterFeedback) {
        newsletterFeedback.textContent =
          "Thanks for subscribing! Connect an email service to save subscriptions.";
      }

      newsletterForm.reset();
    });
  }

  /* Smooth scrolling */

  $$("a[href^='#']").forEach(link => {
    link.addEventListener("click", event => {
      const href = link.getAttribute("href");

      if (!href || href === "#") return;

      const target = document.querySelector(href);

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      if (history.replaceState) {
        history.replaceState(null, "", href);
      }
    });
  });

  /* Current year */

  $$("[data-current-year]").forEach(element => {
    element.textContent = String(new Date().getFullYear());
  });

  /* Back to top */

  const backToTop = $("[data-back-to-top]");

  if (backToTop) {
    const updateBackToTop = () => {
      backToTop.hidden = window.scrollY < 500;
    };

    window.addEventListener("scroll", updateBackToTop, {
      passive: true
    });

    updateBackToTop();

    backToTop.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

  /* Contact links without a destination */

  $$("a[href='#contact']").forEach(link => {
    link.addEventListener("click", () => {
      const contactSection = $("#contact");

      if (contactSection) {
        contactSection.classList.add("is-highlighted");

        window.setTimeout(() => {
          contactSection.classList.remove("is-highlighted");
        }, 1200);
      }
    });
  });

  const storyModal = document.getElementById("storyModal");
  const openStory = document.getElementById("openStory");
  const closeStory = document.getElementById("closeStory");
  const storyBookingBtn = document.getElementById("storyBookingBtn");

  function showStory() {
    if (!storyModal) return;

    storyModal.classList.add("is-open");
    storyModal.setAttribute("aria-hidden", "false");
    openStory?.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeStory?.focus();
  }

  function hideStory() {
    if (!storyModal) return;

    storyModal.classList.remove("is-open");
    storyModal.setAttribute("aria-hidden", "true");
    openStory?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    openStory?.focus();
  }

  openStory?.addEventListener("click", showStory);
  closeStory?.addEventListener("click", hideStory);

  storyModal?.addEventListener("click", (event) => {
    if (event.target === storyModal) {
      hideStory();
    }
  });

  storyBookingBtn?.addEventListener("click", hideStory);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && storyModal?.classList.contains("is-open")) {
      hideStory();
    }
  });

  const experiencesModal = document.getElementById("experiencesModal");
  const openExperiences = document.getElementById("openExperiences");
  const closeExperiences = document.getElementById("closeExperiences");
  const experiencesBookingBtn = document.getElementById("experiencesBookingBtn");

  function showExperiences() {
    if (!experiencesModal) return;

    experiencesModal.classList.add("is-open");
    experiencesModal.setAttribute("aria-hidden", "false");
    openExperiences?.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeExperiences?.focus();
  }

  function hideExperiences() {
    if (!experiencesModal) return;

    experiencesModal.classList.remove("is-open");
    experiencesModal.setAttribute("aria-hidden", "true");
    openExperiences?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    openExperiences?.focus();
  }

  openExperiences?.addEventListener("click", showExperiences);
  closeExperiences?.addEventListener("click", hideExperiences);

  experiencesModal?.addEventListener("click", (event) => {
    if (event.target === experiencesModal) {
      hideExperiences();
    }
  });

  experiencesBookingBtn?.addEventListener("click", hideExperiences);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && experiencesModal?.classList.contains("is-open")) {
      hideExperiences();
    }
  });

  const destinationsModal = document.getElementById("destinationsModal");
  const openDestinations = document.getElementById("openDestinations");
  const closeDestinations = document.getElementById("closeDestinations");
  const destinationsBookingBtn = document.getElementById("destinationsBookingBtn");

  function showDestinations() {
    if (!destinationsModal) return;

    destinationsModal.classList.add("is-open");
    destinationsModal.setAttribute("aria-hidden", "false");
    openDestinations?.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeDestinations?.focus();
  }

  function hideDestinations() {
    if (!destinationsModal) return;

    destinationsModal.classList.remove("is-open");
    destinationsModal.setAttribute("aria-hidden", "true");
    openDestinations?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    openDestinations?.focus();
  }

  openDestinations?.addEventListener("click", showDestinations);
  closeDestinations?.addEventListener("click", hideDestinations);

  destinationsModal?.addEventListener("click", (event) => {
    if (event.target === destinationsModal) {
      hideDestinations();
    }
  });

  destinationsBookingBtn?.addEventListener("click", hideDestinations);

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      destinationsModal?.classList.contains("is-open")
    ) {
      hideDestinations();
    }
  });

  const allStaysModal = document.getElementById("allStaysModal");
  const openAllStays = document.getElementById("openAllStays");
  const closeAllStays = document.getElementById("closeAllStays");
  const allStaysBookingBtn = document.getElementById("allStaysBookingBtn");

  function showAllStays() {
    if (!allStaysModal) return;

    allStaysModal.classList.add("is-open");
    allStaysModal.setAttribute("aria-hidden", "false");
    openAllStays?.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeAllStays?.focus();
  }

  function hideAllStays() {
    if (!allStaysModal) return;

    allStaysModal.classList.remove("is-open");
    allStaysModal.setAttribute("aria-hidden", "true");
    openAllStays?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    openAllStays?.focus();
  }

  openAllStays?.addEventListener("click", showAllStays);
  closeAllStays?.addEventListener("click", hideAllStays);

  allStaysModal?.addEventListener("click", (event) => {
    if (event.target === allStaysModal) {
      hideAllStays();
    }
  });

  allStaysBookingBtn?.addEventListener("click", hideAllStays);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && allStaysModal?.classList.contains("is-open")) {
      hideAllStays();
    }
  });
  const offersModal = document.getElementById("offersModal");
  const openOffers = document.getElementById("openOffers");
  const closeOffers = document.getElementById("closeOffers");

  function showOffers() {
    if (!offersModal) return;

    offersModal.classList.add("is-open");
    offersModal.setAttribute("aria-hidden", "false");
    openOffers?.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeOffers?.focus();
  }

  function hideOffers() {
    if (!offersModal) return;

    offersModal.classList.remove("is-open");
    offersModal.setAttribute("aria-hidden", "true");
    openOffers?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    openOffers?.focus();
  }

  openOffers?.addEventListener("click", showOffers);
  closeOffers?.addEventListener("click", hideOffers);

  offersModal?.addEventListener("click", (event) => {
    if (event.target === offersModal) {
      hideOffers();
    }
  });

  offersModal?.querySelectorAll(".offer-link").forEach((link) => {
    link.addEventListener("click", hideOffers);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && offersModal?.classList.contains("is-open")) {
      hideOffers();
    }
  });
  const allFaqsModal = document.getElementById("allFaqsModal");
  const openAllFaqs = document.getElementById("openAllFaqs");
  const closeAllFaqs = document.getElementById("closeAllFaqs");
  const allFaqsContactBtn = document.getElementById("allFaqsContactBtn");

  function showAllFaqs() {
    if (!allFaqsModal) return;

    allFaqsModal.classList.add("is-open");
    allFaqsModal.setAttribute("aria-hidden", "false");
    openAllFaqs?.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeAllFaqs?.focus();
  }

  function hideAllFaqs() {
    if (!allFaqsModal) return;

    allFaqsModal.classList.remove("is-open");
    allFaqsModal.setAttribute("aria-hidden", "true");
    openAllFaqs?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    openAllFaqs?.focus();
  }

  openAllFaqs?.addEventListener("click", showAllFaqs);
  closeAllFaqs?.addEventListener("click", hideAllFaqs);

  allFaqsModal?.addEventListener("click", (event) => {
    if (event.target === allFaqsModal) {
      hideAllFaqs();
    }
  });

  allFaqsContactBtn?.addEventListener("click", hideAllFaqs);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && allFaqsModal?.classList.contains("is-open")) {
      hideAllFaqs();
    }
  });
});

if (window.initializeIcons) {
  window.initializeIcons();
}

const testimonialsModal = document.getElementById("testimonialsModal");
const openTestimonials = document.getElementById("openTestimonials");
const closeTestimonials = document.getElementById("closeTestimonials");

function showTestimonials() {
  if (!testimonialsModal) return;

  testimonialsModal.classList.add("is-open");
  testimonialsModal.setAttribute("aria-hidden", "false");
  openTestimonials?.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
  closeTestimonials?.focus();
}

function hideTestimonials() {
  if (!testimonialsModal) return;

  testimonialsModal.classList.remove("is-open");
  testimonialsModal.setAttribute("aria-hidden", "true");
  openTestimonials?.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
  openTestimonials?.focus();
}

openTestimonials?.addEventListener("click", showTestimonials);
closeTestimonials?.addEventListener("click", hideTestimonials);

testimonialsModal?.addEventListener("click", (event) => {
  if (event.target === testimonialsModal) {
    hideTestimonials();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && testimonialsModal?.classList.contains("is-open")) {
    hideTestimonials();
  }
});