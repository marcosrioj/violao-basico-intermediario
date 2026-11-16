#!/usr/bin/env python3
"""Import external v5 JSON and PDF text; never execute or copy the source files.
Usage: python3 scripts/import-course.py /path/to/source-directory
Requires Python 3 and Poppler pdftotext, no Python dependencies.
"""
import argparse, hashlib, json, pathlib, re, subprocess
ROOT = pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source_directory', type=pathlib.Path, help='Pasta externa com os três arquivos originais v5.')
SOURCE = parser.parse_args().source_directory.expanduser().resolve()
CONTENT = ROOT/'src/content'
NAMES = ['Guia_Interativo_Aluno_Violao_v5.html','Curso_Aluno_Violao_Gospel_v5.pdf','Manual_Professor_Violao_Gospel_v5.pdf']
missing = [name for name in NAMES if not (SOURCE/name).is_file()]
if missing:
    parser.error('Arquivos originais ausentes na pasta informada: ' + ', '.join(missing))
html=(SOURCE/NAMES[0]).read_text()
match=re.search(r'(?:const|let|var) DATA\s*=\s*(.*?);\s*\(function',html,re.S)
assert match, 'No source JSON found'
data=json.loads(match.group(1))

def lesson_label(m):
    n=int(m.group(1))
    return f'M{(n-1)//3+1}-A{(n-1)%3+1}' if 1<=n<=39 else m.group(0)
def normalize(value, key=''):
    if isinstance(value,dict):
        return {k:normalize(v,k) for k,v in value.items() if k not in ('ref','ref_id','capo')}
    if isinstance(value,list): return [normalize(v,key) for v in value]
    if isinstance(value,str):
        # The source's navigation interprets Axx as lesson references outside focus.
        if key not in ('id','focus','url','source_url','listen_url','lyrics_chords_url','recording_url'):
            value=re.sub(r'\bA(\d{2})\b',lesson_label,value)
        return value
    return value
data=normalize(data)
for song in data['songs'].values():
    for source in song.get('sources', []):
        source.setdefault('title', source.get('role', 'Referência do material'))

def pdf_pages(name):
    output=subprocess.check_output(['pdftotext','-layout',str(SOURCE/name),'-']).decode()
    pages=output.split('\f')
    if not pages[-1].strip():pages.pop()
    return pages
student=pdf_pages(NAMES[1]);teacher=pdf_pages(NAMES[2])

def clean_page(text):
    text=re.sub(r'^VIOLÃO GOSPEL / (?:ALUNO|PROFESSOR)\n','',text)
    text=re.sub(r'\s*Aprender tocando • \d+\s*$','',text)
    text=re.sub(r'\n{3,}','\n\n',text).strip()
    text=re.sub(r'\bM(\d+)\s*·\s*A(\d+)\b',r'M\1-A\2',text)
    return text

def match_lesson(text):
    m=re.search(r'MÓDULO (\d+) (?:• .*? /|·|•) AULA (\d+)',text)
    return f'm{m[1]}-a{m[2]}' if m else None
student_map={};teacher_map={}
for i,t in enumerate(student,1):
    if (lid:=match_lesson(t)):student_map.setdefault(lid,[]).append(i)
for i,t in enumerate(teacher,1):
    if (lid:=match_lesson(t)):teacher_map.setdefault(lid,[]).append(i)
teacher_lessons=[]
for l in data['lessons']:
    l['sourceId']=l['id'];l['id']=l['display_id'].lower();lid=l['id']
    assert lid in student_map and lid in teacher_map, f'Missing PDF lesson {lid}'
    l['studentPages']=student_map[lid]
    l['studentText']='\n\n'.join(clean_page(student[p-1]) for p in student_map[lid])
    teacher_lessons.append({'lessonId':lid,'teacher':l.pop('teacher'),'teacherText':'\n\n'.join(clean_page(teacher[p-1]) for p in teacher_map[lid]),'teacherPages':teacher_map[lid]})

def guide_pages(pages,audience,used):
    skip={p for v in used.values() for p in v}
    out=[]
    for i,text in enumerate(pages,1):
        if i in skip:continue
        cleaned=clean_page(text)
        lines=[l.strip() for l in cleaned.splitlines() if l.strip()]
        title=lines[1] if len(lines)>1 else lines[0]
        out.append({'id':f'{audience}-p{i}','title':title,'text':cleaned,'page':i,'audience':audience})
    return out
student_guides=guide_pages(student,'student',student_map)
teacher_guides=guide_pages(teacher,'teacher',teacher_map)

def write(name,obj):
    (CONTENT/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
manifest={'edition':5,'importedOn':'2026-11-14','counts':{'modules':len(data['modules']),'lessons':len(data['lessons']),'songs':len(data['songs']),'chords':len(data['chords']),'theoryReferences':len(data['references']),'studentPages':len(student),'teacherPages':len(teacher)},'sources':[{'file':name,'sha256':hashlib.sha256((SOURCE/name).read_bytes()).hexdigest()} for name in NAMES]}
assert manifest['counts']['lessons']==39 and manifest['counts']['modules']==13
assert len(student)==130 and len(teacher)==73
assert all(len([l for l in data['lessons'] if l['module']==m])==3 for m in range(1,14))
assert len({l['id'] for l in data['lessons']})==39
for l in data['lessons']:
    v=data['songs'][l['song']]['versions'][l['version']]
    sections={s['id']:s for s in v['sections']}
    beats=0;bars=0
    for part in v['order']:
        assert part['section'] in sections
        for b in sections[part['section']]['bars']:
            total=sum(e['beats'] for e in b['events'])
            assert abs(total-b.get('beats_per_bar',v['beats_per_bar']))<0.00001, l['id']
            assert all(e['chord'] in data['chords'] for e in b['events']),l['id']
            beats+=total*part['repeat'];bars+=part['repeat']
    assert bars==l['total_bars'] and beats==l['total_beats'],l['id']
    assert all(ref in {r['id'] for r in data['references']} for ref in l['theory_refs'])
    if l['n']<=12:assert all(not data['chords'][ch]['barres'] for ch in l['chords'])
assert 'Bm' in data['lessons'][12]['new_chords']
assert not re.search(r'thalles|thales',json.dumps(data,ensure_ascii=False),re.I)
CONTENT.mkdir(parents=True,exist_ok=True)
write('course-data.json',data)
write('chords-data.json',data['chords'])
write('student-guides.json',student_guides)
write('teacher-data.json',{'lessons':teacher_lessons,'guides':teacher_guides})
write('provenance.json',manifest)
print(json.dumps(manifest['counts'],ensure_ascii=False))
