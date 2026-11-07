/**
 * CareerMatch - AI-Based Job Recommendation System
 * Frontend Application Logic (Enhanced)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let currentRecommendations = [];
  let filteredRecommendations = [];
  let allCatalogJobs = [];
  let savedJobIds = new Set(JSON.parse(localStorage.getItem('cm_saved_jobs') || '[]'));
  let loadingInterval = null;

  // DOM Elements
  const recommendationForm = document.getElementById('recommendationForm');
  const submitBtn = document.getElementById('submitBtn');
  const resetBtn = document.getElementById('resetBtn');
  const formAlert = document.getElementById('formAlert');

  const fullNameInput = document.getElementById('fullName');
  const qualificationInput = document.getElementById('qualification');
  const skillsInput = document.getElementById('skills');
  const interestsInput = document.getElementById('interests');
  const preferredRoleInput = document.getElementById('preferredRole');
  const topNSelect = document.getElementById('topN');

  const errorFullName = document.getElementById('errorFullName');
  const errorQualification = document.getElementById('errorQualification');
  const errorSkills = document.getElementById('errorSkills');

  const resultsSection = document.getElementById('resultsSection');
  const resultsContainer = document.getElementById('resultsContainer');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const loadingDynamicText = document.getElementById('loadingDynamicText');
  const resultsTitle = document.getElementById('resultsTitle');
  const resultsSubtitle = document.getElementById('resultsSubtitle');
  const evaluatedBadge = document.getElementById('evaluatedBadge');
  const jobCardsGrid = document.getElementById('jobCardsGrid');
  const resultsCountText = document.getElementById('resultsCountText');
  const noResultsState = document.getElementById('noResultsState');

  const resultsSuccessBanner = document.getElementById('resultsSuccessBanner');
  const successBannerTitle = document.getElementById('successBannerTitle');
  const successBannerSubtitle = document.getElementById('successBannerSubtitle');
  const closeSuccessBannerBtn = document.getElementById('closeSuccessBannerBtn');

  const filterSearch = document.getElementById('filterSearch');
  const filterCategory = document.getElementById('filterCategory');
  const sortOrder = document.getElementById('sortOrder');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');

  const catalogGrid = document.getElementById('catalogGrid');
  const catalogSearch = document.getElementById('catalogSearch');
  const catalogCategoryFilter = document.getElementById('catalogCategoryFilter');

  const jobModal = document.getElementById('jobModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalCloseFooterBtn = document.getElementById('modalCloseFooterBtn');
  const modalApplyBtn = document.getElementById('modalApplyBtn');
  let activeModalJob = null;

  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  // ==========================================================
  // Presets Configuration
  // ==========================================================
  const PRESETS = {
    ml: {
      name: "Alex Morgan",
      qualification: "B.Tech in Computer Science & AI",
      skills: "Python, Machine Learning, Pandas, Scikit-learn, SQL, Statistics, NumPy",
      interests: "Artificial Intelligence, Data Science, Deep Learning",
      preferredRole: "Machine Learning Engineer"
    },
    web: {
      name: "Sophia Chen",
      qualification: "BCA / Bachelor of Computer Applications",
      skills: "HTML5, CSS3, JavaScript, React, Tailwind CSS, Git, REST API, Node.js",
      interests: "Frontend Development, Interactive Web Apps, Modern UI",
      preferredRole: "Frontend Developer"
    },
    cloud: {
      name: "Marcus Vance",
      qualification: "BS in Information Technology",
      skills: "AWS, Linux, Docker, Kubernetes, CI/CD, Python, Terraform, Bash, Git",
      interests: "Cloud Computing, DevOps Automation, Infrastructure",
      preferredRole: "Cloud Engineer"
    },
    design: {
      name: "Maya Patel",
      qualification: "B.Des in Interaction & Product Design",
      skills: "Figma, Adobe XD, Wireframing, Prototyping, User Research, UI Design, UX Design, HTML5",
      interests: "Design Systems, User Experience, Usability Testing",
      preferredRole: "UI/UX Designer"
    }
  };

  // Preset Buttons Handling
  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.getAttribute('data-preset');
      const preset = PRESETS[presetKey];
      if (preset) {
        fullNameInput.value = preset.name;
        qualificationInput.value = preset.qualification;
        skillsInput.value = preset.skills;
        interestsInput.value = preset.interests;
        preferredRoleInput.value = preset.preferredRole;
        clearValidationErrors();
        showToast(`Loaded ${btn.textContent.trim()} profile!`, 'info');
      }
    });
  });

  // Quick Skill Chips
  document.querySelectorAll('.quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const rawSkill = chip.getAttribute('data-skill');
      const currentSkills = skillsInput.value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const exists = currentSkills.some(s => s.toLowerCase() === rawSkill.toLowerCase());
      if (!exists) {
        currentSkills.push(rawSkill);
        skillsInput.value = currentSkills.join(', ');
        clearFieldError(skillsInput, errorSkills);
        showToast(`Added ${rawSkill}`, 'info');
      } else {
        showToast(`${rawSkill} is already in your skills list`, 'info');
      }
    });
  });

  // Category Domain Click -> scrolls to assessment & pre-selects interest
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const domain = card.getAttribute('data-domain');
      interestsInput.value = domain;
      const target = document.getElementById('assessment');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        showToast(`Selected "${domain}" domain`, 'info');
      }
    });
  });

  // Mobile Menu Toggle
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('show');
      });
    });
  }

  // Dismiss Success Banner
  if (closeSuccessBannerBtn && resultsSuccessBanner) {
    closeSuccessBannerBtn.addEventListener('click', () => {
      resultsSuccessBanner.classList.add('d-none');
    });
  }

  // ==========================================================
  // Form Validation Helpers
  // ==========================================================
  function setFieldError(inputElem, errorElem, message) {
    inputElem.classList.add('is-invalid');
    if (errorElem) {
      errorElem.textContent = message;
      errorElem.classList.remove('d-none');
    }
  }

  function clearFieldError(inputElem, errorElem) {
    inputElem.classList.remove('is-invalid');
    if (errorElem) {
      errorElem.classList.add('d-none');
    }
  }

  function clearValidationErrors() {
    clearFieldError(fullNameInput, errorFullName);
    clearFieldError(qualificationInput, errorQualification);
    clearFieldError(skillsInput, errorSkills);
    if (formAlert) {
      formAlert.className = 'alert-box d-none';
      formAlert.textContent = '';
    }
  }

  fullNameInput.addEventListener('input', () => clearFieldError(fullNameInput, errorFullName));
  qualificationInput.addEventListener('input', () => clearFieldError(qualificationInput, errorQualification));
  skillsInput.addEventListener('input', () => clearFieldError(skillsInput, errorSkills));

  // ==========================================================
  // Form Submission & API Call
  // ==========================================================
  recommendationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearValidationErrors();

    const name = fullNameInput.value.trim();
    const qualification = qualificationInput.value.trim();
    const skills = skillsInput.value.trim();
    const interests = interestsInput.value.trim();
    const preferredRole = preferredRoleInput.value.trim();
    const topN = parseInt(topNSelect.value, 10) || 5;

    // Strict validation
    let hasError = false;
    if (!name) {
      setFieldError(fullNameInput, errorFullName, 'Please enter your full name.');
      hasError = true;
    }
    if (!qualification) {
      setFieldError(qualificationInput, errorQualification, 'Please enter your educational qualification.');
      hasError = true;
    }
    if (!skills) {
      setFieldError(skillsInput, errorSkills, 'Please enter at least one technical skill.');
      hasError = true;
    }

    if (hasError) {
      showFormAlert('Please fill in the required fields marked above.', 'danger');
      return;
    }

    // Show Loading state
    resultsSection.classList.remove('d-none');
    loadingIndicator.classList.remove('d-none');
    resultsContainer.classList.add('d-none');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Analyzing Profile...`;

    // Cycling loading text
    const loadingSteps = [
      "Analyzing profile and technical keywords...",
      "Converting skills into TF-IDF n-gram vectors...",
      "Evaluating cosine angles across benchmark jobs...",
      "Computing matched competencies & skill gaps...",
      "Finalizing top recommended opportunities..."
    ];
    let stepIndex = 0;
    if (loadingDynamicText) {
      loadingDynamicText.textContent = loadingSteps[0];
      clearInterval(loadingInterval);
      loadingInterval = setInterval(() => {
        stepIndex = (stepIndex + 1) % loadingSteps.length;
        loadingDynamicText.textContent = loadingSteps[stepIndex];
      }, 700);
    }

    // Smooth scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          qualification: qualification,
          skills: skills,
          interests: interests,
          preferred_role: preferredRole,
          top_n: topN
        })
      });

      const data = await response.json();

      if (!response.ok || data.status !== 'success') {
        throw new Error(data.message || 'Unable to generate recommendations.');
      }

      // Process Results
      const resultData = data.data;
      currentRecommendations = resultData.recommendations || [];
      filteredRecommendations = [...currentRecommendations];

      // Update Header & Success Banner
      resultsTitle.textContent = `Recommended Jobs for ${resultData.user_name}`;
      resultsSubtitle.textContent = `Evaluated against industry benchmark roles using TF-IDF vectorization and cosine similarity.`;
      evaluatedBadge.innerHTML = `<i class="fa-solid fa-database"></i> Evaluated ${resultData.total_jobs_evaluated} Benchmark Roles`;

      if (resultsSuccessBanner) {
        resultsSuccessBanner.classList.remove('d-none');
        const topScore = currentRecommendations.length > 0 ? currentRecommendations[0].similarity_score : 0;
        successBannerTitle.textContent = `🎉 Profile Analyzed Successfully!`;
        successBannerSubtitle.textContent = `Great news, ${resultData.user_name}! CareerMatch matched your profile with ${currentRecommendations.length} curated roles with similarity scores up to ${topScore}%.`;
      }

      // Populate filter categories
      populateFilterCategories(currentRecommendations);

      // Reset filter inputs
      filterSearch.value = '';
      filterCategory.value = 'all';
      sortOrder.value = 'sim_desc';

      renderRecommendations(filteredRecommendations);
      showToast(`Generated top ${currentRecommendations.length} recommendations!`, 'success');

    } catch (err) {
      console.error(err);
      showFormAlert(`Recommendation Error: ${err.message}`, 'danger');
      showToast(`Error: ${err.message}`, 'danger');
      resultsSection.classList.add('d-none');
    } finally {
      clearInterval(loadingInterval);
      loadingIndicator.classList.add('d-none');
      resultsContainer.classList.remove('d-none');
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Find Recommended Jobs`;
    }
  });

  // ==========================================================
  // Form Reset
  // ==========================================================
  resetBtn.addEventListener('click', () => {
    recommendationForm.reset();
    clearValidationErrors();
    resultsSection.classList.add('d-none');
    currentRecommendations = [];
    filteredRecommendations = [];
    showToast('Form cleared', 'info');
  });

  // ==========================================================
  // Category & Filter Population
  // ==========================================================
  function populateFilterCategories(jobs) {
    const categories = Array.from(new Set(jobs.map(j => j.category).filter(Boolean))).sort();
    filterCategory.innerHTML = `<option value="all">All Domains (${jobs.length})</option>`;
    categories.forEach(cat => {
      const count = jobs.filter(j => j.category === cat).length;
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = `${cat} (${count})`;
      filterCategory.appendChild(option);
    });
  }

  // Filter and Sort Handler
  function applyFiltersAndSort() {
    const searchTerm = filterSearch.value.trim().toLowerCase();
    const selectedCategory = filterCategory.value;
    const selectedSort = sortOrder.value;

    filteredRecommendations = currentRecommendations.filter(job => {
      const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory;
      const skillsJoined = (job.required_skills || []).join(' ').toLowerCase();
      const matchesSearch = !searchTerm ||
        job.job_title.toLowerCase().includes(searchTerm) ||
        job.company_name.toLowerCase().includes(searchTerm) ||
        skillsJoined.includes(searchTerm) ||
        job.job_description.toLowerCase().includes(searchTerm);

      return matchesCategory && matchesSearch;
    });

    // Sort
    if (selectedSort === 'sim_desc') {
      filteredRecommendations.sort((a, b) => b.similarity_score - a.similarity_score);
    } else if (selectedSort === 'sim_asc') {
      filteredRecommendations.sort((a, b) => a.similarity_score - b.similarity_score);
    } else if (selectedSort === 'title_asc') {
      filteredRecommendations.sort((a, b) => a.job_title.localeCompare(b.job_title));
    }

    const hasActiveFilters = searchTerm !== '' || selectedCategory !== 'all';
    clearFiltersBtn.classList.toggle('d-none', !hasActiveFilters);

    renderRecommendations(filteredRecommendations);
  }

  filterSearch.addEventListener('input', applyFiltersAndSort);
  filterCategory.addEventListener('change', applyFiltersAndSort);
  sortOrder.addEventListener('change', applyFiltersAndSort);

  clearFiltersBtn.addEventListener('click', () => {
    filterSearch.value = '';
    filterCategory.value = 'all';
    sortOrder.value = 'sim_desc';
    applyFiltersAndSort();
  });

  resetFiltersBtn.addEventListener('click', () => {
    filterSearch.value = '';
    filterCategory.value = 'all';
    sortOrder.value = 'sim_desc';
    applyFiltersAndSort();
  });

  // ==========================================================
  // Domain Avatar Icons & Color Helper
  // ==========================================================
  function getDomainVisuals(category) {
    const catLower = (category || '').toLowerCase();
    if (catLower.includes('software')) {
      return { icon: 'fa-solid fa-code', bg: '#dbeafe', color: '#1d4ed8' };
    } else if (catLower.includes('artificial') || catLower.includes('ai')) {
      return { icon: 'fa-solid fa-brain', bg: '#f3e8ff', color: '#7e22ce' };
    } else if (catLower.includes('data') || catLower.includes('analytics')) {
      return { icon: 'fa-solid fa-chart-line', bg: '#d1fae5', color: '#047857' };
    } else if (catLower.includes('cloud') || catLower.includes('devops')) {
      return { icon: 'fa-solid fa-cloud', bg: '#cffafe', color: '#0e7490' };
    } else if (catLower.includes('security')) {
      return { icon: 'fa-solid fa-shield-halved', bg: '#ffe4e6', color: '#be123c' };
    } else if (catLower.includes('design') || catLower.includes('product')) {
      return { icon: 'fa-solid fa-palette', bg: '#fef3c7', color: '#b45309' };
    } else {
      return { icon: 'fa-solid fa-database', bg: '#f1f5f9', color: '#334155' };
    }
  }

  function getScoreTier(score) {
    if (score >= 75) {
      return {
        pillClass: 'tier-high',
        badgeClass: 'tier-badge-high',
        label: 'Exceptional Match',
        icon: 'fa-solid fa-bolt'
      };
    } else if (score >= 50) {
      return {
        pillClass: 'tier-mid',
        badgeClass: 'tier-badge-mid',
        label: 'Strong Match',
        icon: 'fa-solid fa-check'
      };
    } else {
      return {
        pillClass: 'tier-low',
        badgeClass: 'tier-badge-low',
        label: 'Potential Growth',
        icon: 'fa-solid fa-arrow-trend-up'
      };
    }
  }

  // ==========================================================
  // Render Job Recommendations
  // ==========================================================
  function renderRecommendations(jobs) {
    jobCardsGrid.innerHTML = '';

    resultsCountText.textContent = `Showing ${jobs.length} of ${currentRecommendations.length} recommendations`;

    if (jobs.length === 0) {
      noResultsState.classList.remove('d-none');
      return;
    }

    noResultsState.classList.add('d-none');

    jobs.forEach((job) => {
      const card = createJobCard(job);
      jobCardsGrid.appendChild(card);
    });
  }

  function createJobCard(job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.dataset.jobId = job.job_id;

    const isSaved = savedJobIds.has(job.job_id);
    const domainVisual = getDomainVisuals(job.category);
    const tier = getScoreTier(job.similarity_score);

    const matchedCount = (job.matched_skills || []).length;
    const missingCount = (job.missing_skills || []).length;
    const totalSkills = matchedCount + missingCount;
    const matchedPercent = totalSkills > 0 ? Math.round((matchedCount / totalSkills) * 100) : 0;
    const missingPercent = 100 - matchedPercent;

    // Matched skills chips
    const matchedHtml = (job.matched_skills && job.matched_skills.length > 0)
      ? job.matched_skills.map(s => `<span class="chip chip-success"><i class="fa-solid fa-check"></i> ${escapeHtml(s)}</span>`).join('')
      : `<span class="chip chip-neutral">None direct</span>`;

    // Missing skills chips
    const missingHtml = (job.missing_skills && job.missing_skills.length > 0)
      ? job.missing_skills.map(s => `<span class="chip chip-missing"><i class="fa-solid fa-bolt"></i> ${escapeHtml(s)}</span>`).join('')
      : `<div class="all-matched-banner"><i class="fa-solid fa-star"></i> Perfect Match! You meet 100% of listed requirements.</div>`;

    const allSkillsFormatted = (job.required_skills || []).join(', ');

    card.innerHTML = `
      <div class="job-card-header">
        
        <div class="job-header-left">
          <div class="job-avatar" style="background: ${domainVisual.bg}; color: ${domainVisual.color};">
            <i class="${domainVisual.icon}"></i>
          </div>
          <div class="job-header-details">
            <div class="job-meta-row">
              <span class="job-category-badge">${escapeHtml(job.category)}</span>
              <span class="job-company"><i class="fa-regular fa-building"></i> ${escapeHtml(job.company_name)} <i class="fa-solid fa-circle-check text-primary" title="Verified Employer"></i></span>
              <span class="job-work-mode"><i class="fa-solid fa-briefcase"></i> Full-Time</span>
            </div>
            <h3 class="job-title">${escapeHtml(job.job_title)}</h3>
          </div>
        </div>

        <div class="job-match-gauge">
          <div class="score-pill ${tier.pillClass}">
            <span class="score-title-sub">Similarity Score</span>
            <span class="score-number">${job.similarity_score}%</span>
          </div>
          <span class="match-tier-badge ${tier.badgeClass}">
            <i class="${tier.icon}"></i> ${tier.label}
          </span>
        </div>

      </div>

      <!-- Segmented Match Progress Bar -->
      <div class="match-meter-wrapper">
        <div class="match-meter-bar">
          <div class="meter-fill-matched" style="width: ${matchedPercent}%;" title="${matchedCount} Matched Skills (${matchedPercent}%)"></div>
          <div class="meter-fill-missing" style="width: ${missingPercent}%;" title="${missingCount} Skills to Learn (${missingPercent}%)"></div>
        </div>
        <div class="match-meter-legend">
          <span class="text-success"><i class="fa-solid fa-check"></i> ${matchedCount} of ${totalSkills} Skills Matched (${matchedPercent}%)</span>
          <span class="text-danger"><i class="fa-solid fa-graduation-cap"></i> ${missingCount} Skills to Acquire</span>
        </div>
      </div>

      <p class="job-desc">${escapeHtml(job.job_description)}</p>

      <!-- Matched vs Missing Skills Matrix -->
      <div class="skills-matrix">
        
        <!-- Matched Skills Panel -->
        <div class="skill-panel skill-panel-matched">
          <div class="skill-panel-header">
            <span class="skill-panel-title text-success">
              <i class="fa-solid fa-circle-check"></i> Skills You Have
            </span>
            <span class="count-pill pill-success">${matchedCount} Matched</span>
          </div>
          <div class="skill-panel-sub">Competencies matching your profile</div>
          <div class="chips-row">${matchedHtml}</div>
        </div>

        <!-- Missing Skills Panel -->
        <div class="skill-panel skill-panel-missing">
          <div class="skill-panel-header">
            <span class="skill-panel-title text-danger">
              <i class="fa-solid fa-graduation-cap"></i> Skills to Learn
            </span>
            <span class="count-pill pill-danger">${missingCount} Roadmap</span>
          </div>
          <div class="skill-panel-sub">Interview preparation & learning opportunities</div>
          <div class="chips-row">${missingHtml}</div>
        </div>

      </div>

      <div class="card-footer">
        <div class="all-required-skills">
          <strong>All Required Skills:</strong> ${escapeHtml(allSkillsFormatted)}
        </div>
        <div class="card-actions">
          <button type="button" class="btn btn-secondary btn-sm btn-details" data-job-id="${job.job_id}">
            <i class="fa-regular fa-eye"></i> View Details
          </button>
          <button type="button" class="btn ${isSaved ? 'btn-primary' : 'btn-outline'} btn-sm btn-save" data-job-id="${job.job_id}">
            <i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i> ${isSaved ? 'Saved' : 'Save Job'}
          </button>
        </div>
      </div>
    `;

    // Event Listeners for Details & Save
    const detailsBtn = card.querySelector('.btn-details');
    detailsBtn.addEventListener('click', () => openJobModal(job, true));

    const saveBtn = card.querySelector('.btn-save');
    saveBtn.addEventListener('click', () => toggleSaveJob(job.job_id, saveBtn));

    return card;
  }

  // ==========================================================
  // Modal Handling
  // ==========================================================
  function openJobModal(job, isRecommendation = false) {
    activeModalJob = job;

    document.getElementById('modalCategory').textContent = job.category || 'Domain';
    document.getElementById('modalTitle').textContent = job.job_title;
    document.getElementById('modalCompany').innerHTML = `<i class="fa-regular fa-building"></i> ${escapeHtml(job.company_name)}`;
    document.getElementById('modalDescription').textContent = job.job_description;

    const modalSkills = document.getElementById('modalSkills');
    modalSkills.innerHTML = (job.required_skills || [])
      .map(s => `<span class="chip chip-neutral">${escapeHtml(s)}</span>`)
      .join('');

    const matchSection = document.getElementById('modalMatchSection');
    const matchContent = document.getElementById('modalMatchContent');

    if (isRecommendation && job.similarity_score !== undefined) {
      matchSection.classList.remove('d-none');
      const tier = getScoreTier(job.similarity_score);
      matchContent.innerHTML = `
        <div style="margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <span style="font-weight: 700; color: var(--dark);">Mathematical Similarity Score:</span>
          <span class="score-pill ${tier.pillClass}" style="min-width: auto; padding: 0.35rem 0.85rem; font-size: 1.1rem; flex-direction: row; gap: 0.45rem; align-items: center;">
            <strong>${job.similarity_score}%</strong> &bull; <small>${tier.label}</small>
          </span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.85rem;">
          Computed via Scikit-Learn TF-IDF Cosine Similarity: <code>${job.raw_cosine_score || (job.similarity_score / 100).toFixed(4)}</code>
        </p>
        <div class="skills-matrix" style="margin-bottom: 0;">
          <div class="skill-panel skill-panel-matched">
            <div class="skill-panel-header">
              <span class="skill-panel-title text-success"><i class="fa-solid fa-circle-check"></i> Matched (${(job.matched_skills || []).length})</span>
            </div>
            <div class="chips-row">
              ${(job.matched_skills || []).map(s => `<span class="chip chip-success"><i class="fa-solid fa-check"></i> ${escapeHtml(s)}</span>`).join('') || '<span class="chip chip-neutral">None</span>'}
            </div>
          </div>
          <div class="skill-panel skill-panel-missing">
            <div class="skill-panel-header">
              <span class="skill-panel-title text-danger"><i class="fa-solid fa-graduation-cap"></i> Roadmap (${(job.missing_skills || []).length})</span>
            </div>
            <div class="chips-row">
              ${(job.missing_skills || []).map(s => `<span class="chip chip-missing"><i class="fa-solid fa-bolt"></i> ${escapeHtml(s)}</span>`).join('') || '<div class="all-matched-banner">Complete Match!</div>'}
            </div>
          </div>
        </div>
      `;
    } else {
      matchSection.classList.add('d-none');
    }

    const isSaved = savedJobIds.has(job.job_id);
    modalApplyBtn.innerHTML = `<i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i> ${isSaved ? 'Saved to Bookmarks' : 'Save Job'}`;

    jobModal.classList.remove('d-none');
  }

  function closeJobModal() {
    jobModal.classList.add('d-none');
    activeModalJob = null;
  }

  modalCloseBtn.addEventListener('click', closeJobModal);
  modalCloseFooterBtn.addEventListener('click', closeJobModal);
  jobModal.addEventListener('click', (e) => {
    if (e.target === jobModal) closeJobModal();
  });

  modalApplyBtn.addEventListener('click', () => {
    if (!activeModalJob) return;
    toggleSaveJob(activeModalJob.job_id);
    const isSaved = savedJobIds.has(activeModalJob.job_id);
    modalApplyBtn.innerHTML = `<i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i> ${isSaved ? 'Saved to Bookmarks' : 'Save Job'}`;
  });

  // ==========================================================
  // Bookmark / Save Handling
  // ==========================================================
  function toggleSaveJob(jobId, buttonElement = null) {
    if (savedJobIds.has(jobId)) {
      savedJobIds.delete(jobId);
      showToast('Removed job from bookmarks', 'info');
    } else {
      savedJobIds.add(jobId);
      showToast('Job saved to your bookmarks!', 'success');
    }

    localStorage.setItem('cm_saved_jobs', JSON.stringify(Array.from(savedJobIds)));

    if (buttonElement) {
      const isSaved = savedJobIds.has(jobId);
      buttonElement.className = `btn ${isSaved ? 'btn-primary' : 'btn-outline'} btn-sm btn-save`;
      buttonElement.innerHTML = `<i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i> ${isSaved ? 'Saved' : 'Save Job'}`;
    }

    document.querySelectorAll(`.btn-save[data-job-id="${jobId}"]`).forEach(btn => {
      const isSaved = savedJobIds.has(jobId);
      btn.className = `btn ${isSaved ? 'btn-primary' : 'btn-outline'} btn-sm btn-save`;
      btn.innerHTML = `<i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i> ${isSaved ? 'Saved' : 'Save Job'}`;
    });
  }

  // ==========================================================
  // Catalog Loading (All Available Benchmark Jobs)
  // ==========================================================
  async function loadCatalog() {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      if (data.status === 'success') {
        allCatalogJobs = data.jobs || [];
        populateCatalogCategories();
        renderCatalog(allCatalogJobs);
      }
    } catch (e) {
      console.warn("Could not load full catalog:", e);
    }
  }

  function populateCatalogCategories() {
    const cats = Array.from(new Set(allCatalogJobs.map(j => j.category).filter(Boolean))).sort();
    catalogCategoryFilter.innerHTML = '<option value="all">All Domains</option>';
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      catalogCategoryFilter.appendChild(opt);
    });
  }

  function filterCatalog() {
    const term = catalogSearch.value.trim().toLowerCase();
    const cat = catalogCategoryFilter.value;

    const filtered = allCatalogJobs.filter(job => {
      const matchCat = cat === 'all' || job.category === cat;
      const skillsStr = (job.required_skills || []).join(' ').toLowerCase();
      const matchTerm = !term ||
        job.job_title.toLowerCase().includes(term) ||
        job.company_name.toLowerCase().includes(term) ||
        skillsStr.includes(term) ||
        job.job_description.toLowerCase().includes(term);

      return matchCat && matchTerm;
    });

    renderCatalog(filtered);
  }

  if (catalogSearch && catalogCategoryFilter) {
    catalogSearch.addEventListener('input', filterCatalog);
    catalogCategoryFilter.addEventListener('change', filterCatalog);
  }

  function renderCatalog(jobs) {
    if (!catalogGrid) return;
    catalogGrid.innerHTML = '';

    if (jobs.length === 0) {
      catalogGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; color: var(--text-muted);">
          No benchmark jobs found matching your criteria.
        </div>
      `;
      return;
    }

    jobs.forEach(job => {
      const card = document.createElement('div');
      card.className = 'catalog-card';
      const isSaved = savedJobIds.has(job.job_id);

      card.innerHTML = `
        <div class="catalog-header">
          <span class="job-category-badge">${escapeHtml(job.category)}</span>
          <span class="cat-count">#${job.job_id}</span>
        </div>
        <h3>${escapeHtml(job.job_title)}</h3>
        <p class="catalog-company"><i class="fa-regular fa-building"></i> ${escapeHtml(job.company_name)}</p>
        <p class="catalog-desc">${escapeHtml(job.job_description)}</p>
        <div class="chips-row" style="margin-bottom: 1.25rem;">
          ${(job.required_skills || []).slice(0, 4).map(s => `<span class="chip chip-neutral">${escapeHtml(s)}</span>`).join('')}
          ${(job.required_skills || []).length > 4 ? `<span class="chip chip-neutral">+${(job.required_skills.length - 4)} more</span>` : ''}
        </div>
        <div style="display: flex; gap: 0.5rem; margin-top: auto;">
          <button type="button" class="btn btn-secondary btn-sm" style="flex: 1;" onclick="window.viewCatalogJob(${job.job_id})">
            <i class="fa-regular fa-eye"></i> Details
          </button>
        </div>
      `;
      catalogGrid.appendChild(card);
    });
  }

  window.viewCatalogJob = function(jobId) {
    const job = allCatalogJobs.find(j => j.job_id === jobId);
    if (job) openJobModal(job, false);
  };

  // ==========================================================
  // Utilities: Alerts, Toasts, Escaping
  // ==========================================================
  function showFormAlert(msg, type = 'danger') {
    if (!formAlert) return;
    formAlert.className = `alert-box alert-${type}`;
    formAlert.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>${escapeHtml(msg)}</span>`;
    formAlert.classList.remove('d-none');
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'fa-solid fa-circle-info text-primary';
    if (type === 'success') icon = 'fa-solid fa-circle-check text-success';
    if (type === 'danger') icon = 'fa-solid fa-triangle-exclamation text-danger';

    toast.innerHTML = `<i class="${icon}"></i> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function escapeHtml(string) {
    if (typeof string !== 'string') return string;
    return string
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial load
  loadCatalog();
});
