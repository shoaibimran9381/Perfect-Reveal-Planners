import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

const loginScreen = document.getElementById('loginScreen');
const adminScreen = document.getElementById('adminScreen');
const logoutButton = document.getElementById('logoutButton');
const loginForm = document.getElementById('loginForm');
const manualForm = document.getElementById('manualReviewForm');
let auth;
let db;
let pendingReviews = [];
let publishedReviews = [];

function escapeHtml(value) {
  const element = document.createElement('div');
  element.textContent = String(value || '');
  return element.innerHTML;
}

function timestampValue(review) {
  if (review.publishedAt && typeof review.publishedAt.toMillis === 'function') return review.publishedAt.toMillis();
  if (review.createdAt && typeof review.createdAt.toMillis === 'function') return review.createdAt.toMillis();
  return new Date(review.date || 0).getTime();
}

function showMessage(text, type = 'success') {
  const element = document.getElementById('message');
  element.textContent = text;
  element.className = `message ${type}`;
  element.style.display = 'block';
  window.setTimeout(() => { element.style.display = 'none'; }, 4500);
}

function showLoginMessage(text) {
  const element = document.getElementById('loginMessage');
  element.textContent = text;
  element.style.display = 'block';
}

function setSignedInDisplay(signedIn) {
  loginScreen.style.display = signedIn ? 'none' : 'flex';
  adminScreen.style.display = signedIn ? 'block' : 'none';
  logoutButton.style.display = signedIn ? 'block' : 'none';
}

function renderStats() {
  document.getElementById('stats').innerHTML = `
    <div class="stat-box"><div class="stat-number">${pendingReviews.length}</div><div class="stat-label">Pending</div></div>
    <div class="stat-box"><div class="stat-number">${publishedReviews.length}</div><div class="stat-label">Published</div></div>
    <div class="stat-box"><div class="stat-number">${pendingReviews.length + publishedReviews.length}</div><div class="stat-label">Visible + Pending</div></div>
  `;
}

function renderPendingReviews() {
  const container = document.getElementById('pendingReviews');
  if (!pendingReviews.length) {
    container.innerHTML = '<div class="empty-message">No pending reviews.</div>';
    return;
  }
  container.innerHTML = pendingReviews.map(review => `
    <article class="review-card">
      <div class="review-name">${escapeHtml(review.name)}</div>
      <div class="review-meta">${escapeHtml(review.email)} | ${escapeHtml(review.role)}</div>
      <div class="review-rating">${'★'.repeat(Number(review.rating))}</div>
      <div class="review-text">"${escapeHtml(review.text)}"</div>
      ${review.ownerResponse ? `<div class="response"><strong>Your response:</strong>${escapeHtml(review.ownerResponse)}</div>` : ''}
      <div class="review-actions">
        <button class="action-btn btn-approve" onclick="approveReview('${review.id}')">Approve &amp; Publish</button>
        <button class="action-btn btn-reject" onclick="rejectReview('${review.id}')">Reject</button>
        <button class="action-btn" onclick="editPendingReview('${review.id}')">Edit Text</button>
        <button class="action-btn" onclick="addOwnerResponse('${review.id}')">Owner Response</button>
      </div>
    </article>
  `).join('');
}

function renderPublishedReviews() {
  const container = document.getElementById('approvedReviews');
  if (!publishedReviews.length) {
    container.innerHTML = '<div class="empty-message">No published reviews yet.</div>';
    return;
  }
  container.innerHTML = publishedReviews.map(review => `
    <article class="review-card">
      <div class="review-name">${escapeHtml(review.name)}</div>
      <div class="review-meta">${escapeHtml(review.role)}</div>
      <div class="review-rating">${'★'.repeat(Number(review.rating))}</div>
      <div class="review-text">"${escapeHtml(review.text)}"</div>
      <div class="response"><strong>Perfect Reveal Planners responded:</strong>${escapeHtml(review.ownerResponse || 'Thank you for your feedback!')}</div>
      <div class="review-actions">
        <button class="action-btn btn-delete" onclick="deletePublishedReview('${review.id}')">Delete</button>
      </div>
    </article>
  `).join('');
}

async function loadDashboard() {
  const pendingSnapshot = await getDocs(query(collection(db, 'reviewSubmissions'), where('status', '==', 'pending')));
  const publishedSnapshot = await getDocs(collection(db, 'publishedReviews'));
  pendingReviews = pendingSnapshot.docs.map(snapshot => ({ id: snapshot.id, ...snapshot.data() }))
    .sort((first, second) => timestampValue(second) - timestampValue(first));
  publishedReviews = publishedSnapshot.docs.map(snapshot => ({ id: snapshot.id, ...snapshot.data() }))
    .sort((first, second) => timestampValue(second) - timestampValue(first));
  renderStats();
  renderPendingReviews();
  renderPublishedReviews();
}

async function verifyAdminAndLoad() {
  try {
    await loadDashboard();
    setSignedInDisplay(true);
  } catch (error) {
    await signOut(auth);
    setSignedInDisplay(false);
    showLoginMessage('This account is not authorised for dashboard access.');
  }
}

