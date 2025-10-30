/**
 * ui/aiHubPanels.js
 * -------------------------------------------------------------
 * Набір легких хелперів для показу/приховування панелей AI Hub
 * (основна, команди, журнал, стек). Лише керує видимістю, логіку не змінює.
 */
// ui/aiHubPanels.js — Легкі хелпери видимості панелей (без зміни логіки)

function setDisplay(el, show) {
  if (!el) return;
  el.style.display = show ? '' : 'none';
}

function toggleDisplay(el) {
  if (!el) return;
  el.style.display = (el.style.display === 'none') ? '' : 'none';
}

export function showAIHub() {
  const hub = document.getElementById('ai-hub');
  setDisplay(hub, true);
  try { hub?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' }); } catch {}
}
export function hideAIHub() {
  const hub = document.getElementById('ai-hub');
  setDisplay(hub, false);
}
export function toggleAIHub() {
  const hub = document.getElementById('ai-hub');
  toggleDisplay(hub);
}

export function showLivePanel() {
  const el = document.querySelector('#ai-hub .panel--primary');
  setDisplay(el, true);
  try { el?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' }); } catch {}
}
export function hideLivePanel() {
  const el = document.querySelector('#ai-hub .panel--primary');
  setDisplay(el, false);
}
export function toggleLivePanel() {
  const el = document.querySelector('#ai-hub .panel--primary');
  toggleDisplay(el);
}

export function showCommandsPanel() {
  const el = document.querySelector('#ai-hub .panel--commands');
  setDisplay(el, true);
  try { el?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' }); } catch {}
}
export function hideCommandsPanel() {
  const el = document.querySelector('#ai-hub .panel--commands');
  setDisplay(el, false);
}
export function toggleCommandsPanel() {
  const el = document.querySelector('#ai-hub .panel--commands');
  toggleDisplay(el);
}

export function showLogPanel() {
  const el = document.querySelector('#ai-hub .panel--log');
  setDisplay(el, true);
  try { el?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' }); } catch {}
}
export function hideLogPanel() {
  const el = document.querySelector('#ai-hub .panel--log');
  setDisplay(el, false);
}
export function toggleLogPanel() {
  const el = document.querySelector('#ai-hub .panel--log');
  toggleDisplay(el);
}
