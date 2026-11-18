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
  context.setDefaultTimeout(15000);
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
      const noise = context.createBufferSource();
      const noiseGain = context.createGain();
      const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const data = buffer.getChannelData(0);
      let seed = 12345;
      for (let i = 0; i < data.length; i++) {
        seed = (1664525 * seed + 1013904223) >>> 0;
        data[i] = (seed / 0xffffffff) * 2 - 1;
      }
      noise.buffer = buffer;
      noise.loop = true;
      noiseGain.gain.value = 0;
      noise.connect(noiseGain).connect(destination);
      noise.start();
      oscillator.frequency.value = 440 * 2 ** ((40 - 69) / 12);
      gain.gain.value = 0.12;
      oscillator.connect(gain).connect(destination);
      oscillator.start();
      await context.resume();
      state.generators.push({ context, oscillator, gain, noiseGain });
      if (state.mode === 'processed') {
        const track = destination.stream.getAudioTracks()[0];
        const nativeSettings = track.getSettings.bind(track);
        track.getSettings = () => ({ ...nativeSettings(), autoGainControl: true });
      }
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
  // Await local client chunks as well as HTML before the first microphone gesture.
  const response = await page.goto(`${base}/laboratorio`, { waitUntil: 'networkidle' });
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
const guidance = async (page, text) => {
  try {
    await page.locator('.tuner-guidance strong').filter({ hasText: text }).waitFor();
  } catch (error) {
    console.error(
      'Expected guidance:',
      String(text),
      await page.locator('.tuner-main').innerText(),
    );
    throw error;
  }
};

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

  const signal = await open('processed');
  await start(signal.page);
  await guidance(signal.page, /^Afinada$/);
  await signal.page.locator('.tuner-settings summary').click();
  await signal.page.locator('.tuner-processing-warning').waitFor();
  await signal.page.evaluate(() => {
    const key = 'violao-vivo:tuner:v1';
    const value = JSON.stringify({ sensitivity: 'noisy' });
    localStorage.setItem(key, value);
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: value }));
  });
  assert.equal(await signal.page.getByLabel('Sensibilidade da captação').inputValue(), 'noisy');
  assert.equal(await signal.page.locator('.tuner-display').getAttribute('data-tuned'), 'false');
  await guidance(signal.page, /^Afinada$/);
  passed.push(
    'An external profile change reacquires pitch and cannot inherit the previous confirmation',
  );
  await signal.page.evaluate(() => {
    window.__tunerTest.generators.at(-1).gain.gain.value = 0.00025;
  });
  await guidance(signal.page, /^Toque uma corda$/);
  await signal.page
    .getByRole('button', { name: '6ª corda, Mi, oitava 2. Fixar alvo.', exact: true })
    .click();
  await signal.page.getByLabel('Sensibilidade da captação').selectOption('soft');
  assert.equal(
    await signal.page
      .getByRole('button', { name: '6ª corda, Mi, oitava 2. Fixar alvo.', exact: true })
      .getAttribute('aria-pressed'),
    'true',
  );
  await guidance(signal.page, /^Afinada$/);
  assert.equal(await signal.page.locator('.tuner-note').innerText(), 'E2');
  passed.push('Soft capture detects a clean −75 dBFS E2 rejected by the balanced floor');
  passed.push('Reported browser voice processing is surfaced as actionable input feedback');

  await signal.page.evaluate(() => {
    const generator = window.__tunerTest.generators.at(-1);
    generator.gain.gain.value = 0;
    generator.noiseGain.gain.value = 0.03;
  });
  await guidance(signal.page, /^Buscando uma nota estável$/);
  await signal.page.waitForTimeout(1000);
  assert.equal(await signal.page.locator('.tuner-display').getAttribute('data-tuned'), 'false');
  assert.equal(await signal.page.locator('.tuner-note').innerText(), '—');
  passed.push('Broadband noise alone clears note and confirmation even in soft mode');

  await signal.page.getByRole('button', { name: 'Medir ruído do ambiente', exact: true }).click();
  await signal.page
    .locator('.tuner-noise-status')
    .filter({ hasText: 'Medição aplicada' })
    .waitFor();
  await guidance(signal.page, /^Som próximo do ruído$/);
  await signal.page.evaluate(() => {
    window.__tunerTest.generators.at(-1).gain.gain.value = 0.06;
  });
  await guidance(signal.page, /^Afinada$/);
  await signal.page
    .getByRole('button', { name: '5ª corda, Lá, oitava 2. Fixar alvo.', exact: true })
    .click();
  await signal.page.evaluate(() => {
    window.__tunerTest.generators.at(-1).oscillator.frequency.value = 110;
  });
  await guidance(signal.page, /^Afinada$/);
  assert.equal(await signal.page.locator('.tuner-note').innerText(), 'A2');
  passed.push(
    'A2 mixed with broadband noise remains in the correct octave and reaches stable confirmation',
  );
  await signal.page.evaluate(() => {
    window.__tunerTest.generators.at(-1).gain.gain.value = 0;
  });
  await guidance(signal.page, /^Som próximo do ruído$/);
  passed.push(
    'Ambient calibration rejects measured noise, admits a louder note, and clears it on decay',
  );
  await signal.page.getByRole('button', { name: 'Limpar medição', exact: true }).click();
  await signal.page.getByRole('button', { name: 'Medir ruído do ambiente', exact: true }).click();
  await signal.page.getByRole('button', { name: 'Cancelar medição', exact: true }).click();
  assert.equal(
    await signal.page.getByRole('button', { name: 'Parar microfone', exact: true }).count(),
    1,
  );
  passed.push(
    'Ambient measurement can be cancelled without closing capture or retaining its floor',
  );

  await signal.page.evaluate(() => {
    const generator = window.__tunerTest.generators.at(-1);
    generator.noiseGain.gain.value = 0;
    generator.oscillator.frequency.value = 5;
    generator.gain.gain.value = 1.6;
  });
  await guidance(signal.page, /^Sinal muito forte$/);
  assert.equal(await signal.page.locator('.tuner-display').getAttribute('data-tuned'), 'false');
  passed.push('Raw input clipping remains visible even when the high-pass filter attenuates it');
  await signal.page.getByRole('button', { name: 'Medir ruído do ambiente', exact: true }).click();
  await signal.page.locator('.tuner-noise-status').filter({ hasText: 'saturou' }).waitFor();
  assert.equal(
    await signal.page.getByRole('button', { name: 'Limpar medição', exact: true }).count(),
    0,
  );
  passed.push(
    'Clipped input rejects ambient calibration instead of learning an unusable threshold',
  );

  await signal.page.getByRole('button', { name: 'Cromático', exact: true }).click();
  for (const frequency of [45, 61.735, 1400]) {
    await signal.page.evaluate((frequency) => {
      const generator = window.__tunerTest.generators.at(-1);
      generator.oscillator.frequency.value = frequency;
      generator.gain.gain.value = 0.03;
    }, frequency);
    await signal.page.waitForFunction((expected) => {
      const label = document.querySelector('.tuner-note-name')?.textContent ?? '';
      const match = label.match(/([\d.,]+) Hz/);
      return (
        match && Math.abs(Number(match[1].replace('.', '').replace(',', '.')) - expected) < 0.3
      );
    }, frequency);
  }
  passed.push('The filtered Web Audio path preserves 45 Hz, seven-string B1, and 1400 Hz');
  await signal.page.getByRole('button', { name: 'Parar microfone', exact: true }).click();
  await allStopped(signal.page);
  await signal.page.reload({ waitUntil: 'load' });
  await signal.page.locator('.tuner-settings summary').click();
  assert.equal(await signal.page.getByLabel('Sensibilidade da captação').inputValue(), 'soft');
  assert.equal(
    await signal.page.getByRole('button', { name: 'Limpar medição', exact: true }).count(),
    0,
  );
  passed.push('Sensitivity persists across reload while ambient measurements do not');
  await signal.context.close();

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
  nativePage.setDefaultTimeout(15000);
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
    waitUntil: 'networkidle',
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
} catch (error) {
  console.error(JSON.stringify({ passed: passed.length, checks: passed }, null, 2));
  throw error;
} finally {
  await nativeBrowser?.close();
  await browser.close();
  if (audioDirectory) await rm(audioDirectory, { recursive: true, force: true });
}
