// ===== STATISTICS MANAGER - DATABASE VERSION (NO CACHE) =====
class StatisticsManager {
  constructor() {
    if (window.statisticsManager) {
      console.warn("StatisticsManager already exists. Skipping duplicate init.");
      return window.statisticsManager;
    }
    console.log("StatisticsManager constructor called");

    this.articleCountElement = document.getElementById("articleCount");
    this.visitorCountElement = document.getElementById("visitorCount");

    window.statisticsManager = this;
    window.statsManager = this; // Backward compatibility

    console.log("Elements found:", {
      articleCount: this.articleCountElement ? "" : "",
      visitorCount: this.visitorCountElement ? "" : "",
    });

    this.currentArticles = 0;
    this.currentVisitors = 0;
    this.isLoading = true;
    this.init();
  }

  async init() {
    if (!this.articleCountElement && !this.visitorCountElement) {
      console.error(" No stat elements found! Aborting StatisticsManager init.");
      return;
    }

    console.log("StatisticsManager initializing...");

    // Show initial skeletons if not already there
    if (this.articleCountElement) this.articleCountElement.classList.add("skeleton-stat");
    if (this.visitorCountElement) this.visitorCountElement.classList.add("skeleton-stat");

    await this.loadStatisticsFromDatabase();
    await this.trackVisitorToDatabase();

    this.isLoading = false;

    // Remove skeletons before animating
    if (this.articleCountElement) {
      this.articleCountElement.classList.remove("skeleton-stat");
      this.articleCountElement.textContent = "0";
    }
    if (this.visitorCountElement) {
      this.visitorCountElement.classList.remove("skeleton-stat");
      this.visitorCountElement.textContent = "0";
    }

    console.log("Starting animation with values:", {
      articles: this.currentArticles,
      visitors: this.currentVisitors,
    });

    requestAnimationFrame(() => {
      this.startCounterAnimation();
    });

    setInterval(() => this.refreshStatistics(), 30000);

    window.addEventListener("journals:changed", () => this.refreshStatistics());
    window.addEventListener("opinions:changed", () => this.refreshStatistics());
  }

  async loadStatisticsFromDatabase() {
    try {
      const timestamp = Date.now();
      console.log(`Fetching stats from API... (t=${timestamp})`);

      const response = await fetch(`/ksmaja/api/get_stats.php?t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });

      const data = await response.json();
      console.log("Stats API response:", data);

      if (data.ok && data.stats) {
        this.currentArticles = data.stats.total_articles || 0;
        this.currentVisitors = data.stats.total_visitors || 0;
        console.log(" Stats loaded:", {
          articles: this.currentArticles,
          visitors: this.currentVisitors,
        });
      } else {
        console.warn("Stats API returned not OK");
      }
    } catch (error) {
      console.error(" Error loading stats:", error);
    }
  }

  async trackVisitorToDatabase() {
    if (sessionStorage.getItem("visitorTracked")) {
      console.log(" Visitor already tracked this session");
      return;
    }

    try {
      const response = await fetch("/ksmaja/api/track_visitor.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "page_url=" + encodeURIComponent(window.location.pathname),
      });

      const data = await response.json();

      if (data.ok) {
        sessionStorage.setItem("visitorTracked", "1");
        console.log(" Visitor tracked");
        if (data.new) await this.refreshStatistics();
      }
    } catch (error) {
      console.error(" Error tracking visitor:", error);
    }
  }

  async refreshStatistics() {
    const oldArticles = this.currentArticles;
    const oldVisitors = this.currentVisitors;

    await this.loadStatisticsFromDatabase();

    if (this.articleCountElement && this.currentArticles !== oldArticles) {
      this.animateCounter(this.articleCountElement, oldArticles, this.currentArticles, 600);
    }

    if (this.visitorCountElement && this.currentVisitors !== oldVisitors) {
      this.animateCounter(this.visitorCountElement, oldVisitors, this.currentVisitors, 600);
    }
  }

  startCounterAnimation() {
    console.log("Starting counter animation");

    if (this.articleCountElement) {
      console.log(`   Animating articles: 0 to ${this.currentArticles}`);
      this.animateCounter(this.articleCountElement, 0, this.currentArticles, 700);
    }

    if (this.visitorCountElement) {
      console.log(`   Animating visitors: 0 to ${this.currentVisitors}`);
      this.animateCounter(this.visitorCountElement, 0, this.currentVisitors, 900);
    }
  }

  animateCounter(element, start, end, duration) {
    if (!element) return;

    console.log(`Animating ${element.id}: ${start} to ${end}`);

    element.classList.add("counting");
    const startTime = performance.now();
    const range = end - start;

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(start + range * easeOutQuart);

      element.textContent = String(current);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = String(end);
        element.classList.remove("counting");
        console.log(` Animation complete for ${element.id}: ${end}`);
      }
    };

    requestAnimationFrame(updateCounter);
  }

  resetStatistics() {
    localStorage.removeItem("siteStatisticsCache");
    sessionStorage.removeItem("visitorTracked");
    this.currentArticles = 0;
    this.currentVisitors = 0;
    if (this.articleCountElement) this.articleCountElement.textContent = "0";
    if (this.visitorCountElement) this.visitorCountElement.textContent = "0";
  }
}

// Auto init with MORE aggressive DOM checking
if (document.readyState === "loading") {
  console.log("DOM still loading, waiting for DOMContentLoaded...");
  document.addEventListener("DOMContentLoaded", () => {
    console.log(" DOM ready, initializing StatisticsManager");
    localStorage.removeItem("siteStatisticsCache");
    window.statisticsManager = new StatisticsManager();
  });
} else {
  console.log(" DOM already ready, initializing StatisticsManager immediately");
  localStorage.removeItem("siteStatisticsCache");
  window.statisticsManager = new StatisticsManager();
}

console.log(" statistic.js loaded (Database Mode - No Cache)");
