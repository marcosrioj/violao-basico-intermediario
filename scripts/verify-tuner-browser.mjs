// Optional browser verification against a running local app. No real microphone is used.
// PLAYWRIGHT_MODULE and CHROMIUM_EXECUTABLE can point to existing local installations.
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}),
});
const base = process.env.TUNER_BASE_URL || 'http://127.0.0.1:3000';
const passed = [];
const errors = [];
let nativeBrowser;
let audioDirectory;

async function guitarFixture() {
  audioDirectory = await mkdtemp(join(tmpdir(), 'violao-tuner-audio-'));
  const path = join(audioDirectory, 'guitar-e2.wav');
  const sampleRate = 48000;
  const samples = sampleRate * 8;
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(samples * 2, 40);
  const frequency = 440 * 2 ** ((40 - 69) / 12);
  for (let i = 0; i < samples; i++) {
    const phase = (2 * Math.PI * frequency * i) / sampleRate;
    const value = 0.18 * Math.sin(phase) + 0.06 * Math.sin(2 * phase) + 0.03 * Math.sin(3 * phase);
    wav.writeInt16LE(Math.round(value * 32767), 44 + i * 2);
  }
  await writeFile(path, wav);
  return path;
}

async function open(mode = 'signal') {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript((captureMode) => {
    const NativeContext = window.AudioContext;
    const state = {
      mode: captureMode,
      contexts: [],
      streams: [],
      generators: [],
      constraints: [],
      pending: null,
    };
    window.__tunerTest = state;
    window.AudioContext = class extends NativeContext {
      constructor(...args) {
        super(...args);
        state.contexts.push(this);
      }
    };
    const stream = async () => {
      const context = new NativeContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const destination = context.createMediaStreamDestination();
      oscillator.frequency.value = 440 * 2 ** ((40 - 69) / 12);
      gain.gain.value = 0.12;
      oscillator.connect(gain).connect(destination);
      oscillator.start();
      await context.resume();
      state.generators.push({ context, oscillator, gain });
      state.streams.push(destination.stream);
      return destination.stream;
    };
    navigator.mediaDevices.getUserMedia = (constraints) => {
      state.constraints.push(constraints);
      if (state.mode === 'denied') {
        return Promise.reject(new DOMException('Test permission denied', 'NotAllowedError'));
      }
      if (state.mode === 'pending') {
        return new Promise((resolve) => {
          state.pending = async () => resolve(await stream());
        });
      }
      return stream();
    };
    navigator.mediaDevices.enumerateDevices = async () => [
      { kind: 'audioinput', deviceId: 'synthetic-1', label: 'Entrada sintética 1' },
      { kind: 'audioinput', deviceId: 'synthetic-2', label: 'Entrada sintética 2' },
    ];
  }, mode);
  const response = await page.goto(`${base}/laboratorio`, { waitUntil: 'load' });
  assert.match(response.headers()['permissions-policy'], /microphone=\(self\)/);
  await page.getByRole('button', { name: 'Ativar microfone', exact: true }).waitFor();
  return { page, context };
}

const start = (page) => page.getByRole('button', { name: 'Ativar microfone', exact: true }).click();
const allStopped = (page) =>
  page.waitForFunction(
    () =>
      window.__tunerTest.streams.every((stream) =>
        stream.getTracks().every((track) => track.readyState === 'ended'),
      ) && window.__tunerTest.contexts.every((context) => context.state === 'closed'),
  );
const guidance = (page, text) =>
  page.locator('.tuner-guidance strong').filter({ hasText: text }).waitFor();

