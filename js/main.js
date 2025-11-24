// constants
const APP_CONTENT = document.getElementById('app-content');
const CONTENT_GRID = document.getElementById('content-grid');
const SETTINGS_PANEL = document.getElementById('settings-panel');
const OVERLAY = document.getElementById('overlay');
const API_BASE = '/api'; // আপনার API ফোল্ডার পাথ

// ----------------------------------------------------
// ১. ইউটিলিটি ফাংশন
// ----------------------------------------------------

/**
 * API থেকে ডেটা ফেচ করে
 * @param {string} endpoint - API এন্ডপয়েন্ট (যেমন: '/subject.php?action=list')
 * @returns {Promise<Object>}
 */
async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Fetch failed for endpoint:", endpoint, error);
        APP_CONTENT.innerHTML = `<p class="error-message">ডেটা লোড করতে সমস্যা হয়েছে: ${error.message}</p>`;
        return { success: false, data: [] };
    }
}

/**
 * তারিখ থেকে "NEW" ট্যাগ আছে কিনা চেক করে (৩ দিন)
 * @param {string} dateString - আপলোড ডেট স্ট্রিং (YYYY-MM-DD HH:MM:SS)
 * @returns {boolean}
 */
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

function saveSettings(key, value) {
    localStorage.setItem(key, value);
    applySettings();
}

function loadSettings() {
    // থিম
    const savedTheme = localStorage.getItem('theme') || 'light-mode';
    document.body.className = savedTheme;
    themeToggle.checked = savedTheme === 'dark-mode';
    modeText.textContent = savedTheme === 'dark-mode' ? 'ডার্ক মোড' : 'লাইট মোড';

    // গ্রিড স্পেসিং
    const savedSpacing = localStorage.getItem('gridSpacing') || '20';
    document.documentElement.style.setProperty('--grid-spacing', `${savedSpacing}px`);
    gridSpacingSlider.value = savedSpacing;

    // কার্ড সাইজ
    const savedCardSize = localStorage.getItem('cardSize') || 'medium';
    CONTENT_GRID.classList.remove('card-size-small', 'card-size-large');
    if (savedCardSize !== 'medium') {
        CONTENT_GRID.classList.add(`card-size-${savedCardSize}`);
    }
    cardSizeSelect.value = savedCardSize;

    // ফন্ট সাইজ
    const savedFontSize = localStorage.getItem('fontSize') || '16';
    document.documentElement.style.setProperty('--font-size-base', `${savedFontSize}px`);
    fontSizeSlider.value = savedFontSize;
}

