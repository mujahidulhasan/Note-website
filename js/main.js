// constants
const APP_CONTENT = document.getElementById('app-content');
const SETTINGS_PANEL = document.getElementById('settings-panel');
const OVERLAY = document.getElementById('overlay');
const API_BASE = '/api'; // আপনার API ফোল্ডার পাথ

// ----------------------------------------------------
// ১. ইউটিলিটি ফাংশন
// ----------------------------------------------------

async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server returned HTTP status ${response.status}. Response: ${errorText.substring(0, 50)}...`);
        }
        return await response.json();
    } catch (error) {
        console.error("Fetch failed for endpoint:", endpoint, error);
        if(APP_CONTENT) APP_CONTENT.innerHTML = `<p class="error-message">ডেটা লোড করতে সমস্যা হয়েছে: ${error.message}</p>`;
        return { success: false, data: [] };
    }
}

function isNew(dateString) {
    const uploadDate = new Date(dateString);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return uploadDate > threeDaysAgo;
}

// ----------------------------------------------------
// ২. সেটিংস লজিক (localStorage)
// ----------------------------------------------------

const themeToggle = document.getElementById('theme-toggle');
const modeText = document.getElementById('mode-text');
const gridSpacingSlider = document.getElementById('grid-spacing-slider');
const cardSizeSelect = document.getElementById('card-size-select');
const fontSizeSlider = document.getElementById('font-size-slider');
const ROOT = document.documentElement; 

function saveSettings(key, value) {
    localStorage.setItem(key, value);
    applySettings();
}

function loadSettings() {
    const savedTheme = localStorage.getItem('theme') || 'light-mode';
    document.body.className = savedTheme;
    if(themeToggle) themeToggle.checked = savedTheme === 'dark-mode';
    if(modeText) modeText.textContent = savedTheme === 'dark-mode' ? 'ডার্ক মোড' : 'লাইট মোড';

    const savedSpacing = localStorage.getItem('gridSpacing') || '20';
    ROOT.style.setProperty('--grid-spacing', `${savedSpacing}px`);
    if(gridSpacingSlider) gridSpacingSlider.value = savedSpacing;

    const savedCardSize = localStorage.getItem('cardSize') || 'medium';
    if(cardSizeSelect) cardSizeSelect.value = savedCardSize;

    const savedFontSize = localStorage.getItem('fontSize') || '16';
    ROOT.style.setProperty('--font-size-base', `${savedFontSize}px`);
    if(fontSizeSlider) fontSizeSlider.value = savedFontSize;
    
    const grid = document.getElementById('content-grid');
    if (grid) {
        grid.classList.remove('card-size-small', 'card-size-large');
        if (savedCardSize !== 'medium') { grid.classList.add(`card-size-${savedCardSize}`); }
    }
}

function applySettings() {
    const theme = themeToggle.checked ? 'dark-mode' : 'light-mode';
    saveSettings('theme', theme);
    document.body.className = theme;
    if(modeText) modeText.textContent = theme === 'dark-mode' ? 'ডার্ক মোড' : 'লাইট মোড';
    
    const spacing = gridSpacingSlider.value;
    saveSettings('gridSpacing', spacing);
    ROOT.style.setProperty('--grid-spacing', `${spacing}px`);

    const cardSize = cardSizeSelect.value;
    saveSettings('cardSize', cardSize);
    const grid = document.getElementById('content-grid');
    if (grid) {
        grid.classList.remove('card-size-small', 'card-size-large');
        if (cardSize !== 'medium') {
            grid.classList.add(`card-size-${cardSize}`);
        }
    }

    const fontSize = fontSizeSlider.value;
    saveSettings('fontSize', fontSize);
    ROOT.style.setProperty('--font-size-base', `${fontSize}px`);
}

// সেটিংস ইভেন্ট লিসেনার
if(themeToggle) themeToggle.addEventListener('change', applySettings);
if(gridSpacingSlider) gridSpacingSlider.addEventListener('input', applySettings);
if(cardSizeSelect) cardSizeSelect.addEventListener('change', applySettings);
if(fontSizeSlider) fontSizeSlider.addEventListener('input', applySettings);

// সেটিংস প্যানেল লজিক
const settingsBtn = document.getElementById('settings-btn');
if(settingsBtn) settingsBtn.addEventListener('click', () => {
    if(SETTINGS_PANEL) SETTINGS_PANEL.classList.add('open');
    if(OVERLAY) OVERLAY.classList.add('active');
});

if(OVERLAY) OVERLAY.addEventListener('click', () => {
    if(SETTINGS_PANEL) SETTINGS_PANEL.classList.remove('open');
    if(OVERLAY) OVERLAY.classList.remove('active');
});

// ----------------------------------------------------
// ৩. কন্টেন্ট রেন্ডারিং ফাংশন
// ----------------------------------------------------

/**
 * সাবজেক্ট কার্ড রেন্ডার করে
 */
function renderSubjectCard(subject) {
    const subjectSlug = subject.name.toLowerCase().replace(/\s+/g, '-');
    return `
        <a href="/subject/${subjectSlug}" class="subject-card" data-subject-id="${subject.id}">
            <img src="${subject.icon_url}" alt="${subject.name} icon" class="subject-icon">
            <h3>${subject.name}</h3>
            <p>${subject.description || ''}</p>
        </a>
    `;
}

/**
 * নোট কার্ড রেন্ডার করে
 */
function renderNoteCard(note) {
    const isNewNote = isNew(note.upload_date);
    let previewContent = '';
    let iconClass = '';
    let previewTypeClass = '';
    
    // ফাইল পাথের প্রথম '../' অংশটি বাদ দেওয়া হয়েছে, যাতে ব্রাউজার সরাসরি লোড করতে পারে
    let filePath = note.file_path; 
    const uploadsIndex = filePath.indexOf('uploads/');

    if (uploadsIndex !== -1) {
        filePath = filePath.substring(uploadsIndex); 
    } else {
        filePath = filePath.replace('../', '');
    }
    
    if (!filePath.startsWith('/')) {
        filePath = '/' + filePath; 
    }
    
    // প্রিভিউ লজিক
    switch (note.file_type) {
        case 'pdf':
            previewContent = `<div class="text-preview">
                <i class="fas fa-file-pdf fa-2x accent-color"></i><br>
                <small>প্রথম পৃষ্ঠা প্রিভিউ (PDF.js)</small>
            </div>`;
            iconClass = 'fa-file-pdf';
            previewTypeClass = 'pdf-preview';
            break;
        case 'image':
            previewContent = `<img src="${filePath}" alt="${note.title} preview">`;
            iconClass = 'fa-image';
            previewTypeClass = 'image-preview';
            break;
        case 'video':
            previewContent = `<video src="${filePath}" muted loop autoplay playsinline></video>`;
            iconClass = 'fa-video';
            previewTypeClass = 'video-preview';
            break;
        case 'text':
            const previewText = note.preview_text || 'টেক্সট প্রিভিউ পাওয়া যায়নি।';
            previewContent = `<div class="text-preview">
                <p>${previewText.split('\n').slice(0, 4).join('<br>')}</p>
                <small>...দেখতে ক্লিক করুন</small>
            </div>`;
            iconClass = 'fa-file-alt';
            previewTypeClass = 'text-preview';
            break;
    }

    return `
        <a href="/note/${note.id}" class="note-card" data-note-id="${note.id}">
            <div class="note-preview ${previewTypeClass}">${previewContent}</div>
            <div class="note-details">
                <h4>
                    <i class="fas ${iconClass}"></i> ${note.title}
                    ${isNewNote ? '<span class="new-tag">নতুন</span>' : ''}
                </h4>
                <div class="note-meta">
                    <span>${note.chapter_name ? note.chapter_name : 'সাধারণ নোট'}</span>
                    <span>আপলোড: ${new Date(note.upload_date).toLocaleDateString('bn-BD')}</span>
                </div>
            </div>
        </a>
    `;
}

// ----------------------------------------------------
// ৪. রাউটিং এবং কন্টেন্ট লোডিং
// ----------------------------------------------------

/**
 * হোমপেজ লোড করে (সাবজেক্ট গ্রিড)
 */
async function loadHomePage() {
    document.title = "Study Vault – বিষয়সমূহ";
    if(APP_CONTENT) APP_CONTENT.innerHTML = `
        <h2>📚 বিষয়সমূহ</h2>
        <div id="content-grid" class="subject-grid grid-2-col"></div>
    `;
    const grid = document.getElementById('content-grid');
    
    const savedCardSize = localStorage.getItem('cardSize') || 'medium';
    if (savedCardSize !== 'medium') {
        if(grid) grid.classList.add(`card-size-${savedCardSize}`);
    }

    const { success, data: subjects } = await fetchData('/subject.php?action=list');

    if (success && subjects && subjects.length > 0) {
        if(grid) grid.innerHTML = subjects.map(renderSubjectCard).join('');
    } else {
        if(grid) grid.innerHTML = '<p class="info-message">কোনো বিষয় পাওয়া যায়নি। অ্যাডমিন প্যানেল থেকে যোগ করুন।</p>';
    }
}

/**
 * সাবজেক্ট পেজ লোড করে (চ্যাপ্টার + নোটস)
 */
async function loadSubjectPage(subjectNameSlug) {
    document.title = `Study Vault – ${subjectNameSlug.replace(/-/g, ' ').toUpperCase()}`;
    
    if(APP_CONTENT) APP_CONTENT.innerHTML = `
        <a href="/" class="back-link"><i class="fas fa-arrow-left"></i> সকল বিষয়ে ফিরে যান</a>
        <h2 id="subject-title"></h2>
        <div id="content-grid" class="notes-grid grid-2-col"></div>
    `;
    const grid = document.getElementById('content-grid');
    const titleElement = document.getElementById('subject-title');

    const savedCardSize = localStorage.getItem('cardSize') || 'medium';
    if (savedCardSize !== 'medium') {
        if(grid) grid.classList.add(`card-size-${savedCardSize}`);
    }

    if(titleElement) titleElement.textContent = subjectNameSlug.replace(/-/g, ' ');

    const { success, subject_name, notes } = await fetchData(`/notes.php?action=subject_notes&slug=${subjectNameSlug}`);

    if (success && subject_name) {
        if(titleElement) titleElement.textContent = subject_name; 
    }

    if (success && notes && notes.length > 0) {
        if(grid) grid.innerHTML = notes.map(renderNoteCard).join('');
    } else {
        if(grid) grid.innerHTML = '<p class="info-message">এই বিষয়ে কোনো নোটস বা চ্যাপ্টার পাওয়া যায়নি।</p>';
    }
}


/**
 * নোট ভিউয়ার পেজ লোড করে
 */
async function loadNoteViewer(noteId) {
    document.title = `Study Vault – নোট ভিউয়ার`;
    if(APP_CONTENT) APP_CONTENT.innerHTML = '<h2>📖 নোট ভিউয়ার লোড হচ্ছে...</h2>';

    const { success, data: note } = await fetchData(`/notes.php?action=get_note&id=${noteId}`);

    if (success && note) {
        document.title = `Study Vault – ${note.title}`;
        let viewerContent = '';
        const filePath = note.file_path.replace('../', ''); 
        
        switch (note.file_type) {
            case 'pdf':
                viewerContent = `
                    <div id="pdf-viewer-container" style="height: 80vh;">
                        <iframe src="${filePath}" style="width: 100%; height: 100%; border: none;"></iframe>
                    </div>
                `;
                break;
            case 'image':
                viewerContent = `<div class="image-viewer-container" style="text-align: center;">
                    <img src="${filePath}" alt="${note.title}" style="max-width: 90%; height: auto; display: inline-block; border-radius: 8px; box-shadow: var(--shadow);">
                </div>`;
                break;
            case 'video':
                viewerContent = `<div class="video-player-container">
                    <video src="${filePath}" controls style="max-width: 100%; height: auto; display: block; border-radius: 8px;"></video>
                </div>`;
                break;
            case 'text':
                const textContent = note.full_text_content || "ফাইল কন্টেন্ট লোড করা যায়নি।";
                viewerContent = `<div class="text-reader-container" style="white-space: pre-wrap; padding: 20px; border: 1px solid var(--border-color); background-color: var(--card-background); border-radius: 8px;">
                    <p>${textContent}</p>
                </div>`;
                break;
        }

        if(APP_CONTENT) APP_CONTENT.innerHTML = `
            <a href="javascript:history.back()" class="back-link"><i class="fas fa-arrow-left"></i> ফিরে যান</a>
            <h2>${note.title}</h2>
            <div class="note-options" style="margin-bottom: 20px;">
                <a href="${filePath}" download="${note.title}.${note.file_type.toLowerCase().substring(0,3)}" class="submit-btn"><i class="fas fa-download"></i> ডাউনলোড</a>
            </div>
            ${viewerContent}
        `;

    } else {
        if(APP_CONTENT) APP_CONTENT.innerHTML = '<p class="error-message">নোটটি খুঁজে পাওয়া যায়নি বা লোড করা যায়নি।</p>';
    }
}


/**
 * URL পরিবর্তন হলে সঠিক ফাংশন কল করে
 */
function handleRoute(path) {
    if(SETTINGS_PANEL) SETTINGS_PANEL.classList.remove('open');
    if(OVERLAY) OVERLAY.classList.remove('active');

    if (path === '/' || path === '' || path.startsWith('/?')) {
        loadHomePage();
    } else if (path.startsWith('/subject/')) {
        const parts = path.split('/');
        const subjectSlug = parts[2];
        loadSubjectPage(subjectSlug);
    } else if (path.startsWith('/note/')) {
        const parts = path.split('/');
        const noteId = parts[2];
        loadNoteViewer(noteId);
    } else {
        if(APP_CONTENT) APP_CONTENT.innerHTML = '<h2>404 – পেজটি খুঁজে পাওয়া যায়নি</h2><p>আপনার অনুরোধ করা ঠিকানাটি সঠিক নয়।</p>';
    }
    
    window.scrollTo(0, 0);
}

// ----------------------------------------------------
// ৫. ইভেন্ট হ্যান্ডলার এবং ইনিশিয়ালাইজেশন
// ----------------------------------------------------

// ক্লিক ইভেন্ট লিসেনার (SPA নেভিগেশনের জন্য)
document.addEventListener('click', (e) => {
    const target = e.target.closest('a');
    if (target && target.getAttribute('href') && !target.hasAttribute('download')) {
        const href = target.getAttribute('href');
        if (href.startsWith('/') && !href.startsWith('/admin')) { 
            e.preventDefault(); 
            window.history.pushState({}, '', href);
            handleRoute(href);
        }
    }
});

// পপস্টেট ইভেন্ট (ব্যাক/ফরোয়ার্ড বাটন)
window.addEventListener('popstate', () => {
    handleRoute(window.location.pathname);
});

// লোড হওয়ার পর শুরু করুন
window.addEventListener('DOMContentLoaded', () => {
    loadSettings(); // সেটিংস লোড এবং প্রয়োগ করুন
    handleRoute(window.location.pathname); // বর্তমান URL অনুযায়ী কন্টেন্ট লোড করুন
});