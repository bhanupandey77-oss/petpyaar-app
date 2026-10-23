import { initializeApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, signOut, updateProfile,
  PhoneAuthProvider, GoogleAuthProvider, signInWithCredential, signInWithPopup,
  indexedDBLocalPersistence, browserLocalPersistence, initializeAuth, browserPopupRedirectResolver,
} from 'firebase/auth';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, addDoc, onSnapshot, query, where, orderBy, limit, writeBatch, serverTimestamp, getDocs, increment,
} from 'firebase/firestore';
import { firebaseConfig } from '../firebase-config.js';

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});
auth.languageCode = 'en';
export const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });

export { onAuthStateChanged, signOut, updateProfile, serverTimestamp, increment };

/* ---------- phone OTP ----------
   Android app: native Firebase (Play Integrity / SMS auto-read) — no reCAPTCHA inside the WebView.
   Web: reCAPTCHA (invisible). Both return { confirm(code) } like the web SDK. */
import { Capacitor } from '@capacitor/core';
const NATIVE = Capacitor.isNativePlatform();
let verifier = null;
let FA = null;
const fa = async () => (FA = FA || (await import('@capacitor-firebase/authentication')).FirebaseAuthentication);

export async function sendOtp(phone10, containerId) {
  const phone = '+91' + phone10;
  if (NATIVE) {
    const F = await fa();
    await F.removeAllListeners();
    return new Promise((resolve, reject) => {
      let vid = null;
      const done = { confirm: (code) => signInWithCredential(auth, PhoneAuthProvider.credential(vid, code)) };
      F.addListener('phoneCodeSent', (e) => { vid = e.verificationId; resolve(done); });
      F.addListener('phoneVerificationFailed', (e) => reject(Object.assign(new Error(e.message || 'failed'), { code: e.code || 'auth/native-failed' })));
      F.addListener('phoneVerificationCompleted', async (e) => {
        // SMS read automatically on this phone — finish login without typing
        if (vid && e.verificationCode) { try { await done.confirm(e.verificationCode); } catch { /* user can still type */ } }
      });
      F.signInWithPhoneNumber({ phoneNumber: phone }).catch((e) => reject(e));
    });
  }
  if (!verifier) {
    // fresh element every time — reCAPTCHA cannot render twice into the same node
    const host = document.getElementById(containerId);
    const el = document.createElement('div');
    if (host) { host.innerHTML = ''; host.appendChild(el); }
    verifier = new RecaptchaVerifier(auth, el, { size: 'invisible' });
  }
  try {
    return await signInWithPhoneNumber(auth, phone, verifier);
  } catch (e) {
    try { verifier.clear(); } catch { /* ignore */ }
    verifier = null;
    throw e;
  }
}

/* ---------- Google ---------- */
export async function googleSignIn() {
  if (NATIVE) {
    const F = await fa();
    const r = await F.signInWithGoogle();
    const idToken = r?.credential?.idToken;
    if (!idToken) throw Object.assign(new Error('Google sign-in cancelled'), { code: 'auth/cancelled' });
    return signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
  }
  const p = new GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, p);
}
export async function fullSignOut() {
  if (NATIVE) { try { (await fa()).signOut(); } catch { /* ignore */ } }
  return signOut(auth);
}

/* ---------- tiny data helpers ---------- */
const snapList = (s) => s.docs.map((d) => ({ id: d.id, ...d.data() }));
const build = (path, filters = [], order, lim) => {
  const parts = filters.map(([f, op, v]) => where(f, op, v));
  if (order) parts.push(orderBy(order[0], order[1] || 'asc'));
  if (lim) parts.push(limit(lim));
  return query(collection(db, path), ...parts);
};
export const watchList = (path, filters, cb, order, lim, onErr) =>
  onSnapshot(build(path, filters, order, lim), (s) => cb(snapList(s)), (e) => { console.warn(path, e); onErr?.(e); });
export const watchDoc = (path, id, cb) =>
  onSnapshot(doc(db, path, id), (d) => cb(d.exists() ? { id: d.id, ...d.data() } : null), (e) => { console.warn(path, id, e); cb(null); });
export const getOne = async (path, id) => { const d = await getDoc(doc(db, path, id)); return d.exists() ? { id: d.id, ...d.data() } : null; };
export const getList = async (path, filters, order, lim) => snapList(await getDocs(build(path, filters, order, lim)));
export const put = (path, id, data, merge = true) => setDoc(doc(db, path, id), data, { merge });
export const patch = (path, id, data) => updateDoc(doc(db, path, id), data);
export const remove = (path, id) => deleteDoc(doc(db, path, id));
export const add = (path, data) => addDoc(collection(db, path), data);
export const newId = (path) => doc(collection(db, path)).id;
export async function bulk(ops) {
  for (let i = 0; i < ops.length; i += 400) {
    const b = writeBatch(db);
    ops.slice(i, i + 400).forEach(([kind, path, id, data]) => {
      const r = doc(db, path, id);
      if (kind === 'set') b.set(r, data, { merge: true }); else if (kind === 'del') b.delete(r); else b.update(r, data);
    });
    await b.commit();
  }
}