async function authenticate(event) {
  event.preventDefault();
  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById('emailInput').value.trim(),
      document.getElementById('passwordInput').value
    );
  } catch (error) {
    showLoginMessage('Unable to sign in. Check your administrator email and password.');
  } finally {
    button.disabled = false;
  }
}

async function logout() {
  await signOut(auth);
}

function showTab(tabName, button) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(tabButton => tabButton.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');
  button.classList.add('active');
}

async function approveReview(id) {
  const review = pendingReviews.find(item => item.id === id);
  if (!review) return;
  const batch = writeBatch(db);
  batch.set(doc(db, 'publishedReviews', id), {
    name: review.name,
    role: review.role,
    rating: review.rating,
    text: review.text,
    ownerResponse: review.ownerResponse || 'Thank you for your feedback!',
    createdAt: review.createdAt,
    publishedAt: serverTimestamp()
  });
  batch.update(doc(db, 'reviewSubmissions', id), { status: 'approved', reviewedAt: serverTimestamp() });
  await batch.commit();
  showMessage('Review approved and published.');
  await loadDashboard();
}

async function rejectReview(id) {
  if (!window.confirm('Reject this review?')) return;
  await updateDoc(doc(db, 'reviewSubmissions', id), { status: 'rejected', reviewedAt: serverTimestamp() });
  showMessage('Review rejected.');
  await loadDashboard();
}

async function editPendingReview(id) {
  const review = pendingReviews.find(item => item.id === id);
  if (!review) return;
  const editedText = window.prompt('Edit review text before publishing:', review.text);
  if (!editedText || !editedText.trim()) return;
  await updateDoc(doc(db, 'reviewSubmissions', id), { text: editedText.trim() });
  showMessage('Review text updated.');
  await loadDashboard();
}

async function addOwnerResponse(id) {
  const review = pendingReviews.find(item => item.id === id);
  if (!review) return;
  const response = window.prompt(
    'Write your response. This will appear publicly after you approve the review:',
    review.ownerResponse || ''
  );
  if (response === null) return;
  if (!response.trim()) {
    showMessage('Owner response cannot be empty.', 'error');
    return;
  }
  await updateDoc(doc(db, 'reviewSubmissions', id), { ownerResponse: response.trim() });
  showMessage('Owner response saved. Approve and publish when ready.');
  await loadDashboard();
}

async function deletePublishedReview(id) {
  if (!window.confirm('Delete this published review?')) return;
  await deleteDoc(doc(db, 'publishedReviews', id));
  showMessage('Published review removed.');
  await loadDashboard();
}

async function addManualReview(event) {
  event.preventDefault();
  const button = manualForm.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    await addDoc(collection(db, 'publishedReviews'), {
      name: document.getElementById('manualName').value.trim(),
      role: document.getElementById('manualRole').value.trim(),
      rating: Number.parseInt(document.getElementById('manualRating').value, 10),
      text: document.getElementById('manualText').value.trim(),
      ownerResponse: document.getElementById('manualResponse').value.trim() || 'Thank you for your feedback!',
      publishedAt: serverTimestamp()
    });
    manualForm.reset();
    showMessage('Review published.');
    await loadDashboard();
  } catch (error) {
    showMessage('Unable to publish this review.', 'error');
  } finally {
    button.disabled = false;
  }
}

async function importStarterReviews() {
  if (!window.confirm('Import the existing website reviews into Firebase? Existing imports with the same IDs will be updated.')) return;
  try {
    const response = await fetch('./data/reviews.json');
    const reviews = await response.json();
    const batch = writeBatch(db);
    reviews.forEach(review => {
      batch.set(doc(db, 'publishedReviews', `starter-${review.id}`), {
        name: review.name,
        role: review.role,
        rating: review.rating,
        text: review.text,
        ownerResponse: review.ownerResponse || 'Thank you for your feedback!',
        date: review.date
      });
    });
    await batch.commit();
    showMessage('Existing website reviews imported into Firebase.');
    await loadDashboard();
  } catch (error) {
    showMessage('Unable to import existing reviews.', 'error');
  }
}

window.logout = logout;
window.showTab = showTab;
window.approveReview = approveReview;
window.rejectReview = rejectReview;
window.editPendingReview = editPendingReview;
window.addOwnerResponse = addOwnerResponse;
window.deletePublishedReview = deletePublishedReview;
window.importStarterReviews = importStarterReviews;

if (!isFirebaseConfigured()) {
  showLoginMessage('Add your Firebase web configuration in js/firebase-config.js before using this dashboard.');
  loginForm.addEventListener('submit', event => event.preventDefault());
  loginForm.querySelector('button[type="submit"]').disabled = true;
} else {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  loginForm.addEventListener('submit', authenticate);
  manualForm.addEventListener('submit', addManualReview);
  onAuthStateChanged(auth, user => {
    if (user) {
      verifyAdminAndLoad();
    } else {
      setSignedInDisplay(false);
    }
  });
}
