let jobs = [];
let filteredJobs = [];
let appliedJobs = [];
let currentUser = 'job_seeker';
let currentJobId = null;
let isEditing = false;

const elements = {
  roleSelector: document.getElementById('roleSelector'),
  themeToggle: document.getElementById('themeToggle'),
  addJobBtn: document.getElementById('addJobBtn'),
  searchInput: document.getElementById('searchInput'),
  locationFilter: document.getElementById('locationFilter'),
  jobTypeFilter: document.getElementById('jobTypeFilter'),
  experienceFilter: document.getElementById('experienceFilter'),
  sortSelect: document.getElementById('sortSelect'),
  clearFilters: document.getElementById('clearFilters'),
  jobsGrid: document.getElementById('jobsGrid'),
  jobCount: document.getElementById('jobCount'),
  loadingState: document.getElementById('loadingState'),
  noJobsFound: document.getElementById('noJobsFound'),
  refreshJobs: document.getElementById('refreshJobs'),
  appliedJobsList: document.getElementById('appliedJobsList'),
  appliedJobsSection: document.getElementById('appliedJobsSection'),
  jobModal: document.getElementById('jobModal'),
  jobDetailsModal: document.getElementById('jobDetailsModal'),
  closeModal: document.getElementById('closeModal'),
  closeDetailsModal: document.getElementById('closeDetailsModal'),
  jobForm: document.getElementById('jobForm'),
  modalTitle: document.getElementById('modalTitle'),
  jobId: document.getElementById('jobId'),
  jobTitle: document.getElementById('jobTitle'),
  jobCompany: document.getElementById('jobCompany'),
  jobLocation: document.getElementById('jobLocation'),
  jobSalary: document.getElementById('jobSalary'),
  jobType: document.getElementById('jobType'),
  jobExperience: document.getElementById('jobExperience'),
  jobSkills: document.getElementById('jobSkills'),
  jobDescription: document.getElementById('jobDescription'),
  cancelJob: document.getElementById('cancelJob'),
  jobDetails: document.getElementById('jobDetails'),
  detailsTitle: document.getElementById('detailsTitle'),
  applyForJob: document.getElementById('applyForJob'),
  editJobBtn: document.getElementById('editJobBtn'),
  deleteJobBtn: document.getElementById('deleteJobBtn'),
  notifications: document.getElementById('notifications')
};

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  elements.notifications.appendChild(notification);
  setTimeout(() => notification.remove(), 4000);
}

const formatDate = dateString => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const debounce = (fn, wait) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
};

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Storage save error:', err);
  }
}

function getFromStorage(key, defaultValue = null) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

async function fetchJobs() {
  try {
    elements.loadingState.style.display = 'flex';
    elements.noJobsFound.style.display = 'none';

    const response = await fetch('https://jsonfakery.com/jobs');
    if (!response.ok) throw new Error('Failed to fetch jobs');

    const apiJobs = await response.json();
    const customJobs = getFromStorage('customJobs', []);

    const processedApiJobs = apiJobs.map(job => ({
      id: job.id || generateId(),
      title: job.title || job.job_title || 'Untitled',
      company: job.company || job.employer || 'Company',
      location: job.location || job.city || 'Remote',
      salary: job.salary || job.salary_range || '',
      type: job.type || job.employment_type || 'full-time',
      experience: job.experience || job.experience_level || 'mid',
      description: job.description || job.job_description || 'No description',
      skills: job.skills || job.required_skills || [],
      postedDate: job.postedDate || job.date_posted || new Date().toISOString(),
      isCustom: false
    }));

    jobs = [...processedApiJobs, ...customJobs];
    populateLocationFilter();
    applyFilters();
    elements.loadingState.style.display = 'none';
    showNotification(`Loaded ${jobs.length} jobs`, 'success');

  } catch (error) {
    console.error(error);
    elements.loadingState.style.display = 'none';
    jobs = getFromStorage('customJobs', []);
    if (!jobs.length) {
      jobs = createSampleJobs();
      showNotification('Using sample jobs — API unavailable', 'warning');
    }
    populateLocationFilter();
    applyFilters();
  }
}

function createSampleJobs() {
  return [
    {
      id: 's1',
      title: 'Frontend Developer',
      company: 'TechCorp',
      location: 'Hyderabad',
      salary: '₹8-12 LPA',
      type: 'full-time',
      experience: 'mid',
      description: 'Build UI features using HTML, CSS, and JS',
      skills: ['JavaScript', 'CSS', 'HTML'],
      postedDate: new Date().toISOString(),
      isCustom: true
    },
    {
      id: 's2',
      title: 'Data Analyst Intern',
      company: 'DataWorks',
      location: 'Remote',
      salary: '₹20k stipend',
      type: 'internship',
      experience: 'entry',
      description: 'Analyze datasets and prepare reports',
      skills: ['Excel', 'SQL', 'Python'],
      postedDate: new Date(Date.now() - 86400000).toISOString(),
      isCustom: true
    }
  ];
}