try {
  const { page, context } = await open();
  await start(page);
  await guidance(page, /^Afinada$/);
  assert.equal(await page.locator('.tuner-note').innerText(), 'E2');
  const constraints = await page.evaluate(() => window.__tunerTest.constraints[0]);
  assert.equal(constraints.audio.echoCancellation, false);
  assert.equal(constraints.audio.noiseSuppression, false);
  assert.equal(constraints.audio.autoGainControl, false);
  assert.equal(constraints.video, false);
  passed.push('Synthetic E2 passes through Web Audio, detector, smoothing and stable confirmation');

  await page.evaluate(() => {
    const generator = window.__tunerTest.generators.at(-1);
    generator.oscillator.frequency.value *= 2 ** (20 / 1200);
  });
  await guidance(page, /^Baixe a afinação$/);
  await page.waitForFunction(() => {
    const text = document.querySelector('.tuner-cents')?.textContent ?? '';
    return Math.abs(Number.parseFloat(text.replace(',', '.')) - 20) < 1;
  });
  passed.push('A +20-cent signal gives the correct adjustment direction and cents');

  await page.evaluate(() => {
    window.__tunerTest.generators.at(-1).gain.gain.value = 0;
  });
  await page.waitForFunction(
    () =>
      document.querySelector('.tuner-note')?.getAttribute('aria-label') ===
      'Nenhuma nota detectada',
  );
  assert.equal(await page.locator('.tuner-display').getAttribute('data-tuned'), 'false');
  passed.push('Silence clears the note and tuning confirmation');

  await page.getByText('Ajustes do afinador', { exact: false }).first().click();
  await page.getByLabel('Microfone ou interface').selectOption('synthetic-2');
  await allStopped(page);
  await start(page);
  await guidance(page, /^Afinada$/);
  assert.deepEqual(
    await page.evaluate(() => window.__tunerTest.constraints.at(-1).audio.deviceId),
    { exact: 'synthetic-2' },
  );
  passed.push('Changing input releases the old stream and requires a fresh explicit start');

  await page.getByRole('button', { name: /^Ouvir E2$/ }).click();
  await page.waitForFunction(() =>
    window.__tunerTest.streams.every((stream) =>
      stream.getTracks().every((track) => track.readyState === 'ended'),
    ),
  );
  await page.getByRole('button', { name: 'Parar referência', exact: true }).click();
  await allStopped(page);
  passed.push('Reference tone releases microphone; stopping reference closes its AudioContext');

  await start(page);
  await guidance(page, /^Afinada$/);
  await page.evaluate(() => {
    window.__tunerTest.streams.at(-1).getAudioTracks()[0].dispatchEvent(new Event('ended'));
  });
  await page.getByRole('alert').filter({ hasText: 'desconectado' }).waitFor();
  await allStopped(page);
  passed.push('Lost microphone displays a recoverable error and releases capture');

  await start(page);
  await guidance(page, /^Afinada$/);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await allStopped(page);
  await page.evaluate(() => Reflect.deleteProperty(document, 'hidden'));
  passed.push('Visibility change releases capture and prevents listening in a hidden tab');

  await start(page);
  await guidance(page, /^Afinada$/);
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await allStopped(page);
  passed.push('Pagehide releases tracks and AudioContexts');

  await start(page);
  await guidance(page, /^Afinada$/);
  await page.getByRole('button', { name: 'Seguir o ritmo', exact: true }).click();
  await allStopped(page);
  passed.push('Switching workshop releases tracks and AudioContexts');
  await context.close();

  const denied = await open('denied');
  await start(denied.page);
  await denied.page.getByRole('alert').filter({ hasText: 'bloqueado' }).waitFor();
  await allStopped(denied.page);
  assert.equal(
    await denied.page.getByRole('button', { name: 'Ativar microfone', exact: true }).count(),
    1,
  );
  passed.push('Denied permission shows recovery instructions and leaves no active AudioContext');
  await denied.context.close();

  const pending = await open('pending');
  await start(pending.page);
  await pending.page.getByRole('button', { name: 'Cancelar solicitação', exact: true }).click();
  await pending.page.evaluate(() => window.__tunerTest.pending());
  await allStopped(pending.page);
  assert.equal(
    await pending.page.getByRole('button', { name: 'Ativar microfone', exact: true }).count(),
    1,
  );
  passed.push('A permission grant arriving after cancellation is immediately released');
  await pending.context.close();

  const unstable = await open();
  await start(unstable.page);
  await guidance(unstable.page, /^Mantenha a nota$/);
  await unstable.page.waitForTimeout(400);
  await unstable.page.evaluate(() => {
    window.__tunerTest.confirmedAfterSilence = false;
    window.__tunerTest.generators.at(-1).gain.gain.value = 0;
    new MutationObserver(() => {
      if (document.querySelector('.tuner-display')?.getAttribute('data-tuned') === 'true') {
        window.__tunerTest.confirmedAfterSilence = true;
      }
    }).observe(document.querySelector('.tuner-display'), { attributes: true, subtree: true });
  });
  await unstable.page.waitForTimeout(1000);
  assert.equal(await unstable.page.evaluate(() => window.__tunerTest.confirmedAfterSilence), false);
  passed.push('A short in-range note cannot become confirmed from a stale held reading');
  await unstable.context.close();

  // This second browser exercises native getUserMedia, including Permissions-Policy,
  // browser media constraints, and device capture. Only the physical device is fake.
  const audioFile = await guitarFixture();
  nativeBrowser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}),
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      `--use-file-for-fake-audio-capture=${audioFile}`,
    ],
  });
  const nativePage = await nativeBrowser.newPage();
  nativePage.on('pageerror', (error) => errors.push(error.message));
  await nativePage.addInitScript(() => {
    const capture = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    window.__nativeTunerStreams = [];
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      const stream = await capture(constraints);
      window.__nativeTunerStreams.push(stream);
      return stream;
    };
  });
  const nativeResponse = await nativePage.goto(`${base}/laboratorio`, {
    waitUntil: 'load',
  });
  assert.match(nativeResponse.headers()['permissions-policy'], /microphone=\(self\)/);
  await start(nativePage);
  await guidance(nativePage, /^Afinada$/);
  assert.equal(await nativePage.locator('.tuner-note').innerText(), 'E2');
  const input = await nativePage.evaluate(() => {
    const track = window.__nativeTunerStreams[0].getAudioTracks()[0];
    return { label: track.label, state: track.readyState, settings: track.getSettings() };
  });
  assert.equal(input.state, 'live');
  assert.equal(input.settings.echoCancellation, false);
  assert.equal(input.settings.autoGainControl, false);
  assert.equal(input.settings.noiseSuppression, false);
  await nativePage.getByRole('button', { name: 'Parar microfone', exact: true }).click();
  await nativePage.waitForFunction(() =>
    window.__nativeTunerStreams.every((stream) =>
      stream.getTracks().every((track) => track.readyState === 'ended'),
    ),
  );
  passed.push(
    'Native getUserMedia reads a harmonic E2 WAV through Chromium fake input, confirms tuning, and stops the real MediaStreamTrack',
  );

  assert.deepEqual(errors, [], 'No browser runtime errors');
  console.log(JSON.stringify({ passed: passed.length, checks: passed }, null, 2));
} finally {
  await nativeBrowser?.close();
  await browser.close();
  if (audioDirectory) await rm(audioDirectory, { recursive: true, force: true });
}
