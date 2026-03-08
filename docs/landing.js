(function () {
  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }

    callback();
  }

  onReady(function () {
    const animeApi = window.animejs || window.anime || null;
    const animateFn =
      typeof animeApi === "function" ? animeApi : typeof animeApi?.animate === "function" ? animeApi.animate : null;
    const staggerFn = typeof animeApi?.stagger === "function" ? animeApi.stagger : null;
    const revealSections = Array.from(document.querySelectorAll(".reveal"));
    const allSections = Array.from(document.querySelectorAll(".section"));
    const floatingNav = document.querySelector(".floating-nav");
    const hero = document.querySelector(".hero");
    const heroCopy = document.querySelector(".hero-copy");
    const heroPanel = document.querySelector(".hero-panel");
    const copyButtons = Array.from(document.querySelectorAll("[data-copy-target]"));
    const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
    const trackSections = navLinks
      .map((link) => document.getElementById(link.dataset.navLink || ""))
      .filter(Boolean);
    let navVisible = false;
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let motionFrame = 0;

    function markVisible(section) {
      const items = Array.from(section.querySelectorAll(".reveal-item"));
      section.classList.add("is-visible");

      if (!items.length || !animateFn) {
        items.forEach((item) => item.classList.add("is-visible"));
        return;
      }

      items.forEach((item) => item.classList.add("is-visible"));

      animateFn(items, {
        opacity: [0, 1],
        translateY: [34, 0],
        scale: [0.96, 1],
        duration: 820,
        delay: typeof staggerFn === "function" ? staggerFn(110) : 0,
        easing: "out(4)",
      });
    }

    if (revealSections.length) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            markVisible(entry.target);
            observer.unobserve(entry.target);
          });
        },
        {
          threshold: 0.18,
          rootMargin: "0px 0px -8% 0px",
        },
      );

      revealSections.forEach((section) => observer.observe(section));
    }

    function setActiveNav(id) {
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.dataset.navLink === id);
      });
    }

    function updateActiveNavFromScroll() {
      if (!trackSections.length) return;

      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight || 1;
      const documentHeight = document.documentElement.scrollHeight;
      const viewportBottom = scrollTop + viewportHeight;

      if (viewportBottom >= documentHeight - 8) {
        const lastSection = trackSections[trackSections.length - 1];
        if (lastSection?.id) setActiveNav(lastSection.id);
        return;
      }

      const probeLine = scrollTop + viewportHeight * 0.42;
      let currentSection = trackSections[0];

      for (const section of trackSections) {
        if (section.offsetTop <= probeLine) {
          currentSection = section;
        } else {
          break;
        }
      }

      if (currentSection?.id) {
        setActiveNav(currentSection.id);
      }
    }

    function toggleFloatingNav(shouldShow) {
      if (!floatingNav || shouldShow === navVisible) return;
      navVisible = shouldShow;
      floatingNav.classList.toggle("is-visible", shouldShow);
    }

    function updateFloatingNav() {
      if (!hero || !floatingNav) return;
      const threshold = hero.offsetHeight * 0.55;
      toggleFloatingNav(window.scrollY > threshold);
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function getHiddenNavTransform() {
      return window.matchMedia("(max-width: 720px)").matches
        ? "translateX(-50%) translateY(18px) scale(0.98)"
        : "translateX(-50%) translateY(-18px) scale(0.98)";
    }

    function updateScrollMotion() {
      motionFrame = 0;
      const viewportHeight = window.innerHeight || 1;
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;
      scrollVelocity = scrollVelocity * 0.78 + delta * 0.22;
      const dampedVelocity = clamp(scrollVelocity, -28, 28);

      if (hero && heroCopy && heroPanel) {
        const heroProgress = clamp(currentScrollY / Math.max(hero.offsetHeight, 1), 0, 1.2);
        const heroTranslate = heroProgress * -26 + dampedVelocity * -0.18;
        const panelTranslate = heroProgress * 18 + dampedVelocity * 0.12;
        const heroOpacity = 1 - Math.min(heroProgress * 0.14, 0.14);

        hero.style.transform = `translate3d(0, ${heroProgress * -8}px, 0)`;
        hero.style.opacity = String(heroOpacity);
        heroCopy.style.transform = `translate3d(0, ${heroTranslate}px, 0)`;
        heroPanel.style.transform = `translate3d(0, ${panelTranslate}px, 0)`;
      }

      allSections.forEach((section) => {
        if (!section.classList.contains("is-visible")) return;

        const rect = section.getBoundingClientRect();
        const centerOffset = ((rect.top + rect.height / 2) - viewportHeight / 2) / viewportHeight;
        const drift = clamp(centerOffset * -18, -18, 18) + dampedVelocity * 0.08;
        const scale = 1 - Math.min(Math.abs(centerOffset) * 0.03, 0.03);

        section.style.transform = `translate3d(0, ${drift}px, 0) scale(${scale})`;
      });

      if (floatingNav && navVisible) {
        const navLift = clamp(dampedVelocity * -0.22, -10, 10);
        const navScale = 1 + Math.min(Math.abs(dampedVelocity) * 0.0015, 0.022);
        floatingNav.style.transform = `translateX(-50%) translateY(${navLift}px) scale(${navScale})`;
      } else if (floatingNav) {
        floatingNav.style.transform = getHiddenNavTransform();
      }

      if (Math.abs(scrollVelocity) > 0.12) {
        motionFrame = window.requestAnimationFrame(updateScrollMotion);
      }
    }

    function requestMotionUpdate() {
      updateFloatingNav();
      updateActiveNavFromScroll();
      if (motionFrame) return;
      motionFrame = window.requestAnimationFrame(updateScrollMotion);
    }

    updateFloatingNav();
    requestMotionUpdate();
    window.addEventListener("scroll", requestMotionUpdate, { passive: true });
    window.addEventListener("resize", requestMotionUpdate);

    copyButtons.forEach((button) => {
      button.addEventListener("click", async function () {
        const targetId = button.getAttribute("data-copy-target");
        if (!targetId) return;

        const source = document.getElementById(targetId);
        const text = source?.textContent;
        if (!text) return;

        try {
          await navigator.clipboard.writeText(text);
          const original = button.textContent;
          button.textContent = "Copied";
          button.classList.add("is-copied");

          window.setTimeout(() => {
            button.textContent = original || "Copy";
            button.classList.remove("is-copied");
          }, 1400);
        } catch {
          button.textContent = "Failed";
          window.setTimeout(() => {
            button.textContent = "Copy";
          }, 1400);
        }
      });
    });

    if (animateFn) {
      animateFn(".hero-copy > *", {
        opacity: [0, 1],
        translateY: [22, 0],
        duration: 760,
        delay: typeof staggerFn === "function" ? staggerFn(90) : 0,
        easing: "out(4)",
      });

      animateFn(".hero-panel", {
        opacity: [0, 1],
        translateY: [34, 0],
        scale: [0.975, 1],
        duration: 900,
        easing: "out(4)",
      });
    }
  });
})();