function populateLocationFilter() {
  const locations = [...new Set(jobs.map(j => j.location))].sort();
  const select = elements.locationFilter;
  const currentValue = select.value;

  select.innerHTML = '<option value="">All Locations</option>';
  locations.forEach(loc => {
    const option = document.createElement('option');
    option.value = loc;
    option.textContent = loc;
    select.appendChild(option);
  });

  select.value = currentValue;
}

function applyFilters() {
  const searchTerm = elements.searchInput.value.toLowerCase().trim();
  const selectedLocation = elements.locationFilter.value;
  const selectedType = elements.jobTypeFilter.value;
  const selectedExperience = elements.experienceFilter.value;
  const sortBy = elements.sortSelect.value;

  filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm ||
      job.title.toLowerCase().includes(searchTerm) ||
      job.company.toLowerCase().includes(searchTerm) ||
      job.description.toLowerCase().includes(searchTerm) ||
      (Array.isArray(job.skills) && job.skills.join(' ').toLowerCase().includes(searchTerm));

    const matchesLocation = !selectedLocation || job.location === selectedLocation;
    const matchesType = !selectedType || job.type === selectedType;
    const matchesExperience = !selectedExperience || job.experience === selectedExperience;

    return matchesSearch && matchesLocation && matchesType && matchesExperience;
  });

  sortJobs(sortBy);
  renderJobs();
  updateJobCount();
}

function sortJobs(sortBy) {
  filteredJobs.sort((a, b) => {
    switch (sortBy) {
      case 'date_desc':
        return new Date(b.postedDate) - new Date(a.postedDate);
      case 'date_asc':
        return new Date(a.postedDate) - new Date(b.postedDate);
      case 'title_asc':
        return a.title.localeCompare(b.title);
      case 'title_desc':
        return b.title.localeCompare(a.title);
      case 'company_asc':
        return a.company.localeCompare(b.company);
      default:
        return new Date(b.postedDate) - new Date(a.postedDate);
    }
  });
}

function clearAllFilters() {
  elements.searchInput.value = '';
  elements.locationFilter.value = '';
  elements.jobTypeFilter.value = '';
  elements.experienceFilter.value = '';
  elements.sortSelect.value = 'date_desc';
  applyFilters();
  showNotification('Filters cleared', 'success');
}

function updateJobCount() {
  const totalJobs = jobs.length;
  const filteredCount = filteredJobs.length;
  elements.jobCount.textContent = filteredCount === totalJobs
    ? `Showing ${totalJobs} jobs`
    : `Showing ${filteredCount} of ${totalJobs} jobs`;
}

function renderJobs() {
  if (!filteredJobs.length) {
    elements.jobsGrid.style.display = 'none';
    elements.noJobsFound.style.display = 'block';
    return;
  }

  elements.noJobsFound.style.display = 'none';
  elements.jobsGrid.style.display = 'grid';
  elements.jobsGrid.innerHTML = filteredJobs.map(createJobCard).join('');
}

function createJobCard(job) {
  const skills = Array.isArray(job.skills) ? job.skills : [];
  const skillHtml = skills.slice(0, 3).map(skill => `<span class="tag">${skill}</span>`).join('');
  const applied = appliedJobs.includes(job.id);

  return `
    <div class="job-card" onclick="showJobDetails('${job.id}')">
      <div class="job-header">
        <div>
          <h3 class="job-title">${job.title}</h3>
          <div class="job-company">${job.company}</div>
        </div>
      </div>

      <div class="job-meta">
        <div>📍 ${job.location}</div>
        <div>💼 ${job.type.toUpperCase()}</div>
        <div>⭐ ${job.experience.toUpperCase()}</div>
        <div>📅 ${formatDate(job.postedDate)}</div>
        ${job.salary ? `<div>💰 ${job.salary}</div>` : ''}
      </div>

      <div class="job-description">${job.description}</div>

      ${skillHtml ? `<div class="job-tags">${skillHtml}${skills.length > 3 ? `<span class="tag">+${skills.length-3} more</span>` : ''}</div>` : ''}

      <div class="job-actions" onclick="event.stopPropagation()">
        ${currentUser === 'job_seeker'
          ? `<button class="btn ${applied ? 'btn-secondary' : 'btn-success'} btn-sm"
                     onclick="applyForJob('${job.id}')"
                     ${applied ? 'disabled' : ''}>
               ${applied ? 'Applied' : 'Apply Now'}
             </button>`
          : `<button class="btn btn-primary btn-sm" onclick="editJob('${job.id}')">Edit</button>
             <button class="btn btn-danger btn-sm" onclick="deleteJob('${job.id}')">Delete</button>`}

        <button class="btn btn-secondary btn-sm" onclick="showJobDetails('${job.id}')">View Details</button>
      </div>
    </div>
  `;
}

