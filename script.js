document.addEventListener("DOMContentLoaded", () => {
  hljs.highlightAll();
});

const themeToggle = document.getElementById("theme-toggle");
const html = document.documentElement;

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    if (html) html.classList.add("theme-transition");

    let isDark = false;
    if (html) isDark = html.classList.toggle("dark");

    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch (e) {}

    setTimeout(() => {
      if (html) html.classList.remove("theme-transition");
    }, 300);
  });
}

const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll(".nav-link");

const navLookup = new Map();
if (navLinks && navLinks.length > 0) {
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href) navLookup.set(href.substring(1), link);
  });
}

const observerOptions = {
  root: null,
  rootMargin: "-100px 0px -60% 0px",
  threshold: 0,
};

const observer = new IntersectionObserver((entries) => {
  let activeId = null;

  if (entries && entries.length > 0) {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.target) {
        activeId = entry.target.id;
      }
    });
  }

  if (activeId) {
    if (navLinks && navLinks.length > 0) {
      navLinks.forEach((link) => link.classList.remove("active"));
    }
    const activeLink = navLookup.get(activeId);
    if (activeLink) {
      activeLink.classList.add("active");
    }
  }
}, observerOptions);

if (sections && sections.length > 0) {
  sections.forEach((section) => observer.observe(section));
}

async function copyCode(btn) {
  if (!btn) return;
  try {
    if (btn.innerText === "Copied!") return;

    const container = btn.closest(".code-block-wrapper") || btn.parentElement;
    if (!container) return;

    let textToCopy = "";

    const codeBlock =
      container.querySelector("pre code") ||
      container.querySelector("pre") ||
      btn.nextElementSibling;
    if (codeBlock && codeBlock.textContent) {
      textToCopy = codeBlock.textContent;
    }

    if (!textToCopy) {
      console.warn("No copyable content found.");
      return;
    }

    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textToCopy);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }

    const originalText = btn.innerText;
    btn.innerText = "Copied!";

    btn.classList.remove(
      "bg-gray-200",
      "dark:bg-gray-800",
      "text-gray-700",
      "dark:text-gray-300",
      "border-gray-300",
      "dark:border-gray-700",
    );
    btn.classList.add(
      "bg-green-100",
      "dark:bg-green-900/40",
      "text-green-700",
      "dark:text-green-400",
      "border-green-300",
      "dark:border-green-700",
    );

    setTimeout(() => {
      btn.innerText = originalText;
      btn.classList.remove(
        "bg-green-100",
        "dark:bg-green-900/40",
        "text-green-700",
        "dark:text-green-400",
        "border-green-300",
        "dark:border-green-700",
      );
      btn.classList.add(
        "bg-gray-200",
        "dark:bg-gray-800",
        "text-gray-700",
        "dark:text-gray-300",
        "border-gray-300",
        "dark:border-gray-700",
      );
    }, 2000);
  } catch (err) {
    console.error("Copy action failed: ", err);
  }
}

window.copyCode = copyCode;

const searchInput = document.querySelector(
  'input[placeholder="Search documentation..."]',
);
if (searchInput) {
  const sidebarGroups = document.querySelectorAll("#sidebar-nav > div");
  const sectionsList = document.querySelectorAll("section");
  const sidebarNav = document.getElementById("sidebar-nav");

  let noResultsMsg = null;
  if (sidebarNav) {
    noResultsMsg = document.createElement("div");
    noResultsMsg.id = "no-results-message";
    noResultsMsg.className =
      "hidden text-gray-500 dark:text-gray-400 text-sm py-4 text-center";
    noResultsMsg.textContent = "No results found.";
    sidebarNav.appendChild(noResultsMsg);
  }

  let searchTimeout;

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      if (searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
    }
  });

  searchInput.addEventListener("input", (e) => {
    if (!e.target) return;
    const query = e.target.value.toLowerCase().trim();

    clearTimeout(searchTimeout);

    if (query === "") {
      executeSearch(query);
    } else {
      searchTimeout = setTimeout(() => {
        executeSearch(query);
      }, 150);
    }
  });

  function executeSearch(query) {
    let hasResults = false;
    let firstMatchSection = null;

    if (sectionsList && sectionsList.length > 0) {
      sectionsList.forEach((section) => {
        if (section && section.classList) {
          section.classList.remove(
            "ring-2",
            "ring-blue-500/50",
            "bg-blue-50/50",
            "dark:bg-blue-900/10",
            "rounded-lg",
            "p-4",
            "-mx-4",
            "transition-all",
          );
        }
      });
    }

    if (query === "") {
      if (sidebarGroups && sidebarGroups.length > 0) {
        sidebarGroups.forEach((group) => {
          if (group && group.style) group.style.display = "";
          const items = group ? group.querySelectorAll("li") : null;
          if (items && items.length > 0) {
            items.forEach((li) => {
              if (li && li.style) li.style.display = "";
            });
          }
        });
      }
      if (noResultsMsg && noResultsMsg.classList)
        noResultsMsg.classList.add("hidden");
      return;
    }

    if (sidebarGroups && sidebarGroups.length > 0) {
      sidebarGroups.forEach((group) => {
        if (!group) return;
        let groupHasMatch = false;
        const items = group.querySelectorAll("li");

        if (items && items.length > 0) {
          items.forEach((li) => {
            if (!li) return;
            const link = li.querySelector(".nav-link");
            if (!link) return;

            const href = link.getAttribute("href");
            const sectionId = href ? href.substring(1) : null;
            const section = sectionId
              ? document.getElementById(sectionId)
              : null;

            let matches =
              link.textContent &&
              link.textContent.toLowerCase().includes(query);

            if (!matches && section) {
              const headings = Array.from(section.querySelectorAll("h2, h3"));
              if (headings && headings.length > 0) {
                matches = headings.some(
                  (h) =>
                    h.textContent &&
                    h.textContent.toLowerCase().includes(query),
                );
              }
            }

            if (li.style) li.style.display = matches ? "" : "none";

            if (matches) {
              groupHasMatch = true;
              hasResults = true;
              if (section && section.classList) {
                section.classList.add(
                  "transition-all",
                  "ring-2",
                  "ring-blue-500/50",
                  "bg-blue-50/50",
                  "dark:bg-blue-900/10",
                  "rounded-lg",
                  "p-4",
                  "-mx-4",
                );
                if (!firstMatchSection) {
                  firstMatchSection = section;
                }
              }
            }
          });
        }

        if (group.style) group.style.display = groupHasMatch ? "" : "none";
      });
    }

    if (noResultsMsg && noResultsMsg.classList) {
      if (!hasResults) {
        noResultsMsg.classList.remove("hidden");
      } else {
        noResultsMsg.classList.add("hidden");
      }
    }

    if (hasResults && firstMatchSection) {
      const headerOffset = 100;
      const rect = firstMatchSection.getBoundingClientRect();
      if (rect) {
        const offsetPosition = rect.top + window.scrollY - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }
  }
}

window.replayAnim = function (btn, animClass) {
  const animatedElement = btn.previousElementSibling;
  if (!animatedElement) return;

  const fullClass = `chai-${animClass}`;
  animatedElement.classList.remove(fullClass);
  void animatedElement.offsetWidth;
  animatedElement.classList.add(fullClass);
};
