// এই ফাইলটি Subject, Chapter, Notes, এবং Notice Manager এর সমস্ত লজিক ধারণ করে।

const API_BASE = '../api';

const tabContent = document.getElementById('tab-content'); 

let allSubjects = []; // সব সাবজেক্ট গ্লোবালি স্টোর করা হবে

// ----------------------------------------------------

// ক. ইউটিলিটি ফাংশন

// ----------------------------------------------------

/**

 * বিষয় তালিকা ফেচ করে এবং গ্লোবাল ভ্যারিয়েবলে স্টোর করে।

 */

async function fetchAllSubjects(includeSelect = false) {

    try {

        const response = await fetch(`${API_BASE}/subject.php?action=list`);

        const data = await response.json();

        

        if (data.success) {

            allSubjects = data.data; 

            

            if (includeSelect) {

                const selectElementChapter = document.getElementById('chapter-subject-select');

                const selectElementNote = document.getElementById('note-subject-select');

                

                // চ্যাপ্টার সিলেক্ট বক্স আপডেট

                if (selectElementChapter) {

                    selectElementChapter.innerHTML = '<option value="">-- একটি বিষয় নির্বাচন করুন --</option>';

                    data.data.forEach(subject => {

                        const option = document.createElement('option');

                        option.value = subject.id;

                        option.textContent = subject.name;

                        selectElementChapter.appendChild(option);

                    });

                }

                

                // নোটস সিলেক্ট বক্স আপডেট

                if (selectElementNote) {

                    selectElementNote.innerHTML = '<option value="">-- একটি বিষয় নির্বাচন করুন --</option>';

                    data.data.forEach(subject => {

                        const option = document.createElement('option');

                        option.value = subject.id;

                        option.textContent = subject.name;

                        selectElementNote.appendChild(option);

                    });

                }

            }

            return true;

        } else {

            console.error("Failed to load subjects:", data.message);

            return false;

        }

    } catch (error) {

        console.error("Network error while fetching subjects:", error);

        return false;

    }

}

/**

 * ফর্মে মেসেজ দেখানোর জন্য ফাংশন

 */

function displayFormMessage(element, message, type) {

    element.className = type;

    element.textContent = message;

}

// ----------------------------------------------------

// খ. বিষয় (SUBJECT) ম্যানেজারের লজিক

// ----------------------------------------------------

/**

 * বিষয় তালিকা ফেচ করে এবং টেবিল রেন্ডার করে।

 */

async function fetchSubjectList() {

    const container = document.getElementById('subject-list-container');

    if (!container) return;

    

    container.innerHTML = '<p>বিষয় তালিকা লোড হচ্ছে...</p>';

    if (!(await fetchAllSubjects())) {

        container.innerHTML = '<p class="error-message">বিষয় তালিকা লোড করতে ব্যর্থ হয়েছে।</p>';

        return;

    }

    if (allSubjects.length > 0) {

        let tableHTML = `

            <table class="data-table">

                <thead>

                    <tr>

                        <th>ID</th>

                        <th>আইকন</th>

                        <th>নাম</th>

                        <th>বিবরণ</th>

                        <th>অ্যাকশন</th>

                    </tr>

                </thead>

                <tbody>

        `;

        allSubjects.forEach(subject => {

            tableHTML += `

                <tr>

                    <td data-label="ID">${subject.id}</td>

                    <td data-label="আইকন"><img src="${subject.icon_url}" alt="Icon" style="width: 30px; height: 30px;"></td>

                    <td data-label="নাম">${subject.name}</td>

                    <td data-label="বিবরণ">${subject.description ? subject.description.substring(0, 50) + '...' : 'নেই'}</td>

                    <td data-label="অ্যাকশন">

                        <button class="action-btn edit-btn" data-id="${subject.id}"><i class="fas fa-edit"></i></button>

                        <button class="action-btn delete-btn" data-id="${subject.id}"><i class="fas fa-trash"></i></button>

                    </td>

                </tr>

            `;

        });

        tableHTML += `</tbody></table>`;

        container.innerHTML = tableHTML;

        

        document.querySelectorAll('#subject-list-container .delete-btn').forEach(btn => {

            btn.addEventListener('click', () => deleteSubject(btn.dataset.id));

        });

    } else {

        container.innerHTML = '<p class="info-message">এখনও কোনো বিষয় যোগ করা হয়নি।</p>';

    }

}

