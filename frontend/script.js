(() => {
  "use strict";

  // Fixed API host — not user-configurable.
  const API_BASE = "https://mimic.sotechho.com";
  const ANALYZE_ENDPOINT = `${API_BASE}/api/v1/domains/analyze`;

  const GAUGE_RADIUS = 68;
  const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

  const STAMP_LABELS = {
    low: "LOW RISK",
    medium: "MEDIUM RISK",
    high: "HIGH RISK",
  };

  const els = {
    form: document.getElementById("intake-form"),
    input: document.getElementById("domain-input"),
    submitBtn: document.getElementById("submit-btn"),
    formError: document.getElementById("form-error"),
    caseNo: document.getElementById("case-no"),

    dossier: document.getElementById("dossier"),
    dossierSubject: document.getElementById("dossier-subject"),
    stamp: document.getElementById("stamp"),
    stampText: document.getElementById("stamp-text"),
    gaugeValue: document.getElementById("gauge-value"),
    scoreNumber: document.getElementById("score-number"),
    dossierMessage: document.getElementById("dossier-message"),
    findingsList: document.getElementById("findings-list"),
    dossierTimestamp: document.getElementById("dossier-timestamp"),
    newCaseBtn: document.getElementById("new-case-btn"),

    loading: document.getElementById("dossier-loading"),

    errorPanel: document.getElementById("dossier-error"),
    errorMessage: document.getElementById("error-message"),
    retryBtn: document.getElementById("retry-btn"),
  };

  // Prep the gauge stroke geometry to match the JS-computed circumference.
  els.gaugeValue.style.strokeDasharray = String(GAUGE_CIRCUMFERENCE);
  els.gaugeValue.style.strokeDashoffset = String(GAUGE_CIRCUMFERENCE);

  let caseCounter = 480 + Math.floor(Math.random() * 40);
  bumpCaseNumber();

  els.form.addEventListener("submit", handleSubmit);
  els.newCaseBtn.addEventListener("click", resetToIntake);
  els.retryBtn.addEventListener("click", resetToIntake);

  function bumpCaseNumber() {
    caseCounter += 1;
    const code = String(caseCounter).padStart(6, "0");
    els.caseNo.textContent = `${code.slice(0, 3)}-${code.slice(3)}`;
  }

  function normalizeDomainInput(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
  }

  function isPlausibleUrl(value) {
    try {
      const url = new URL(value);
      return Boolean(url.hostname) && url.hostname.includes(".");
    } catch {
      return false;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    hideFormError();

    const candidate = normalizeDomainInput(els.input.value);

    if (!candidate || !isPlausibleUrl(candidate)) {
      showFormError(
        "Enter a valid domain or URL, like example.com or https://example.com.",
      );
      els.input.focus();
      return;
    }

    setSubmitting(true);
    showLoading(candidate);

    try {
      const result = await analyzeDomain(candidate);
      renderDossier(candidate, result);
    } catch (err) {
      renderError(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function analyzeDomain(domain) {
    let response;
    try {
      response = await fetch(ANALYZE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
    } catch {
      throw new Error(
        "Couldn't reach the analysis desk. Check your connection and try again.",
      );
    }

    if (!response.ok) {
      let detail = "";
      try {
        const body = await response.json();
        detail = body?.message || body?.error || "";
      } catch {
        /* response wasn't JSON — ignore */
      }
      throw new Error(
        detail ||
          `The desk returned an error (status ${response.status}). Try again shortly.`,
      );
    }

    const data = await response.json();
    if (typeof data?.score !== "number" || !data?.risk) {
      throw new Error(
        "The desk sent back an incomplete report. Try again shortly.",
      );
    }
    return data;
  }

  function setSubmitting(isSubmitting) {
    els.submitBtn.disabled = isSubmitting;
    els.submitBtn.querySelector(".btn-label").textContent = isSubmitting
      ? "Filing…"
      : "Open Case";
  }

  function showFormError(message) {
    els.formError.textContent = message;
    els.formError.hidden = false;
  }

  function hideFormError() {
    els.formError.hidden = true;
    els.formError.textContent = "";
  }

  function hideAllPanels() {
    els.dossier.hidden = true;
    els.loading.hidden = true;
    els.errorPanel.hidden = true;
  }

  function showLoading(domain) {
    hideAllPanels();
    els.loading.hidden = false;
    els.loading.dataset.domain = domain;
  }

  function renderDossier(domain, result) {
    hideAllPanels();

    const risk = String(result.risk || "low").toLowerCase();
    const knownRisk = ["low", "medium", "high"].includes(risk) ? risk : "low";
    const score = clamp(Math.round(result.score), 0, 100);

    els.dossierSubject.textContent = domain.replace(/^https?:\/\//, "");
    els.stamp.dataset.risk = knownRisk;
    els.stampText.textContent =
      STAMP_LABELS[knownRisk] || result.risk.toUpperCase();

    // Re-trigger the stamp-in animation for each new case.
    els.stamp.style.animation = "none";
    void els.stamp.offsetWidth;
    els.stamp.style.animation = "";

    els.scoreNumber.textContent = String(score);

    const offset = GAUGE_CIRCUMFERENCE * (1 - score / 100);
    els.gaugeValue.style.strokeDashoffset = String(GAUGE_CIRCUMFERENCE);
    // Force a reflow so the transition replays on repeated submissions.
    void els.gaugeValue.getBoundingClientRect();
    requestAnimationFrame(() => {
      els.gaugeValue.style.strokeDashoffset = String(offset);
    });

    els.dossierMessage.textContent =
      result.message || "No summary was provided for this case.";

    els.findingsList.innerHTML = "";
    const reasons = Array.isArray(result.reasons) ? result.reasons : [];
    if (reasons.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No supporting notes were attached to this case.";
      els.findingsList.appendChild(li);
    } else {
      reasons.forEach((reason) => {
        const li = document.createElement("li");
        li.textContent = reason;
        els.findingsList.appendChild(li);
      });
    }

    els.dossierTimestamp.textContent = `Filed ${formatTimestamp(new Date())}`;

    els.dossier.hidden = false;
    bumpCaseNumber();
    els.dossier.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function renderError(err) {
    hideAllPanels();
    els.errorMessage.textContent =
      err instanceof Error
        ? err.message
        : "Something went wrong opening this case.";
    els.errorPanel.hidden = false;
  }

  function resetToIntake() {
    hideAllPanels();
    els.input.focus();
    els.input.select();
  }

  function clamp(value, min, max) {
    if (Number.isNaN(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  function formatTimestamp(date) {
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
})();
