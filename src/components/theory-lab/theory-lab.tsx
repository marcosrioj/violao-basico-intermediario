'use client';
import { useId, useState, type ReactNode } from 'react';
import { ArrowRight, Ear, FlaskConical, Play, Square } from 'lucide-react';
import { stopAudio, type SoundStep } from './audio';
import { FLAT_NAMES, GUITAR_TUNING, INTERVALS, MINOR_FORMS, MODES, ROOT_NAMES, TRIADS, harmonicField, midiNoteName, modulo, noteToMidi, parentMajor, scaleSteps, spellChord, spellDegree, spellHeptatonic } from './theory';
import { COLOR_EXAMPLES } from './examples';
import { Quiz } from './quiz';
import { useAudioPreview } from './use-audio-preview';
import './music.css';

const NOTE_PT: Record<string,string> = { C:'dó',D:'ré',E:'mi',F:'fá',G:'sol',A:'lá',B:'si' };
const sequence = (notes:number[],spacing=0.55):SoundStep[] => notes.map((note,i) => ({notes:[note],at:i*spacing,duration:spacing*0.85}));
function RootSelect({value,onChange,label='Nota de referência',roots=ROOT_NAMES}:{value:string;onChange:(value:string)=>void;label?:string;roots?:readonly string[]}) {
  const id=useId();
  return <label className="music-field" htmlFor={id}><span>{label}</span><select id={id} value={value} onChange={e=>onChange(e.target.value)}>
    {roots.map(note=><option key={note} value={note}>{note+' · '+NOTE_PT[note[0]]+note.slice(1).replaceAll('#',' sustenido').replaceAll('b',' bemol')}</option>)}
  </select></label>;
}
function Listen({steps,children,quiet=false}:{steps:SoundStep[];children:ReactNode;quiet?:boolean}) {
  const audio=useAudioPreview();
  return <div className="music-listen-control"><button type="button" className={'music-button '+(quiet?'music-button-quiet':'music-button-primary')}
    onClick={()=>audio.playing?audio.stop():void audio.play(steps)}>
    {audio.playing?<Square size={16} aria-hidden="true" />:<Play size={16} aria-hidden="true" />}{audio.playing?'Parar áudio':children}
  </button>{audio.error&&<p className="music-error" role="alert">{audio.error}</p>}</div>;
}
function NoteStrip({notes,degrees,highlighted=[],midi}:{notes:string[];degrees?:string[];highlighted?:number[];midi?:number[]}) {
  const audio=useAudioPreview();
  return <><div className="music-note-strip" role="group" aria-label="Notas do exemplo">
    {notes.map((note,i)=><button key={note+'-'+i} type="button" className={'music-note'+(highlighted.includes(i)?' is-characteristic':'')}
      aria-label={'Ouvir '+note+', grau '+(degrees?.[i]??i+1)+(highlighted.includes(i)?', nota em destaque':'')}
      onClick={()=>void audio.play([{notes:[midi?.[i]??noteToMidi(note)],at:0,duration:0.8}])}>
      <small>{degrees?.[i]??i+1}</small><strong>{note}</strong>{highlighted.includes(i)&&<span>em foco</span>}
    </button>)}
  </div>{audio.error&&<p className="music-error" role="alert">{audio.error}</p>}</>;
}
function Prompt({children}:{children:ReactNode}) {
  return <div className="music-listening-prompt"><Ear size={19} aria-hidden="true" /><p>{children}</p></div>;
}
const LABS:Record<string,{title:string;description:string;component:()=>ReactNode}>={
  R1:{title:'Encontre as notas no braço',description:'Uma casa por vez. Veja, escute e compare.',component:ChromaticLab},
  R2:{title:'A distância vira som',description:'Compare o nome, a escrita e a sonoridade de cada intervalo.',component:IntervalLab},
  R3:{title:'Construa o acorde por dentro',description:'A terça e a quinta mudam o caráter da tríade.',component:TriadLab},
  R4:{title:'Da escala ao campo harmônico',description:'Empilhe terças usando as notas de uma mesma escala.',component:HarmonicFieldLab},
  R5:{title:'Três formas do menor',description:'Ouça o que acontece quando o sexto ou o sétimo grau muda.',component:MinorLab},
  R6:{title:'O centro muda a escuta',description:'Compare os modos mantendo a mesma nota como centro.',component:ModesLab},
  R7:{title:'Uma cor nova na harmonia',description:'Investigue a função do acorde e para onde ele conduz.',component:HarmonicColorLab},
  R8:{title:'Leve a ideia para outro lugar',description:'Crie, transponha um exemplo autoral e planeje sua próxima escuta.',component:ContinuationLab},
};
export function TheoryLab({referenceId}:{referenceId:string}) {
  const lab=LABS[referenceId.toUpperCase()], titleId=useId();
  if(!lab)return <p className="music-small">Escolha um dos laboratórios da trilha.</p>;
  const Component=lab.component;
  return <section id="laboratorio" className="music-lab" aria-labelledby={titleId} onChangeCapture={stopAudio} onClickCapture={event=>{
    if((event.target as Element).closest('button'))stopAudio();
  }}>
    <div className="music-lab-heading"><span className="music-eyebrow"><FlaskConical size={16} aria-hidden="true" /> EXPERIMENTE A IDEIA</span>
      <h2 id={titleId}>{lab.title}</h2><p>{lab.description}</p></div>
    <Component key={referenceId} />
    <p className="music-small music-lab-footnote">Exemplos autorais com áudio sintetizado. Use a escuta e o violão juntos; estes experimentos não alteram o tom das músicas da trilha.</p>
  </section>;
}
function ChromaticLab() {
  const id=useId(),[stringIndex,setStringIndex]=useState(0),[fret,setFret]=useState(0),audio=useAudioPreview();
  const midi=GUITAR_TUNING[stringIndex]+fret,sharp=midiNoteName(midi),flat=FLAT_NAMES[modulo(midi,12)];
  return <>
    <div className="music-lab-controls"><label className="music-field" htmlFor={id}><span>Escolha uma corda</span>
      <select id={id} value={stringIndex} onChange={e=>setStringIndex(Number(e.target.value))}>
        {GUITAR_TUNING.map((note,i)=><option key={i} value={i}>{(6-i)+'ª corda · '+midiNoteName(note)+(i===0?' grave':i===5?' aguda':'')}</option>)}
      </select></label>
      <div className="music-result"><small>{'Casa '+fret+(fret===0?' · corda solta':'')}</small><strong>{sharp}{flat!==sharp&&<><span> = </span>{flat}</>}</strong></div>
    </div>
    <div className="music-fretboard" role="group" aria-label="Casas de zero a doze da corda selecionada">
      {Array.from({length:13},(_,number)=><button key={number} type="button" aria-pressed={number===fret} onClick={()=>{
        setFret(number);void audio.play([{notes:[GUITAR_TUNING[stringIndex]+number],at:0,duration:0.8}]);
      }}><small>{number===0?'Solta':'Casa '+number}</small><strong>{midiNoteName(GUITAR_TUNING[stringIndex]+number)}</strong><span aria-hidden="true">{[3,5,7,9,12].includes(number)?number===12?'● ●':'●':' '}</span></button>)}
    </div>
    {audio.error&&<p className="music-error" role="alert">{audio.error}</p>}
    <Prompt>Toque duas casas vizinhas: você caminhou um semitom. Observe que E–F e B–C já são vizinhos, sem uma nota natural entre eles. A casa 12 repete o nome da corda solta uma oitava acima.</Prompt>
    <p className="music-small">C# e Db têm a mesma altura na afinação temperada usada aqui. O nome correto depende da escrita e da função musical.</p>
    <Listen steps={sequence(Array.from({length:13},(_,i)=>GUITAR_TUNING[stringIndex]+i),0.3)}>Ouvir a subida cromática</Listen>
  </>;
}
function IntervalLab() {
  const id=useId(),[root,setRoot]=useState('C'),[intervalIndex,setIntervalIndex]=useState(3);
  const interval=INTERVALS[intervalIndex],second=spellDegree(root,interval.semitones,interval.steps),midi=[noteToMidi(root),noteToMidi(root)+interval.semitones];
  return <>
    <div className="music-lab-controls"><RootSelect value={root} onChange={setRoot} />
      <label className="music-field" htmlFor={id}><span>Intervalo ascendente</span><select id={id} value={intervalIndex} onChange={e=>setIntervalIndex(Number(e.target.value))}>
        {INTERVALS.map((entry,i)=><option key={entry.name} value={i}>{entry.name}</option>)}</select></label></div>
    <div className="music-interval-result"><strong>{root}</strong><span><ArrowRight size={22} aria-hidden="true" />{interval.semitones+' '+(interval.semitones===1?'semitom':'semitons')}</span><strong>{second}</strong></div>
    <div className="music-semitone-ruler" aria-label={interval.name+': '+interval.semitones+' semitons'}>{Array.from({length:13},(_,i)=><span key={i} className={i<=interval.semitones?'is-filled':''}>{i}</span>)}</div>
    <div className="music-actions"><Listen steps={sequence(midi,0.8)}>Ouvir uma nota depois da outra</Listen><Listen quiet steps={[{notes:midi,at:0,duration:1.8}]}>Ouvir as duas juntas</Listen></div>
    <Prompt>Antes de tocar o áudio, imagine a distância. Depois cante ou toque o intervalo devagar. Conte as letras para obter o número; conte os semitons para identificar a qualidade.</Prompt>
    <p className="music-small">Compare 4ª aumentada e 5ª diminuta: ambas têm seis semitons neste sistema, mas a escrita é diferente. A partir de C, são F# e Gb.</p>
  </>;
}
function TriadLab() {
  const id=useId(),[root,setRoot]=useState('C'),[kind,setKind]=useState(0),[inversion,setInversion]=useState(0);
  const triad=TRIADS[kind],notes=spellChord(root,triad.intervals),ordered=[0,1,2].map((_,i)=>(i+inversion)%3);
  const midi=ordered.map(i=>noteToMidi(root,3)+triad.intervals[i]+(i<inversion?12:0));
  return <>
    <div className="music-lab-controls"><RootSelect value={root} onChange={setRoot} label="Fundamental" />
      <label className="music-field" htmlFor={id}><span>Nota mais grave</span><select id={id} value={inversion} onChange={e=>setInversion(Number(e.target.value))}>
        <option value={0}>Fundamental · posição fundamental</option><option value={1}>Terça · primeira inversão</option><option value={2}>Quinta · segunda inversão</option>
      </select></label></div>
    <div className="music-choice-row" role="group" aria-label="Qualidade da tríade">{TRIADS.map((entry,i)=><button type="button" key={entry.id} aria-pressed={i===kind} onClick={()=>setKind(i)}>{entry.name}</button>)}</div>
    <div className="music-lab-result-heading"><div className="music-result"><small>{'Tríade '+triad.name.toLowerCase()}</small><strong>{root+triad.suffix}</strong></div><span className="music-formula">{triad.formula}</span></div>
    <NoteStrip notes={ordered.map(i=>notes[i])} degrees={ordered.map(i=>['fundamental','terça','quinta'][i])} midi={midi} highlighted={[0]} />
    <div className="music-actions"><Listen steps={[{notes:midi,at:0,duration:2}]}>Ouvir a tríade</Listen><Listen quiet steps={sequence(midi,0.65)}>Ouvir nota por nota</Listen></div>
    <Prompt>A tríade maior tem terça maior e quinta justa; a menor tem terça menor e quinta justa. Na diminuta, a quinta também diminui. Mudar a nota do baixo cria uma inversão e preserva essas três notas.</Prompt>
  </>;
}
function HarmonicFieldLab() {
  const [root,setRoot]=useState('C'),[minor,setMinor]=useState(false),[sevenths,setSevenths]=useState(false),[degree,setDegree]=useState(0);
  const field=harmonicField(root,minor,sevenths),selected=field[degree],intervals=minor?MINOR_FORMS[0].intervals:MODES[0].intervals,notes=spellHeptatonic(root,intervals);
  return <>
    <div className="music-lab-controls"><RootSelect value={root} onChange={setRoot} label="Tônica da escala" />
      <div className="music-choice-row" role="group" aria-label="Escala de origem"><button type="button" aria-pressed={!minor} onClick={()=>setMinor(false)}>Maior</button><button type="button" aria-pressed={minor} onClick={()=>setMinor(true)}>Menor natural</button></div>
      <label className="music-checkbox"><input type="checkbox" checked={sevenths} onChange={e=>setSevenths(e.target.checked)} /> Adicionar a sétima</label></div>
    <p className="music-scale-line"><strong>Escala:</strong> {notes.join(' · ')}<span>{scaleSteps(intervals).join(' — ')}</span></p>
    <div className="music-degree-grid" role="group" aria-label="Graus do campo harmônico">{field.map((chord,i)=><button key={i} type="button" aria-pressed={degree===i} onClick={()=>setDegree(i)}>
      <small>{chord.roman}</small><strong>{chord.name}</strong><span>{chord.quality}</span></button>)}</div>
    <div className="music-lab-result-heading"><div><span className="music-eyebrow">{'GRAU '+(degree+1)}</span><h3>{selected.name+' · '+selected.quality}</h3></div><span className="music-formula">{(sevenths?'1ª · 3ª · 5ª · 7ª':'1ª · 3ª · 5ª')+' a partir de '+notes[degree]}</span></div>
    <NoteStrip notes={selected.notes} degrees={sevenths?['fundamental','terça','quinta','sétima']:['fundamental','terça','quinta']} midi={selected.midi} />
    <div className="music-actions"><Listen steps={[{notes:selected.midi,at:0,duration:2}]}>Ouvir o acorde selecionado</Listen><Listen quiet steps={field.map((chord,i)=>({notes:chord.midi,at:i*0.85,duration:0.75}))}>Ouvir os sete graus</Listen></div>
    <Prompt>Escolha o sétimo grau do campo maior. Sua tríade é diminuta; com a sétima diatônica, ela é meio diminuta. A sequência de tons e semitons constrói a escala; a qualidade de cada acorde resulta das notas empilhadas.</Prompt>
    <p className="music-small">“1ª, 3ª e 5ª” acima contam a partir da fundamental de cada acorde. Nas cifras, maj7 equivale à sétima maior, também escrita 7M.</p>
  </>;
}
function MinorLab() {
  const [root,setRoot]=useState('A'),[form,setForm]=useState(0),[classicalDescent,setClassicalDescent]=useState(true);
  const selected=MINOR_FORMS[form],notes=spellHeptatonic(root,selected.intervals),midi=selected.intervals.map(n=>noteToMidi(root)+n);
  const descentIntervals=form===2&&classicalDescent?MINOR_FORMS[0].intervals:selected.intervals;
  const descent=[noteToMidi(root)+12,...[...descentIntervals].reverse().map(n=>noteToMidi(root)+n)];
  return <>
    <div className="music-lab-controls"><RootSelect value={root} onChange={setRoot} label="Tônica menor" roots={['A','D','E','F#','C','G']} /></div>
    <div className="music-choice-row" role="group" aria-label="Forma da escala menor">{MINOR_FORMS.map((entry,i)=><button key={entry.id} type="button" aria-pressed={form===i} onClick={()=>setForm(i)}>{entry.name}</button>)}</div>
    <NoteStrip notes={notes} highlighted={[5,6]} midi={midi} />
    <p className="music-scale-line"><strong>Passos:</strong> {scaleSteps(selected.intervals).join(' — ')}</p>
    {form===2&&<label className="music-checkbox"><input type="checkbox" checked={classicalDescent} onChange={e=>setClassicalDescent(e.target.checked)} /> Descida do modelo clássico: usar a menor natural</label>}
    <div className="music-actions"><Listen steps={sequence([...midi,noteToMidi(root)+12])}>Ouvir subindo</Listen><Listen quiet steps={sequence(descent)}>Ouvir descendo</Listen></div>
    <Prompt>{form===0?'A menor natural tem sexta e sétima menores. Compare a sensação de chegada com a forma harmônica.':form===1?'A menor harmônica eleva o sétimo grau da menor natural. Entre o sexto e o sétimo aparece uma segunda aumentada: três semitons.':'A forma melódica ascendente eleva sexto e sétimo graus. No modelo clássico, a descida costuma usar a menor natural; no uso comum do jazz, a forma ascendente é mantida nas duas direções.'}</Prompt>
    <p className="music-small">As formas do menor fornecem recursos melódicos e harmônicos. Não é preciso tratar cada mudança de nota como uma nova tonalidade.</p>
  </>;
}
function ModesLab() {
  const id=useId(),[root,setRoot]=useState('C'),[modeIndex,setModeIndex]=useState(2),[drone,setDrone]=useState(true);
  const mode=MODES[modeIndex],notes=spellHeptatonic(root,mode.intervals),base=noteToMidi(root),midi=mode.intervals.map(n=>base+n);
  const phrase=[0,mode.colorIndex,2,mode.colorIndex,1,0].map(i=>midi[i]);
  const steps:SoundStep[]=[...(drone?[{notes:[base-12],at:0,duration:5.3,drone:true}]:[]),...sequence(phrase,0.8).map(step=>({...step,at:step.at+0.3,duration:0.65}))];
  return <>
    <div className="music-lab-controls"><RootSelect value={root} onChange={setRoot} label="Centro que permanece" roots={['C','D','E','F','G','A','Bb']} />
      <label className="music-field" htmlFor={id}><span>Modo</span><select id={id} value={modeIndex} onChange={e=>setModeIndex(Number(e.target.value))}>{MODES.map((entry,i)=><option key={entry.id} value={i}>{entry.name}</option>)}</select></label>
      <label className="music-checkbox"><input type="checkbox" checked={drone} onChange={e=>setDrone(e.target.checked)} /> Sustentar o centro no grave</label></div>
    <div className="music-mode-banner"><div><span>Centro sonoro</span><strong>{root}</strong></div><ArrowRight size={23} aria-hidden="true" /><div><span>Cor em destaque</span><strong>{notes[mode.colorIndex]}</strong><small>{mode.colorLabel}</small></div></div>
    <NoteStrip notes={notes} highlighted={[mode.colorIndex]} midi={midi} />
    <div className="music-actions"><Listen steps={steps}>{'Ouvir frase em '+root+' '+mode.name.toLowerCase()}</Listen>
      <Listen quiet steps={[...(drone?[{notes:[base-12],at:0,duration:5.2,drone:true}]:[]),...sequence([...midi,base+12],0.55).map(step=>({...step,at:step.at+0.2}))]}>Ouvir a coleção de notas</Listen></div>
    <Prompt>{mode.explanation} Cante a nota do centro antes e depois do exemplo. Troque apenas o modo e perceba a diferença.</Prompt>
    <p><strong>{'Mesma coleção de '+parentMajor(root,mode)+' maior.'}</strong> Aqui, o centro é {root}. A coleção de notas, por si só, não estabelece o centro: o baixo, as chegadas, as durações e a harmonia participam dessa percepção.</p>
    <p className="music-small">Por exemplo, C frígio usa C–Db–Eb–F–G–Ab–Bb, a coleção de Ab maior. Tocar as notas de C maior começando em E não basta, sozinho, para criar um contexto em E frígio. Um gênero musical também não se reduz a um único modo.</p>
  </>;
}
function HarmonicColorLab() {
  const [exampleIndex,setExampleIndex]=useState(0),example=COLOR_EXAMPLES[exampleIndex];
  const notes=example.intervals.map((intervals,i)=>intervals.map(n=>noteToMidi(example.roots[i],3)+n));
  const focusNotes=spellChord(example.roots[example.focus],example.intervals[example.focus]);
  return <>
    <div className="music-choice-row" role="group" aria-label="Exemplo harmônico">{COLOR_EXAMPLES.map((entry,i)=><button key={entry.id} type="button" aria-pressed={exampleIndex===i} onClick={()=>setExampleIndex(i)}>{entry.name}</button>)}</div>
    <div className="music-progression" aria-label="Progressão autoral em lá maior">{example.chords.map((chord,i)=><span key={i} className={i===example.focus?'is-characteristic':''}><small>{i+1}</small><strong>{chord}</strong></span>)}</div>
    <Listen steps={notes.map((chord,i)=>({notes:chord,at:i*1.15,duration:1.02}))}>Ouvir o contexto e a chegada</Listen>
    <p className="music-small">{'Acorde em foco: '+example.chords[example.focus]+' = '+focusNotes.join(' · ')+'. O exemplo começa e retorna a A.'}</p>
    <Quiz key={example.id} question="Qual leitura explica melhor o acorde destacado neste contexto?" options={['Dominante secundária: prepara outro grau.','Empréstimo do menor paralelo.','Uma modulação já comprovada apenas pela nota de fora.']} correctIndex={example.correct} explanation={example.explanation} />
    <Prompt>Ouça o antes e o depois. Uma nota de fora do campo não basta para decidir a função. Para reconhecer modulação, procure um novo centro afirmado pelo contexto, pelas cadências e pela continuidade da música.</Prompt>
  </>;
}
function ContinuationLab() {
  const [root,setRoot]=useState('D'),[ending,setEnding]=useState(0),major=MODES[0].intervals;
  const pattern=ending===0?[0,2,4,3,1,0]:[0,2,4,5,4,0],notes=pattern.map(degree=>spellDegree(root,major[degree],degree)),midi=pattern.map(degree=>noteToMidi(root)+major[degree]);
  return <>
    <div className="music-lab-controls"><RootSelect value={root} onChange={setRoot} label="Destino do exemplo autoral" roots={['C','D','E','F','G','A','Bb']} />
      <div className="music-choice-row" role="group" aria-label="Escolha o final da frase"><button type="button" aria-pressed={ending===0} onClick={()=>setEnding(0)}>Final A</button><button type="button" aria-pressed={ending===1} onClick={()=>setEnding(1)}>Final B</button></div></div>
    <p className="music-scale-line"><strong>Ideia em graus:</strong> {pattern.map(n=>n+1).join(' → ')}</p>
    <NoteStrip notes={notes} degrees={pattern.map(n=>String(n+1))} midi={midi} />
    <div className="music-actions"><Listen quiet steps={sequence(pattern.map(degree=>noteToMidi('C')+major[degree]),0.6)}>Ouvir a ideia em C</Listen><Listen steps={sequence(midi,0.6)}>{'Ouvir a ideia em '+root}</Listen></div>
    <Prompt>Cante a ideia antes de procurar as notas. Ao transportar este exercício, preserve os intervalos. Depois escolha um final e experimente criar uma pequena resposta no violão.</Prompt>
    <div className="music-next-listening"><span className="music-eyebrow">PRÓXIMAS ESCUTAS</span><h3>Aprender uma tradição começa por escutá-la.</h3>
      <p>Ao explorar músicas da Índia, da China ou do Japão, escolha um artista e uma tradição específicos. Procure aulas e apresentações de músicos dessa tradição; observe afinação, ritmo, timbre, ornamentação e contexto.</p>
      <ul><li>Quem interpreta e como a tradição se chama?</li><li>Que detalhe você consegue ouvir, cantar e descrever?</li><li>O que a escrita usada neste curso explica e o que ela deixa de representar?</li></ul>
      <p className="music-small">Uma escala isolada não representa a música de um país. Leve uma gravação e essas perguntas para o próximo encontro com seu professor.</p>
    </div>
  </>;
}