/**

 * নতুন বিষয় যোগ করার ফর্ম হ্যান্ডেল করে।

 */

function setupSubjectForm() {

    const form = document.getElementById('add-subject-form');

    const message = document.getElementById('subject-form-message');

    if (!form) return;

    form.addEventListener('submit', async (e) => {

        e.preventDefault();

        message.textContent = '...যোগ করা হচ্ছে...';

        

        const name = document.getElementById('subject-name').value;

        const iconUrl = document.getElementById('subject-icon').value;

        const description = document.getElementById('subject-description').value;

        try {

            const response = await fetch(`${API_BASE}/subject.php?action=add`, {

                method: 'POST',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({ name, icon_url: iconUrl, description })

            });

            const data = await response.json();

            if (data.success) {

                displayFormMessage(message, '✅ বিষয় সফলভাবে যুক্ত হয়েছে!', 'success');

                form.reset();

                fetchSubjectList(); 

            } else {

                displayFormMessage(message, `❌ ব্যর্থ হয়েছে: ${data.message}`, 'error');

            }

        } catch (error) {

            displayFormMessage(message, `নেটওয়ার্ক ত্রুটি: ${error.message}`, 'error');

        }

    });

}

/**

 * বিষয় মুছে ফেলার ফাংশন।

 */

async function deleteSubject(id) {

    if (!confirm("আপনি কি নিশ্চিত এই বিষয় এবং এর সাথে সম্পর্কিত নোটস ও চ্যাপ্টার মুছে ফেলতে চান?")) {

        return;

    }

    try {

        const response = await fetch(`${API_BASE}/subject.php?action=delete&id=${id}`, {

            method: 'DELETE'

        });

        const data = await response.json();

        if (data.success) {

            alert("বিষয় সফলভাবে মুছে ফেলা হয়েছে!");

            fetchSubjectList(); 

        } else {

            alert(`মুছে ফেলার ব্যর্থ: ${data.message}`);

        }

    } catch (error) {

        alert("নেটওয়ার্ক ত্রুটি বা সার্ভার এরর।");

    }

}

// ----------------------------------------------------

// গ. চ্যাপ্টার (CHAPTER) ম্যানেজারের লজিক

// ----------------------------------------------------

/**

 * চ্যাপ্টার ম্যানেজারের কন্টেন্ট রেন্ডার করে।

 */

function loadChapterManager() {

    tabContent.innerHTML = `

        <h2><i class="fas fa-layer-group"></i> চ্যাপ্টার ম্যানেজার</h2>

        <p>বিষয় নির্বাচন করুন এবং এর অধীনে নতুন চ্যাপ্টার যোগ করুন।</p>

        

        <div class="manager-form-container">

            <h3>চ্যাপ্টার যোগ করুন</h3>

            <form id="add-chapter-form">

                <div class="form-group">

                    <label for="chapter-subject-select">বিষয় নির্বাচন করুন:</label>

                    <select id="chapter-subject-select" name="subject_id" required></select>

                </div>

                <div class="form-group">

                    <label for="chapter-name">চ্যাপ্টার নাম:</label>

                    <input type="text" id="chapter-name" name="name" required>

                </div>

                <button type="submit" class="submit-btn"><i class="fas fa-plus"></i> চ্যাপ্টার যুক্ত করুন</button>

                <div id="chapter-form-message" style="margin-top: 10px;"></div>

            </form>

        </div>

        

        <h3>বিষয় অনুযায়ী চ্যাপ্টার তালিকা</h3>

        <div id="chapter-list-container">

            <p class="info-message">চ্যাপ্টার তালিকা দেখতে প্রথমে একটি বিষয় নির্বাচন করুন।</p>

        </div>

    `;

    

    fetchAllSubjects(true).then(() => {

        const select = document.getElementById('chapter-subject-select');

        if (select) {

            select.addEventListener('change', (e) => {

                const subjectId = parseInt(e.target.value);

                if (subjectId > 0) {

                    fetchChapterList(subjectId);

                } else {

                    document.getElementById('chapter-list-container').innerHTML = '<p class="info-message">চ্যাপ্টার তালিকা দেখতে প্রথমে একটি বিষয় নির্বাচন করুন।</p>';

                }

            });

        }

    });

    setupChapterForm();

}