function renderAppliedJobs() {
  if (currentUser !== 'job_seeker') {
    elements.appliedJobsSection.style.display = 'none';
    return;
  }

  elements.appliedJobsSection.style.display = 'block';

  const listItems = appliedJobs
    .map(jobId => {
      const job = jobs.find(j => j.id === jobId);
      if (!job) return '';
      return `
        <div class="applied-item" onclick="showJobDetails('${job.id}')">
          <strong>${job.title}</strong><br>
          <small>${job.company} • ${job.location}</small>
        </div>
      `;
    })
    .filter(Boolean);

  elements.appliedJobsList.innerHTML = listItems.length
    ? listItems.join('')
    : '<div class="applied-item">No applications yet</div>';
}

function showJobDetails(id) {
  const job = jobs.find(j => j.id === id);
  if (!job) return;

  currentJobId = id;

  const skillsHtml = (job.skills || []).map(skill => `<span class="tag">${skill}</span>`).join('');

  elements.detailsTitle.textContent = job.title;
  elements.jobDetails.innerHTML = `
    <div class="job-meta">
      <div><b>Company:</b> ${job.company}</div>
      <div><b>Location:</b> ${job.location}</div>
      <div><b>Type:</b> ${job.type}</div>
      <div><b>Experience:</b> ${job.experience}</div>
      <div><b>Posted:</b> ${formatDate(job.postedDate)}</div>
      ${job.salary ? `<div><b>Salary:</b> ${job.salary}</div>` : ''}
    </div>
    <h3>Description</h3>
    <p style="white-space:pre-wrap">${job.description}</p>
    ${skillsHtml ? `<h3>Skills</h3><div class="job-tags">${skillsHtml}</div>` : ''}
  `;

  if (currentUser === 'job_seeker') {
    const applied = appliedJobs.includes(id);
    elements.applyForJob.style.display = 'inline-flex';
    elements.applyForJob.textContent = applied ? 'Applied' : 'Apply for Job';
    elements.applyForJob.className = applied ? 'btn btn-secondary' : 'btn btn-success';
    elements.applyForJob.disabled = applied;

    elements.editJobBtn.style.display = 'none';
    elements.deleteJobBtn.style.display = 'none';
  } else {
    elements.applyForJob.style.display = 'none';
    elements.editJobBtn.style.display = 'inline-flex';
    elements.deleteJobBtn.style.display = 'inline-flex';
  }

  elements.jobDetailsModal.classList.add('active');
}

function applyForJob(id) {
  if (currentUser !== 'job_seeker') {
    showNotification('Only job seekers can apply', 'error');
    return;
  }

  if (appliedJobs.includes(id)) {
    showNotification('Already applied for this job', 'warning');
    return;
  }

  const job = jobs.find(j => j.id === id);
  if (!job) return;

  appliedJobs.push(id);
  saveToStorage('appliedJobs', appliedJobs);

  showNotification(`Applied for ${job.title}`, 'success');

  renderJobs();
  renderAppliedJobs();
  elements.jobDetailsModal.classList.remove('active');
}

function addNewJob() {
  if (currentUser !== 'recruiter') {
    showNotification('Only recruiters can add jobs', 'error');
    return;
  }

  isEditing = false;
  currentJobId = null;
  elements.modalTitle.textContent = 'Add New Job';
  clearJobForm();
  elements.jobModal.classList.add('active');
}

function editJob(id) {
  if (currentUser !== 'recruiter') return;

  const job = jobs.find(j => j.id === id);
  if (!job) return;

  isEditing = true;
  currentJobId = id;
  elements.modalTitle.textContent = 'Edit Job';

  elements.jobId.value = job.id;
  elements.jobTitle.value = job.title;
  elements.jobCompany.value = job.company;
  elements.jobLocation.value = job.location;
  elements.jobSalary.value = job.salary || '';
  elements.jobType.value = job.type;
  elements.jobExperience.value = job.experience;
  elements.jobSkills.value = (job.skills || []).join(', ');
  elements.jobDescription.value = job.description;

  elements.jobModal.classList.add('active');
}

