const STORAGE_KEY = 'studentdesk_records_v1';
let students = loadStudents();
const $ = (id) => document.getElementById(id);

function loadStudents() {
  try { const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(data) ? data : []; }
  catch { return []; }
}
function saveStudents() { localStorage.setItem(STORAGE_KEY, JSON.stringify(students)); }
function esc(value='') {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function toast(message) {
  const el = $('toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
}
function dateToday() { return new Date().toISOString().slice(0,10); }
function showView(view) {
  $('dashboardView').hidden = view !== 'dashboard';
  $('studentsView').hidden = view !== 'students';
  $('reportsView').hidden = view !== 'reports';
  $('pageTitle').textContent = view === 'dashboard' ? 'Dashboard' : view === 'students' ? 'Students' : 'Reports & Export';
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  $(view === 'dashboard' ? 'navDashboard' : view === 'students' ? 'navStudents' : 'navReports').classList.add('active');
  render();
}
function statusPill(status) { return `<span class="pill ${status === 'Inactive' ? 'inactive' : ''}">${esc(status || 'Active')}</span>`; }
function render() {
  $('totalStudents').textContent = students.length;
  $('activeStudents').textContent = students.filter(s => s.status === 'Active').length;
  $('totalClasses').textContent = new Set(students.map(s => s.className.trim()).filter(Boolean)).size;
  $('recentEmpty').hidden = students.length > 0;
  $('recentRows').innerHTML = students.slice().reverse().slice(0,5).map(s => `<tr><td>${esc(s.rollNo)}</td><td class="name-cell">${esc(s.fullName)}</td><td>${esc(s.className)}</td><td>${esc(s.mobile || '—')}</td><td>${statusPill(s.status)}</td></tr>`).join('');
  const q = ($('searchInput').value || '').trim().toLowerCase();
  const filtered = students.filter(s => [s.fullName,s.rollNo,s.mobile,s.className].some(v => String(v || '').toLowerCase().includes(q)));
  $('studentCountLabel').textContent = `${filtered.length} records`;
  $('studentsEmpty').hidden = filtered.length > 0;
  $('studentRows').innerHTML = filtered.map(s => `<tr><td>${esc(s.rollNo)}</td><td class="name-cell">${esc(s.fullName)}</td><td>${esc(s.className)}</td><td>${esc(s.mobile || '—')}</td><td>${esc(s.admissionDate || '—')}</td><td>${statusPill(s.status)}</td><td><div class="row-actions"><button class="mini-btn" data-edit="${esc(s.id)}">Edit</button><button class="mini-btn delete" data-delete="${esc(s.id)}">Delete</button></div></td></tr>`).join('');
}
function openModal(student=null) {
  $('studentForm').reset(); $('formError').textContent = '';
  $('editId').value = student ? student.id : '';
  $('modalTitle').textContent = student ? 'Edit Student' : 'Add Student';
  $('fullName').value = student?.fullName || '';
  $('rollNo').value = student?.rollNo || '';
  $('className').value = student?.className || '';
  $('mobile').value = student?.mobile || '';
  $('admissionDate').value = student?.admissionDate || dateToday();
  $('status').value = student?.status || 'Active';
  $('address').value = student?.address || '';
  $('modalBackdrop').hidden = false; $('fullName').focus();
}
function closeModal() { $('modalBackdrop').hidden = true; }
function exportCsv() {
  if (!students.length) { toast('Export करने के लिए कोई रिकॉर्ड नहीं है।'); return; }
  const headers = ['Roll Number','Full Name','Class/Course','Mobile','Admission Date','Status','Address'];
  const rows = students.map(s => [s.rollNo,s.fullName,s.className,s.mobile,s.admissionDate,s.status,s.address]);
  const csv = [headers,...rows].map(row => row.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='student-records.csv'; a.click(); URL.revokeObjectURL(url);
  toast('CSV रिपोर्ट डाउनलोड हो गई।');
}
function downloadJson() {
  const blob = new Blob([JSON.stringify(students,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='student-backup.json'; a.click(); URL.revokeObjectURL(url);
  toast('JSON बैकअप डाउनलोड हो गया।');
}
$('navDashboard').addEventListener('click', () => showView('dashboard'));
$('navStudents').addEventListener('click', () => showView('students'));
$('navReports').addEventListener('click', () => showView('reports'));
['addTop','firstAdd'].forEach(id => $(id).addEventListener('click', () => openModal()));
$('viewAll').addEventListener('click', () => showView('students'));
$('closeModal').addEventListener('click', closeModal);
$('cancelModal').addEventListener('click', closeModal);
$('modalBackdrop').addEventListener('click', e => { if (e.target === $('modalBackdrop')) closeModal(); });
$('searchInput').addEventListener('input', render);
['exportCsv','reportCsv'].forEach(id => $(id).addEventListener('click', exportCsv));
$('backupJson').addEventListener('click', downloadJson);
$('printReport').addEventListener('click', () => { showView('students'); window.print(); });
$('studentRows').addEventListener('click', e => {
  const editBtn = e.target.closest('[data-edit]'); const deleteBtn = e.target.closest('[data-delete]');
  if (editBtn) { const s=students.find(x=>x.id===editBtn.dataset.edit); if(s) openModal(s); }
  if (deleteBtn) {
    const s=students.find(x=>x.id===deleteBtn.dataset.delete); if(!s) return;
    if (confirm(`क्या आप ${s.fullName} का रिकॉर्ड हटाना चाहते हैं?`)) {
      students=students.filter(x=>x.id!==s.id); saveStudents(); render(); toast('विद्यार्थी रिकॉर्ड हटा दिया गया।');
    }
  }
});
$('studentForm').addEventListener('submit', e => {
  e.preventDefault(); $('formError').textContent = '';
  const id = $('editId').value;
  const student = {
    id: id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    fullName: $('fullName').value.trim(),
    rollNo: $('rollNo').value.trim(),
    className: $('className').value.trim(),
    mobile: $('mobile').value.trim(),
    admissionDate: $('admissionDate').value,
    status: $('status').value,
    address: $('address').value.trim()
  };
  if (!student.fullName || !student.rollNo || !student.className) { $('formError').textContent='नाम, रोल नंबर और कक्षा भरना जरूरी है।'; return; }
  const duplicate = students.find(s => s.rollNo.toLowerCase() === student.rollNo.toLowerCase() && s.id !== id);
  if (duplicate) { $('formError').textContent='यह रोल नंबर पहले से मौजूद है।'; return; }
  if (id) students = students.map(s => s.id === id ? student : s); else students.push(student);
  saveStudents(); closeModal(); render(); toast(id ? 'रिकॉर्ड अपडेट हो गया।' : 'नया विद्यार्थी जोड़ दिया गया।');
});
render();