/**

 * নির্বাচিত বিষয়ের চ্যাপ্টার তালিকা ফেচ করে টেবিল রেন্ডার করে।

 */

async function fetchChapterList(subjectId) {

    const container = document.getElementById('chapter-list-container');

    if (!container) return;

    container.innerHTML = '<p>চ্যাপ্টার তালিকা লোড হচ্ছে...</p>';

    

    try {

        const response = await fetch(`${API_BASE}/notes.php?action=chapters_by_subject&subject_id=${subjectId}`);

        const data = await response.json();

        if (data.success && data.data.length > 0) {

            let tableHTML = `

                <table class="data-table">

                    <thead>

                        <tr>

                            <th>ID</th>

                            <th>চ্যাপ্টার নাম</th>

                            <th>অ্যাকশন</th>

                        </tr>

                    </thead>

                    <tbody>

            `;

            data.data.forEach(chapter => {

                tableHTML += `

                    <tr>

                        <td data-label="ID">${chapter.id}</td>

                        <td data-label="চ্যাপ্টার নাম">${chapter.name}</td>

                        <td data-label="অ্যাকশন">

                            <button class="action-btn delete-btn" data-id="${chapter.id}" data-subject-id="${subjectId}"><i class="fas fa-trash"></i> মুছুন</button>

                        </td>

                    </tr>

                `;

            });

            tableHTML += `</tbody></table>`;

            container.innerHTML = tableHTML;

            

            document.querySelectorAll('#chapter-list-container .delete-btn').forEach(btn => {

                btn.addEventListener('click', () => deleteChapter(btn.dataset.id, btn.dataset.subjectId));

            });

        } else if (data.success && data.data.length === 0) {

            container.innerHTML = '<p class="info-message">এই বিষয়ে কোনো চ্যাপ্টার যোগ করা হয়নি।</p>';

        } else {

            container.innerHTML = `<p class="error-message">চ্যাপ্টার তালিকা লোড করতে ব্যর্থ: ${data.message}</p>`;

        }

    } catch (error) {

        container.innerHTML = `<p class="error-message">নেটওয়ার্ক এরর: ${error.message}</p>`;

    }

}

/**

 * নতুন চ্যাপ্টার যোগ করার ফর্ম হ্যান্ডেল করে।

 */

function setupChapterForm() {

    const form = document.getElementById('add-chapter-form');

    const message = document.getElementById('chapter-form-message');

    if (!form) return;

    form.addEventListener('submit', async (e) => {

        e.preventDefault();

        message.textContent = '...যোগ করা হচ্ছে...';

        

        const subjectId = document.getElementById('chapter-subject-select').value;

        const name = document.getElementById('chapter-name').value;

        if (!subjectId) {

            displayFormMessage(message, '❌ একটি বিষয় নির্বাচন করুন।', 'error');

            return;

        }

        try {

            const response = await fetch(`${API_BASE}/notes.php?action=add_chapter`, {

                method: 'POST',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({ subject_id: parseInt(subjectId), name })

            });

            const data = await response.json();

            if (data.success) {

                displayFormMessage(message, '✅ চ্যাপ্টার সফলভাবে যুক্ত হয়েছে!', 'success');

                document.getElementById('chapter-name').value = '';

                fetchChapterList(parseInt(subjectId)); 

            } else {

                displayFormMessage(message, `❌ ব্যর্থ হয়েছে: ${data.message}`, 'error');

            }

        } catch (error) {

            displayFormMessage(message, `নেটওয়ার্ক ত্রুটি: ${error.message}`, 'error');

        }

    });

}

/**

 * চ্যাপ্টার মুছে ফেলার ফাংশন।

 */

