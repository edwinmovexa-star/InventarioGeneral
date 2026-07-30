import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";

export function esperarSesion() {
  return new Promise((resolve) => {
    const cancelar = onAuthStateChanged(auth, (usuario) => {
      cancelar();
      resolve(usuario);
    });
  });
}

export async function obtenerPerfil(uid) {
  const referencia = doc(db, "usuarios", uid);
  const documento = await getDoc(referencia);
  return documento.exists() ? { id: documento.id, ...documento.data() } : null;
}

export async function protegerPagina({ rolesPermitidos = [] } = {}) {
  const usuario = await esperarSesion();

  if (!usuario) {
    window.location.replace(rutaRaiz() + "index.html");
    return null;
  }

  const perfil = await obtenerPerfil(usuario.uid);
  if (!perfil || perfil.activo === false) {
    await signOut(auth);
    window.location.replace(rutaRaiz() + "index.html?error=sin-perfil");
    return null;
  }

  if (rolesPermitidos.length && !rolesPermitidos.includes(perfil.rol)) {
    window.location.replace(rutaRaiz() + "consulta/index.html?error=sin-permiso");
    return null;
  }

  document.documentElement.classList.add("sesion-lista");
  return { usuario, perfil };
}

export async function cerrarSesion() {
  await signOut(auth);
  window.location.replace(rutaRaiz() + "index.html");
}

export function rutaRaiz() {
  const path = window.location.pathname;
  if (path.includes("/actualizador/") || path.includes("/consulta/")) return "../";
  return "./";
}