function applySettings() {
    // থিম টগল
    const theme = themeToggle.checked ? 'dark-mode' : 'light-mode';
    saveSettings('theme', theme);
    document.body.className = theme;
    modeText.textContent = theme === 'dark-mode' ? 'ডার্ক মোড' : 'লাইট মোড';
    
    // গ্রিড স্পেসিং
    const spacing = gridSpacingSlider.value;
    saveSettings('gridSpacing', spacing);
    document.documentElement.style.setProperty('--grid-spacing', `${spacing}px`);

    // কার্ড সাইজ
    const cardSize = cardSizeSelect.value;
    saveSettings('cardSize', cardSize);
    CONTENT_GRID.classList.remove('card-size-small', 'card-size-large');
    if (cardSize !== 'medium') {
        CONTENT_GRID.classList.add(`card-size-${cardSize}`);
    }

    // ফন্ট সাইজ
    const fontSize = fontSizeSlider.value;
    saveSettings('fontSize', fontSize);
    document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`);
}

// সেটিংস ইভেন্ট লিসেনার
themeToggle.addEventListener('change', applySettings);
gridSpacingSlider.addEventListener('input', applySettings);
cardSizeSelect.addEventListener('change', applySettings);
fontSizeSlider.addEventListener('input', applySettings);

// সেটিংস প্যানেল লজিক
document.getElementById('settings-btn').addEventListener('click', () => {
    SETTINGS_PANEL.classList.add('open');
    OVERLAY.classList.add('active');
});

OVERLAY.addEventListener('click', () => {
    SETTINGS_PANEL.classList.remove('open');
    OVERLAY.classList.remove('active');
});

// ----------------------------------------------------
// ৩. কন্টেন্ট রেন্ডারিং ফাংশন
// ----------------------------------------------------

/**
 * সাবজেক্ট কার্ড রেন্ডার করে
 * @param {Object} subject
 * @returns {string} HTML string
 */
function renderSubjectCard(subject) {
    return `
        <a href="/subject/${subject.name.toLowerCase().replace(/\s+/g, '-')}" class="subject-card" data-subject-id="${subject.id}" data-subject-name="${subject.name}">
            <img src="${subject.icon_url}" alt="${subject.name} icon" class="subject-icon">
            <h3>${subject.name}</h3>
        </a>
    `;
}

/**
 * নোট কার্ড রেন্ডার করে
 * @param {Object} note
 * @returns {string} HTML string
 */
function renderNoteCard(note) {
    const isNewNote = isNew(note.upload_date);
    let previewContent = '';
    let iconClass = '';

    // প্রিভিউ লজিক
    switch (note.file_type) {
        case 'pdf':
            // PDF.js এর জন্য ক্যানভাস পরে জাভাস্ক্রিপ্টে যোগ হবে। আপাতত একটি ডিফল্ট প্রিভিউ
            previewContent = `<div class="text-preview">
                <i class="fas fa-file-pdf fa-2x accent-color"></i><br>
                <small>প্রথম পৃষ্ঠা প্রিভিউ লোড হচ্ছে...</small>
            </div>`;
            iconClass = 'fa-file-pdf';
            break;
        case 'image':
            previewContent = `<img src="${note.file_path}" alt="${note.title} preview">`;
            iconClass = 'fa-image';
            break;
        case 'video':
            // মিউটেড লুপ প্রিভিউ
            previewContent = `<video src="${note.file_path}" muted loop autoplay playsinline></video>`;
            iconClass = 'fa-video';
            break;
        case 'text':
            // প্রথম ৬-৮ লাইন প্রিভিউ (সার্ভার থেকে প্রথম কিছু টেক্সট আসতে হবে)
            // ধরে নিচ্ছি নোট অবজেক্টে `preview_text` নামে একটি ফিল্ড আছে
            const previewText = note.preview_text || 'টেক্সট প্রিভিউ পাওয়া যায়নি।';
            previewContent = `<div class="text-preview">${previewText.split('\n').slice(0, 8).join('<br>')}</div>`;
            iconClass = 'fa-file-alt';
            break;
    }

    return `
        <a href="/note/${note.id}" class="note-card" data-note-id="${note.id}">
            <div class="note-preview">${previewContent}</div>
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
    APP_CONTENT.innerHTML = `
        <h2>📚 বিষয়সমূহ</h2>
        <div id="content-grid" class="subject-grid grid-2-col"></div>
    `;
    const grid = document.getElementById('content-grid');
    
    // সেটিংস থেকে কার্ড সাইজ পুনরায় প্রয়োগ করুন
    const savedCardSize = localStorage.getItem('cardSize') || 'medium';
    grid.classList.remove('card-size-small', 'card-size-large');
    if (savedCardSize !== 'medium') {
        grid.classList.add(`card-size-${savedCardSize}`);
    }

    const { success, data: subjects } = await fetchData('/subject.php?action=list');

    if (success && subjects.length > 0) {
        grid.innerHTML = subjects.map(renderSubjectCard).join('');
    } else {
        grid.innerHTML = '<p class="info-message">কোনো বিষয় পাওয়া যায়নি। অ্যাডমিন প্যানেল থেকে যোগ করুন।</p>';
    }
}

/**
 * সাবজেক্ট পেজ লোড করে (চ্যাপ্টার + নোটস)
 * @param {string} subjectNameSlug
 */
async function loadSubjectPage(subjectNameSlug) {
    // সার্ভার সাইডে নাম থেকে ID বের করতে হবে, অথবা রাউটে ID ব্যবহার করতে হবে।
    // আপাতত, সার্ভারকে স্লগ পাঠানো হলো।
    document.title = `Study Vault – ${subjectNameSlug.replace(/-/g, ' ').toUpperCase()}`;
    
    APP_CONTENT.innerHTML = `
        <a href="/" class="back-link"><i class="fas fa-arrow-left"></i> সকল বিষয়ে ফিরে যান</a>
        <h2 id="subject-title"></h2>
        <div id="content-grid" class="notes-grid grid-2-col"></div>
    `;
    const grid = document.getElementById('content-grid');
    const titleElement = document.getElementById('subject-title');

    // সেটিংস থেকে কার্ড সাইজ পুনরায় প্রয়োগ করুন
    const savedCardSize = localStorage.getItem('cardSize') || 'medium';
    grid.classList.remove('card-size-small', 'card-size-large');
    if (savedCardSize !== 'medium') {
        grid.classList.add(`card-size-${savedCardSize}`);
    }

    titleElement.textContent = subjectNameSlug.replace(/-/g, ' '); // প্রাথমিক নাম

    const { success, data } = await fetchData(`/notes.php?action=subject_notes&slug=${subjectNameSlug}`);

    if (success && data.subject_name) {
        titleElement.textContent = data.subject_name; // সঠিক বাংলা নাম
    }

    if (success && data.notes.length > 0) {
        // এখানে চ্যাপ্টারগুলোকেও নোট কার্ডের মতো রেন্ডার করা যেতে পারে, অথবা আলাদাভাবে
        // আপাতত শুধু নোটস রেন্ডার করা হলো।
        grid.innerHTML = data.notes.map(renderNoteCard).join('');
        // নোট: যদি চ্যাপ্টার আলাদা কার্ড হিসেবে চান, তবে সার্ভার থেকে চ্যাপ্টার ডেটাও আনতে হবে।
    } else {
        grid.innerHTML = '<p class="info-message">এই বিষয়ে কোনো নোটস বা চ্যাপ্টার পাওয়া যায়নি।</p>';
    }
}