async function deleteChapter(chapterId, subjectId) {

    if (!confirm("আপনি কি নিশ্চিত এই চ্যাপ্টার এবং এর অধীনে থাকা নোটস মুছে ফেলতে চান?")) {

        return;

    }

    try {

        const response = await fetch(`${API_BASE}/notes.php?action=delete_chapter&id=${chapterId}`, {

            method: 'DELETE'

        });

        const data = await response.json();

        if (data.success) {

            alert("চ্যাপ্টার সফলভাবে মুছে ফেলা হয়েছে!");

            fetchChapterList(parseInt(subjectId)); 

        } else {

            alert(`মুছে ফেলার ব্যর্থ: ${data.message}`);

        }

    } catch (error) {

        alert("নেটওয়ার্ক ত্রুটি বা সার্ভার এরর।");

    }

}

// ----------------------------------------------------

// ঘ. নোটস (NOTES) ম্যানেজারের লজিক

// ----------------------------------------------------

/**

 * নোটস ম্যানেজারের কন্টেন্ট রেন্ডার করে।

 */

function loadNotesManager() {

    tabContent.innerHTML = `

        <h2><i class="fas fa-sticky-note"></i> নোটস ম্যানেজার</h2>

        <p>নতুন নোট আপলোড করুন (PDF, ছবি, ভিডিও, টেক্সট)।</p>

        

        <div class="manager-form-container">

            <h3>নতুন নোট আপলোড করুন</h3>

            <form id="add-note-form">

                <div class="form-group">

                    <label for="note-title">নোট শিরোনাম:</label>

                    <input type="text" id="note-title" name="title" required>

                </div>

                <div class="form-group">

                    <label for="note-subject-select">বিষয় নির্বাচন করুন:</label>

                    <select id="note-subject-select" name="subject_id" required></select>

                </div>

                <div class="form-group">

                    <label for="note-chapter-select">চ্যাপ্টার নির্বাচন করুন (ঐচ্ছিক):</label>

                    <select id="note-chapter-select" name="chapter_id">

                        <option value="">-- চ্যাপ্টার নেই --</option>

                    </select>

                </div>

                <div class="form-group">

                    <label for="note-file">ফাইল আপলোড (PDF, JPG, MP4, TXT):</label>

                    <input type="file" id="note-file" name="note_file" required>

                </div>

                <button type="submit" class="submit-btn"><i class="fas fa-upload"></i> নোট আপলোড করুন</button>

                <div id="note-form-message" style="margin-top: 10px;"></div>

            </form>

        </div>

        

        <h3>বিদ্যমান নোটস</h3>

        <div id="note-list-container">

            <p class="info-message">নোটস তালিকা লোড হচ্ছে...</p>

        </div>

    `;

    

    // বিষয় লোড এবং চ্যাপ্টার লোড সেটআপ

    fetchAllSubjects(true).then(() => {

        const subjectSelect = document.getElementById('note-subject-select');

        if (subjectSelect) {

            subjectSelect.addEventListener('change', (e) => {

                const subjectId = parseInt(e.target.value);

                if (subjectId > 0) {

                    fetchChaptersForNotes(subjectId);

                } else {

                    document.getElementById('note-chapter-select').innerHTML = '<option value="">-- চ্যাপ্টার নেই --</option>';

                }

            });

        }

    });

    setupNoteForm();

}

/**

 * নির্বাচিত বিষয়ের চ্যাপ্টার ফেচ করে নোটস ফর্মে লোড করে।

 */

async function fetchChaptersForNotes(subjectId) {

    const selectElement = document.getElementById('note-chapter-select');

    if (!selectElement) return;

    selectElement.innerHTML = '<option value="">-- লোড হচ্ছে --</option>';

    try {

        const response = await fetch(`${API_BASE}/notes.php?action=chapters_by_subject&subject_id=${subjectId}`);

        const data = await response.json();

        if (data.success) {

            selectElement.innerHTML = '<option value="">-- চ্যাপ্টার নেই --</option>';

            data.data.forEach(chapter => {

                const option = document.createElement('option');

                option.value = chapter.id;

                option.textContent = chapter.name;

                selectElement.appendChild(option);

            });

        } else {

            selectElement.innerHTML = '<option value="">-- লোড ব্যর্থ --</option>';

            console.error("Failed to load chapters for notes:", data.message);

        }

    } catch (error) {

        selectElement.innerHTML = '<option value="">-- নেটওয়ার্ক এরর --</option>';

        console.error("Network error while fetching chapters:", error);

    }

}

