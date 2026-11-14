import assert from 'node:assert/strict';
import test from 'node:test';
import { COLOR_EXAMPLES } from '../src/components/theory-lab/examples';
import { MINOR_FORMS, MODES, TRIADS, harmonicField, midiToFrequency, noteToMidi, parentMajor, spellChord, spellDegree, spellHeptatonic } from '../src/components/theory-lab/theory';
test('lab preserves seven modes and correct relative major collections',()=>{
  assert.deepEqual(MODES.map(m=>m.name),['Jônio','Dórico','Frígio','Lídio','Mixolídio','Eólio','Lócrio']);
  assert.deepEqual(MODES.map(m=>parentMajor('C',m)),['C','Bb','Ab','G','F','Eb','Db']);
  for(const mode of MODES){assert.equal(mode.intervals.length,7);assert.equal(mode.intervals[0],0);assert.ok(mode.intervals.every((n,i)=>i===0||n>mode.intervals[i-1]));}
});
test('C Phrygian uses Db and the collection of Ab major',()=>{
  const m=MODES.find(m=>m.id==='phrygian')!;
  assert.deepEqual(spellHeptatonic('C',m.intervals),['C','Db','Eb','F','G','Ab','Bb']);
  assert.equal(parentMajor('C',m),'Ab');assert.equal(m.colorIndex,1);assert.equal(m.intervals[m.colorIndex],1);
  assert.equal(parentMajor('E',m),'C');
});
test('modal characteristic notes preserve the expected contrasts',()=>{
  const color=(id:string)=>{const m=MODES.find(m=>m.id===id)!;return m.intervals[m.colorIndex];};
  assert.equal(color('dorian'),9);assert.equal(color('lydian'),6);assert.equal(color('mixolydian'),10);assert.equal(color('locrian'),6);
});
test('four triads and enharmonic intervals retain diatonic spelling',()=>{
  assert.deepEqual(TRIADS.map(t=>spellChord('C',t.intervals)),[['C','E','G'],['C','Eb','G'],['C','Eb','Gb'],['C','E','G#']]);
  assert.equal(spellDegree('C',6,3),'F#');assert.equal(spellDegree('C',6,4),'Gb');
});
test('major harmonic field distinguishes vii diminished from vii half diminished',()=>{
  assert.deepEqual(harmonicField('C').map(c=>c.name),['C','Dm','Em','F','G','Am','Bdim']);
  const triad=harmonicField('C')[6],tetrad=harmonicField('C',false,true)[6];
  assert.equal(triad.roman,'vii°');assert.deepEqual(triad.notes,['B','D','F']);
  assert.equal(tetrad.roman,'viiø7');assert.equal(tetrad.name,'Bm7(b5)');assert.deepEqual(tetrad.notes,['B','D','F','A']);
  assert.deepEqual(harmonicField('C',false,true)[4].notes,['G','B','D','F']);
});
test('minor natural field and raised seventh retain different roles',()=>{
  assert.deepEqual(harmonicField('A',true).map(c=>c.name),['Am','Bdim','C','Dm','Em','F','G']);
  assert.equal(harmonicField('A',true,true)[1].roman,'iiø7');
  assert.equal(spellHeptatonic('F#',MINOR_FORMS[0].intervals)[6],'E');
  assert.equal(spellHeptatonic('F#',MINOR_FORMS[1].intervals)[6],'E#');
  assert.deepEqual(spellChord('C#',[0,4,7,10]),['C#','E#','G#','B']);
});
test('secondary dominant and modal borrowing do not imply an invented global scale',()=>{
  const s=COLOR_EXAMPLES.find(e=>e.id==='secondary')!,b=COLOR_EXAMPLES.find(e=>e.id==='borrowed')!;
  assert.deepEqual(s.chords.slice(s.focus,s.focus+2),['C#7','F#m']);assert.ok(s.explanation.includes('V7/vi'));
  assert.ok(s.explanation.includes('não demonstra, sozinha, uma modulação'));
  assert.deepEqual(b.chords,['A','F','G','A']);assert.deepEqual(spellChord(b.roots[1],b.intervals[1]),['F','A','C']);
  assert.deepEqual(spellChord(b.roots[2],b.intervals[2]),['G','B','D']);
  assert.ok(b.explanation.includes('bVI e bVII'));assert.ok(b.explanation.includes('sem exigir a criação de uma nova escala única'));
});
test('lab audio helpers preserve A440 and octave spelling',()=>{
  assert.equal(midiToFrequency(noteToMidi('A')),440);assert.equal(midiToFrequency(noteToMidi('A',5)),880);
  assert.equal(noteToMidi('B#',4),72);assert.equal(noteToMidi('Cb',4),59);
});