function deleteJob(id) {
  if (currentUser !== 'recruiter') return;

  const job = jobs.find(j => j.id === id);
  if (!job) return;

  if (confirm(`Are you sure you want to delete "${job.title}"?`)) {
    jobs = jobs.filter(j => j.id !== id);
    appliedJobs = appliedJobs.filter(aid => aid !== id);

    saveToStorage('appliedJobs', appliedJobs);
    saveToStorage('customJobs', jobs.filter(j => j.isCustom));

    applyFilters();
    renderAppliedJobs();
    elements.jobDetailsModal.classList.remove('active');

    showNotification('Job deleted successfully', 'success');
  }
}

function saveJob(formData) {
  const skills = formData.skills
    ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const job = {
    id: formData.id || generateId(),
    title: formData.title,
    company: formData.company,
    location: formData.location,
    salary: formData.salary,
    type: formData.type,
    experience: formData.experience,
    skills: skills,
    description: formData.description,
    postedDate: new Date().toISOString(),
    isCustom: true
  };

  if (isEditing) {
    const index = jobs.findIndex(j => j.id === job.id);
    if (index >= 0) jobs[index] = { ...jobs[index], ...job };
    showNotification('Job updated successfully', 'success');
  } else {
    jobs.unshift(job);
    showNotification('Job added successfully', 'success');
  }

  saveToStorage('customJobs', jobs.filter(j => j.isCustom));

  elements.jobModal.classList.remove('active');
  populateLocationFilter();
  applyFilters();
}

function clearJobForm() {
  elements.jobForm.reset();
  elements.jobId.value = '';
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? '' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  elements.themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  saveToStorage('theme', newTheme);
}

function loadTheme() {
  const theme = getFromStorage('theme', '');
  document.documentElement.setAttribute('data-theme', theme);
  elements.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function switchUserRole() {
  currentUser = elements.roleSelector.value;
  saveToStorage('currentUser', currentUser);

  elements.addJobBtn.style.display = currentUser === 'recruiter' ? 'inline-flex' : 'none';
  renderJobs();
  renderAppliedJobs();

  showNotification(`Switched to ${currentUser.replace('_', ' ')} mode`, 'success');
}

function loadUserRole() {
  currentUser = getFromStorage('currentUser', 'job_seeker');
  elements.roleSelector.value = currentUser;
  elements.addJobBtn.style.display = currentUser === 'recruiter' ? 'inline-flex' : 'none';
}

function setupEvents() {
  elements.roleSelector.addEventListener('change', switchUserRole);
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.addJobBtn.addEventListener('click', addNewJob);
  elements.refreshJobs.addEventListener('click', fetchJobs);

  const debouncedSearch = debounce(applyFilters, 300);
  elements.searchInput.addEventListener('input', debouncedSearch);

  elements.locationFilter.addEventListener('change', applyFilters);
  elements.jobTypeFilter.addEventListener('change', applyFilters);
  elements.experienceFilter.addEventListener('change', applyFilters);
  elements.sortSelect.addEventListener('change', applyFilters);
  elements.clearFilters.addEventListener('click', clearAllFilters);

  elements.closeModal.addEventListener('click', () => elements.jobModal.classList.remove('active'));
  elements.closeDetailsModal.addEventListener('click', () => elements.jobDetailsModal.classList.remove('active'));
  elements.cancelJob.addEventListener('click', () => elements.jobModal.classList.remove('active'));

  elements.jobForm.addEventListener('submit', e => {
    e.preventDefault();
    const formData = {
      id: elements.jobId.value,
      title: elements.jobTitle.value.trim(),
      company: elements.jobCompany.value.trim(),
      location: elements.jobLocation.value.trim(),
      salary: elements.jobSalary.value.trim(),
      type: elements.jobType.value,
      experience: elements.jobExperience.value,
      skills: elements.jobSkills.value.trim(),
      description: elements.jobDescription.value.trim()
    };

    if (!formData.title || !formData.company || !formData.location || !formData.type || !formData.experience || !formData.description) {
      showNotification('Please fill all required fields', 'error');
      return;
    }

    saveJob(formData);
  });

  elements.applyForJob.addEventListener('click', () => applyForJob(currentJobId));
  elements.editJobBtn.addEventListener('click', () => editJob(currentJobId));
  elements.deleteJobBtn.addEventListener('click', () => deleteJob(currentJobId));
}

async function init() {
  loadTheme();
  loadUserRole();

  appliedJobs = getFromStorage('appliedJobs', []);
  await fetchJobs();
  renderAppliedJobs();

  setupEvents();
}

window.onload = init;