/**

 * নতুন নোট আপলোড করার ফর্ম হ্যান্ডেল করে (Form Data ব্যবহার করে)।

 */

function setupNoteForm() {

    const form = document.getElementById('add-note-form');

    const message = document.getElementById('note-form-message');

    if (!form) return;

    form.addEventListener('submit', async (e) => {

        e.preventDefault();

        message.textContent = '...ফাইল আপলোড হচ্ছে...';

        

        const formData = new FormData(form);

        try {

            const response = await fetch(`${API_BASE}/notes.php?action=add_note`, {

                method: 'POST',

                body: formData 

            });

            const data = await response.json();

            if (data.success) {

                displayFormMessage(message, `✅ নোট সফলভাবে আপলোড হয়েছে!`, 'success');

                form.reset();

            } else {

                displayFormMessage(message, `❌ আপলোড ব্যর্থ: ${data.message}`, 'error');

            }

        } catch (error) {

            displayFormMessage(message, `নেটওয়ার্ক ত্রুটি বা সার্ভার সংযোগ ব্যর্থ: ${error.message}`, 'error');

        }

    });

}

// ----------------------------------------------------

// ঙ. নোটিশ (NOTICE) ম্যানেজারের লজিক

// ----------------------------------------------------

/**

 * নোটিশ ম্যানেজারের কন্টেন্ট রেন্ডার করে।

 */

function loadNoticeManager() {

    tabContent.innerHTML = `

        <h2><i class="fas fa-bullhorn"></i> নোটিশ ম্যানেজার</h2>

        <p>ওয়েবসাইটের শীর্ষে দেখানোর জন্য নোটিশ তৈরি, সম্পাদনা বা নিষ্ক্রিয় করুন।</p>

        <div class="manager-form-container">

            <h3>নতুন নোটিশ পোস্ট করুন</h3>

            <form id="add-notice-form">

                <div class="form-group">

                    <label for="notice-content">নোটিশের বিষয়বস্তু:</label>

                    <textarea id="notice-content" name="content" required></textarea>

                </div>

                <div class="form-group">

                    <label for="notice-active">সক্রিয় (ওয়েবসাইটে দেখাবে):</label>

                    <input type="checkbox" id="notice-active" name="is_active" checked>

                </div>

                <button type="submit" class="submit-btn"><i class="fas fa-paper-plane"></i> নোটিশ পোস্ট করুন</button>

                <div id="notice-form-message" style="margin-top: 10px;"></div>

            </form>

        </div>

        <h3>বিদ্যমান নোটিশসমূহ</h3>

        <div id="notice-list-container">

            <p class="info-message">নোটিশ তালিকা লোড হচ্ছে...</p>

        </div>

    `;

    setupNoticeForm();

    fetchNoticeList();

}

/**

 * নতুন নোটিশ পোস্ট করার ফর্ম হ্যান্ডেল করে।

 */

function setupNoticeForm() {

    const form = document.getElementById('add-notice-form');

    const message = document.getElementById('notice-form-message');

    

    if (!form) return;

    form.addEventListener('submit', async (e) => {

        e.preventDefault();

        message.textContent = '...পোস্ট করা হচ্ছে...';

        

        const content = document.getElementById('notice-content').value;

        const isActive = document.getElementById('notice-active').checked;

        try {

            const response = await fetch(`${API_BASE}/notice.php?action=add_notice`, {

                method: 'POST',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({ content, is_active: isActive ? 1 : 0 })

            });

            const data = await response.json();

            if (data.success) {

                displayFormMessage(message, '✅ নোটিশ সফলভাবে পোস্ট হয়েছে!', 'success');

                form.reset();

                fetchNoticeList(); 

            } else {

                displayFormMessage(message, `❌ পোস্ট ব্যর্থ: ${data.message}`, 'error');

            }

        } catch (error) {

            displayFormMessage(message, `নেটওয়ার্ক ত্রুটি: ${error.message}`, 'error');

        }

    });

}