/**
 * নোট ভিউয়ার পেজ লোড করে
 * @param {string} noteId
 */
async function loadNoteViewer(noteId) {
    document.title = `Study Vault – নোট ভিউয়ার`;
    APP_CONTENT.innerHTML = '<h2>📖 নোট ভিউয়ার লোড হচ্ছে...</h2>';

    const { success, data: note } = await fetchData(`/notes.php?action=get_note&id=${noteId}`);

    if (success && note) {
        document.title = `Study Vault – ${note.title}`;
        let viewerContent = '';
        
        // ভিউয়ার কন্টেন্ট তৈরি
        switch (note.file_type) {
            case 'pdf':
                // PDF.js ইমপ্লিমেন্টেশন
                viewerContent = `
                    <div id="pdf-viewer-container">
                        <canvas id="pdf-canvas"></canvas>
                        <p>PDF.js এর মাধ্যমে লোড হচ্ছে।</p>
                    </div>
                `;
                // **নোট:** এখানে PDF.js লাইব্রেরি লোড হওয়ার পর ক্যানভাসে PDF রেন্ডারিং লজিক লিখতে হবে। 
                // মোবাইল ব্রাউজারে এটি জটিল হতে পারে।
                break;
            case 'image':
                // ইমেজ ভিউয়ার
                viewerContent = `<div class="image-viewer-container">
                    <img src="${note.file_path}" alt="${note.title}" style="max-width: 100%; height: auto; display: block;">
                </div>`;
                break;
            case 'video':
                // ভিডিও প্লেয়ার
                viewerContent = `<div class="video-player-container">
                    <video src="${note.file_path}" controls style="max-width: 100%; height: auto; display: block;"></video>
                </div>`;
                break;
            case 'text':
                // টেক্সট রিডার মোড
                viewerContent = `<div class="text-reader-container" style="white-space: pre-wrap; padding: 20px; border: 1px solid var(--border-color); background-color: var(--card-background); border-radius: 8px;">
                    <p>${note.full_text_content || "ফাইল কন্টেন্ট লোড করা যায়নি।"}</p>
                </div>`;
                break;
        }

        // ফাইনাল ভিউয়ার পেজ
        APP_CONTENT.innerHTML = `
            <a href="javascript:history.back()" class="back-link"><i class="fas fa-arrow-left"></i> ফিরে যান</a>
            <h2>${note.title}</h2>
            <div class="note-options" style="margin-bottom: 20px;">
                <a href="${note.file_path}" download="${note.title}" class="btn accent-btn"><i class="fas fa-download"></i> ডাউনলোড</a>
                </div>
            ${viewerContent}
        `;

        // **গুরুত্বপূর্ণ:** PDF.js রেন্ডারিং লজিক এখানে যোগ করতে হবে (যদি আপনি PDF.js ব্যবহার করতে চান)।
        // যেহেতু আপনি মোবাইল থেকে কাজ করছেন, এখানে শুধু কাঠামোটাই দিলাম।
        // PDF.js এর জন্য, আপনাকে নিশ্চিত করতে হবে যে `pdf.min.js` লোড হয়েছে।

    } else {
        APP_CONTENT.innerHTML = '<p class="error-message">নোটটি খুঁজে পাওয়া যায়নি বা লোড করা যায়নি।</p>';
    }
}

/**
 * URL পরিবর্তন হলে সঠিক ফাংশন কল করে
 * @param {string} path
 */
function handleRoute(path) {
    // Settings প্যানেল বন্ধ করুন
    SETTINGS_PANEL.classList.remove('open');
    OVERLAY.classList.remove('active');

    if (path === '/' || path === '') {
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
        // 404 পেজ
        APP_CONTENT.innerHTML = '<h2>404 – পেজটি খুঁজে পাওয়া যায়নি</h2><p>আপনার অনুরোধ করা ঠিকানাটি সঠিক নয়।</p>';
    }
    
    // স্ক্রল টপ-এ নিয়ে যান
    window.scrollTo(0, 0);
}


// ক্লিক ইভেন্ট লিসেনার (SPA নেভিগেশনের জন্য)
document.addEventListener('click', (e) => {
    // যদি একটি অ্যাঙ্কর ট্যাগ ক্লিক করা হয় এবং এটি `/` বা `/subject/` দিয়ে শুরু হয়
    const target = e.target.closest('a');
    if (target && target.getAttribute('href') && !target.hasAttribute('download')) {
        const href = target.getAttribute('href');
        if (href.startsWith('/') && !href.startsWith('/admin')) {
            e.preventDefault(); // ডিফল্ট নেভিগেশন বন্ধ করুন
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
    // নোটিশ লোড করুন (অসম্পূর্ণ: API তৈরি হলে যোগ করুন)
    // loadNoticeBar();
});
