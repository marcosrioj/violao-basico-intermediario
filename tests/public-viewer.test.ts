import assert from 'node:assert/strict';
import test from 'node:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HomePage } from '../src/components/home-page';
import { resolvePublicViewer, type PublicViewer } from '../src/lib/public-viewer';
import { evaluateCourseAccess } from '../src/lib/course-access';
import type { Profile } from '../src/lib/contracts';

Object.assign(globalThis, { React });

const student: Profile = {
  id: 'student-1',
  display_name: 'Ana Silva',
  role: 'student',
  timezone: 'America/Sao_Paulo',
};
const teacher: Profile = { ...student, id: 'teacher-1', role: 'teacher' };
const renderHome = (viewer: PublicViewer) =>
  renderToStaticMarkup(React.createElement(HomePage, { viewer }));

test('an anonymous first request renders enrollment without checking memberships', async () => {
  const viewer = await resolvePublicViewer({
    getProfile: async () => null,
    getAccess: async () => {
      throw new Error('Anonymous requests must not query enrollment');
    },
  });
  assert.equal(viewer.status, 'anonymous');
  const html = renderHome(viewer);
  assert.match(html, /Entrar e confirmar matrícula/);
  assert.match(html, /Crie sua conta/);
});

test('the first authenticated render already unlocks course navigation and the correct workspace', async () => {
  for (const profile of [student, teacher]) {
    const viewer = await resolvePublicViewer({
      getProfile: async () => profile,
      getAccess: async (verified) => {
        assert.equal(verified, profile);
        return evaluateCourseAccess(verified, async () => true);
      },
    });
    const html = renderHome(viewer);
    assert.match(html, /Olá, Ana\./);
    assert.match(
      html,
      profile.role === 'teacher' ? /Abrir minhas turmas/ : /Continuar meus estudos/,
    );
    assert.match(html, /Acesso ao curso liberado/);
    assert.doesNotMatch(html, /Entrar e confirmar matrícula|Crie sua conta|nav-link locked/);
    assert.match(html, /href="\/curso\?modulo=1"/);
    assert.equal(html.includes('Área do professor'), profile.role === 'teacher');
  }
});

test('session and enrollment are checked again for every request without carrying another visitor state', async () => {
  let currentProfile: Profile | null = student;
  let enrolled = true;
  const dependencies = {
    getProfile: async () => currentProfile,
    getAccess: async (profile: Profile) => evaluateCourseAccess(profile, async () => enrolled),
  };
  assert.equal((await resolvePublicViewer(dependencies)).courseAccess, true);
  enrolled = false;
  const pending = await resolvePublicViewer(dependencies);
  assert.equal(pending.status, 'authenticated');
  assert.equal(pending.courseAccess, false);
  const html = renderHome(pending);
  assert.match(html, /Conta conectada · falta confirmar matrícula/);
  assert.doesNotMatch(html, /Crie sua conta|Entrar e confirmar matrícula|Acesso ao curso liberado/);
  currentProfile = null;
  assert.equal((await resolvePublicViewer(dependencies)).status, 'anonymous');
});

test('an auth or enrollment outage keeps public pages usable without displaying a false signed-out state', async () => {
  for (const profileUnavailable of [true, false]) {
    const viewer = await resolvePublicViewer({
      getProfile: async () => {
        if (profileUnavailable) throw new Error('provider unavailable');
        return student;
      },
      getAccess: async () => {
        throw new Error('database unavailable');
      },
    });
    assert.equal(viewer.status, 'unavailable');
    assert.equal(viewer.courseAccess, false);
    assert.equal(viewer.profile, profileUnavailable ? null : student);
    const html = renderHome(viewer);
    assert.match(html, /Não foi possível verificar seu acesso/);
    assert.match(html, /Verificar meu acesso/);
    assert.doesNotMatch(
      html,
      /Crie sua conta|Entrar e confirmar matrícula|Acesso ao curso liberado/,
    );
  }
});