/**

 * বিদ্যমান নোটিশ তালিকা ফেচ করে টেবিল রেন্ডার করে।

 */

async function fetchNoticeList() {

    const container = document.getElementById('notice-list-container');

    if (!container) return;

    container.innerHTML = '<p>নোটিশ তালিকা লোড হচ্ছে...</p>';

    

    try {

        const response = await fetch(`${API_BASE}/notice.php?action=list_notices`);

        const data = await response.json();

        if (data.success && data.data.length > 0) {

            let tableHTML = `

                <table class="data-table">

                    <thead>

                        <tr>

                            <th>ID</th>

                            <th>বিষয়বস্তু</th>

                            <th>সক্রিয়</th>

                            <th>পোস্ট তারিখ</th>

                            <th>অ্যাকশন</th>

                        </tr>

                    </thead>

                    <tbody>

            `;

            data.data.forEach(notice => {

                const isActiveText = notice.is_active == 1 ? '✅ হ্যাঁ' : '❌ না';

                tableHTML += `

                    <tr>

                        <td data-label="ID">${notice.id}</td>

                        <td data-label="বিষয়বস্তু">${notice.content.substring(0, 80)}...</td>

                        <td data-label="সক্রিয়">${isActiveText}</td>

                        <td data-label="পোস্ট তারিখ">${new Date(notice.created_at).toLocaleDateString('bn-BD')}</td>

                        <td data-label="অ্যাকশন">

                            <button class="action-btn delete-btn" data-id="${notice.id}"><i class="fas fa-trash"></i> মুছুন</button>

                        </td>

                    </tr>

                `;

            });

            tableHTML += `</tbody></table>`;

            container.innerHTML = tableHTML;

            

            document.querySelectorAll('#notice-list-container .delete-btn').forEach(btn => {

                btn.addEventListener('click', () => deleteNotice(btn.dataset.id));

            });

        } else if (data.success && data.data.length === 0) {

            container.innerHTML = '<p class="info-message">এখনও কোনো নোটিশ পোস্ট করা হয়নি।</p>';

        } else {

            container.innerHTML = `<p class="error-message">নোটিশ তালিকা লোড করতে ব্যর্থ: ${data.message}</p>`;

        }

    } catch (error) {

        container.innerHTML = `<p class="error-message">নেটওয়ার্ক এরর: ${error.message}</p>`;

    }

}

/**

 * নোটিশ মুছে ফেলার ফাংশন।

 */

async function deleteNotice(id) {

    if (!confirm("আপনি কি নিশ্চিত এই নোটিশটি মুছে ফেলতে চান?")) {

        return;

    }

    try {

        const response = await fetch(`${API_BASE}/notice.php?action=delete_notice&id=${id}`, {

            method: 'DELETE'

        });

        const data = await response.json();

        if (data.success) {

            alert("নোটিশ সফলভাবে মুছে ফেলা হয়েছে!");

            fetchNoticeList(); 

        } else {

            alert(`মুছে ফেলার ব্যর্থ: ${data.message}`);

        }

    } catch (error) {

        alert("নেটওয়ার্ক ত্রুটি বা সার্ভার এরর।");

    }

}

// ----------------------------------------------------

// চ. অন্যান্য ডামি ফাংশন (অবশ্যই সংজ্ঞায়িত করতে হবে)

// ----------------------------------------------------

/**

 * সিস্টেম সেটিংস ম্যানেজারের কন্টেন্ট রেন্ডার করে।

 */

function loadSystemSettings() { tabContent.innerHTML = '<h2><i class="fas fa-cogs"></i> সিস্টেম সেটিংস</h2><p>এই অংশটি পরবর্তীতে তৈরি করা হবে।</p>'; }

/**

 * ডিফল্ট কন্টেন্ট লোডার (এরর হ্যান্ডলিং এর জন্য)।

 */

function loadDefaultContent(tab) {

    tabContent.innerHTML = `<p class="error-message">Error: ${tab} Manager code is loading or missing. Please ensure admin_logic.js is correctly linked and uploaded.</p>`;

}