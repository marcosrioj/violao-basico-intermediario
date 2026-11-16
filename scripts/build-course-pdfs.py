#!/usr/bin/env python3
"""Build both complete Violão Vivo books from the versioned course sources.

Requires reportlab and pypdf. Run from any directory; books are published in
materials. The archival pages are preserved from the current published books.
The generated page manifest is consumed by the app, so rerun after content edits.
"""

from __future__ import annotations

import argparse
import hashlib
import html
from io import BytesIO
import json
from pathlib import Path
import re
from tempfile import TemporaryDirectory

from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    CondPageBreak,
    Flowable,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    XPreformatted,
)
from reportlab.platypus.tableofcontents import TableOfContents


ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "src/content"
MATERIALS = ROOT / "materials"
TMP = ROOT / "tmp/pdfs"
PAGE_W, PAGE_H = A4
MARGIN = 18 * mm
TEXT_W = PAGE_W - 2 * MARGIN
GREEN = colors.HexColor("#173F35")
SAGE = colors.HexColor("#5B796B")
INK = colors.HexColor("#24372F")
CREAM = colors.HexColor("#F4F2EB")
LINE = colors.HexColor("#D9E2DB")
WHITE = colors.white
SOURCE_NAMES = ["course-data", "teacher-data", "tempo-research", "technique-data", "lesson-enrichment", "teacher-enrichment", "lesson-journey"]


def load(name):
    return json.loads((CONTENT / f"{name}.json").read_text())


def clean(value):
    """Keep Portuguese, but normalize exotic hyphens unsupported in some readers."""
    return re.sub("[\u2010-\u2014\u2212]", "-", str(value))


def esc(value):
    return html.escape(clean(value), quote=False)


def register_fonts():
    font_dir = Path("/usr/share/fonts/truetype/dejavu")
    for name, filename in [
        ("Vivo", "DejaVuSans.ttf"),
        ("VivoBold", "DejaVuSans-Bold.ttf"),
        ("VivoMono", "DejaVuSansMono.ttf"),
    ]:
        if not (font_dir / filename).exists():
            raise SystemExit(f"Missing font {font_dir / filename}")
        pdfmetrics.registerFont(TTFont(name, str(font_dir / filename)))
    pdfmetrics.registerFontFamily("Vivo", normal="Vivo", bold="VivoBold", italic="Vivo", boldItalic="VivoBold")


def styles():
    s = getSampleStyleSheet()
    configs = {
        "body": dict(fontName="Vivo", fontSize=10.2, leading=14.2, textColor=INK, spaceAfter=6),
        "small": dict(fontName="Vivo", fontSize=8.8, leading=12, textColor=INK, spaceAfter=4),
        "micro": dict(fontName="Vivo", fontSize=8, leading=11, textColor=SAGE, spaceAfter=4),
        "h1": dict(fontName="VivoBold", fontSize=21, leading=27, textColor=GREEN, spaceAfter=13, keepWithNext=True),
        "h2": dict(fontName="VivoBold", fontSize=15, leading=20, textColor=GREEN, spaceBefore=10, spaceAfter=9, keepWithNext=True),
        "h3": dict(fontName="VivoBold", fontSize=11, leading=15.5, textColor=GREEN, spaceBefore=8, spaceAfter=4, keepWithNext=True),
        "study": dict(fontName="VivoBold", fontSize=13, leading=18, textColor=GREEN, spaceBefore=10, spaceAfter=8, keepWithNext=True),
        "eyebrow": dict(fontName="VivoBold", fontSize=8.5, leading=12, textColor=SAGE, spaceAfter=8, keepWithNext=True),
        "cover": dict(fontName="VivoBold", fontSize=36, leading=43, textColor=GREEN, spaceAfter=22),
        "subtitle": dict(fontName="Vivo", fontSize=18, leading=25, textColor=GREEN, spaceAfter=20),
        "table": dict(fontName="Vivo", fontSize=8.6, leading=12, textColor=INK, spaceAfter=0),
        "tablehead": dict(fontName="VivoBold", fontSize=8.5, leading=11.5, textColor=WHITE, spaceAfter=0),
        "mono": dict(fontName="VivoMono", fontSize=8.3, leading=11.5, textColor=INK, spaceAfter=10),
        "toc0": dict(fontName="VivoBold", fontSize=10, leading=15, textColor=GREEN, spaceBefore=8, leftIndent=0, firstLineIndent=0),
        "toc1": dict(fontName="Vivo", fontSize=9.2, leading=13.2, textColor=INK, spaceBefore=3, leftIndent=12, firstLineIndent=0),
        "toc2": dict(fontName="Vivo", fontSize=8.8, leading=12.5, textColor=INK, spaceBefore=3, leftIndent=24, firstLineIndent=0),
    }
    return {name: ParagraphStyle(name, **props) for name, props in configs.items()}


STYLES = {}


def p(text, style="body", markup=False):
    return Paragraph(text if markup else esc(text).replace("\n", "<br/>"), STYLES[style])


def heading(text, level=1, anchor=None, toc=True, category=None, item_id=None, toc_level=None, style=None):
    item = p(text, style or f"h{level}")
    if anchor:
        item._anchor = anchor
        item._toc = toc
        item._toclevel = min(level - 1, 1) if toc_level is None else toc_level
        item._category = category
        item._item_id = item_id
    return item


def bullets(items, numbered=False, style="body"):
    result = []
    for i, item in enumerate(items, 1):
        lead = f"{i}." if numbered else "•"
        result.append(p(f"<b>{lead}</b> {esc(item)}", style, markup=True))
    return result


def label(text, body, style="body"):
    return p(f"<b>{esc(text)}</b> {esc(body)}", style, markup=True)


def link(text, dest, external=False):
    href = dest if external else f"#{dest}"
    return f'<a href="{html.escape(href, quote=True)}" color="#173F35"><u>{esc(text)}</u></a>'


def study_link(study, page_refs, with_title=True):
    page = page_refs.get("studies", {}).get(study["id"], "000")
    text = study["id"].upper() + (f" · {study['title']}" if with_title else "")
    return link(f"{text} · p. {page}", study["id"])


def box(title, text):
    t = Table([[p(title, "h3"),], [p(text),]], colWidths=[TEXT_W - 22])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CREAM),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 11),
        ("RIGHTPADDING", (0, 0), (-1, -1), 11),
        ("TOPPADDING", (0, 0), (-1, 0), 5),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 7),
    ]))
    return [KeepTogether([t]), Spacer(1, 9)]


def tabular(headers, rows, widths=None):
    content = [[p(x, "tablehead") for x in headers]]
    content += [[p(x, "table") for x in row] for row in rows]
    widths = widths or [TEXT_W / len(headers)] * len(headers)
    table = Table(content, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GREEN),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, CREAM]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, GREEN),
        ("LINEBELOW", (0, 1), (-1, -1), 0.3, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return [table, Spacer(1, 9)]


class ChordDiagram(Flowable):
    """Vector diagram; source strings run sixth to first, left to right."""

    def __init__(self, name, chord, width=94, height=125):
        Flowable.__init__(self)
        self.name, self.chord = name, chord
        self.width, self.height = width, height

    def draw(self):
        c = self.canv
        w = self.width
        c.setFillColor(GREEN)
        c.setFont("VivoBold", 11)
        c.drawCentredString(w / 2, self.height - 13, self.name)
        x0, y0 = (w - 55) / 2, self.height - 40
        dx, dy = 11, 13
        positive = [f for f in self.chord["frets"] if isinstance(f, int) and f > 0]
        start = 1 if not positive or max(positive) <= 4 else min(positive)
        c.setStrokeColor(SAGE)
        c.setLineWidth(0.5)
        for i in range(6):
            c.line(x0 + i * dx, y0, x0 + i * dx, y0 - 4 * dy)
        for i in range(5):
            c.setLineWidth(2 if i == 0 and start == 1 else 0.5)
            c.line(x0, y0 - i * dy, x0 + 55, y0 - i * dy)
        if start > 1:
            c.setFont("Vivo", 7)
            c.drawRightString(x0 - 3, y0 - dy / 2 - 2, str(start))
        c.setLineCap(1)
        for fret, a, b in self.chord.get("barres", []):
            y = y0 - (fret - start + .5) * dy
            c.setStrokeColor(GREEN)
            c.setLineWidth(7)
            c.line(x0 + a * dx, y, x0 + b * dx, y)
        for i, fret in enumerate(self.chord["frets"]):
            x = x0 + i * dx
            c.setFillColor(GREEN)
            if fret is None or fret == 0:
                c.setFont("Vivo", 8)
                c.drawCentredString(x, y0 + 6, "x" if fret is None else "o")
            else:
                y = y0 - (fret - start + .5) * dy
                c.circle(x, y, 4.3, stroke=0, fill=1)
                finger = self.chord["fingers"][i]
                if finger:
                    c.setFillColor(WHITE)
                    c.setFont("VivoBold", 5.8)
                    c.drawCentredString(x, y - 2, str(finger))
        c.setFillColor(SAGE)
        c.setFont("Vivo", 7)
        for i, string in enumerate([6, 5, 4, 3, 2, 1]):
            c.drawCentredString(x0 + i * dx, y0 - 4 * dy - 10, str(string))
        c.setFont("VivoMono", 7)
        c.drawCentredString(w / 2, 8, self.chord.get("code", ""))


def chord_grid(names, all_chords, per_row=5):
    width = TEXT_W / per_row
    rows = []
    for start in range(0, len(names), per_row):
        row = [ChordDiagram(name, all_chords[name], width=width - 4) for name in names[start:start + per_row]]
        row += [""] * (per_row - len(row))
        rows.append(row)
    if not rows:
        return []
    table = Table(rows, colWidths=[width] * per_row, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 2),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return [table, Spacer(1, 5)]


class BookTemplate(BaseDocTemplate):
    def __init__(self, filename, audience, **kwargs):
        super().__init__(filename, pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                         topMargin=20 * mm, bottomMargin=19 * mm, **kwargs)
        self.audience = audience
        self.page_map = {"lessons": {}, "studies": {}, "modules": {}, "charts": {}, "theory": {}}
        self.chapter = "Violão Vivo"
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height,
                      leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="normal")
        self.addPageTemplates(PageTemplate(id="normal", frames=frame, onPage=self.page_chrome))

    def page_chrome(self, canvas, doc):
        canvas.saveState()
        if doc.page != 1:
            canvas.setFont("Vivo", 8)
            canvas.setFillColor(SAGE)
            canvas.drawString(MARGIN, PAGE_H - 12 * mm, f"VIOLÃO VIVO  /  {self.audience.upper()}")
            canvas.setStrokeColor(LINE)
            canvas.setLineWidth(.45)
            canvas.line(MARGIN, 14 * mm, PAGE_W - MARGIN, 14 * mm)
            canvas.setFont("Vivo", 7.6)
            canvas.drawString(MARGIN, 9.5 * mm, "Ouvir · tentar · comparar · aplicar · retomar")
            canvas.drawRightString(PAGE_W - MARGIN, 9.5 * mm, str(doc.page))
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if hasattr(flowable, "_anchor"):
            key = flowable._anchor
            title = flowable.getPlainText()
            self.canv.bookmarkHorizontalAbsolute(key, top=self.frame._y + flowable.height + flowable.getSpaceAfter())
            level = flowable._toclevel
            self.canv.addOutlineEntry(title, key, level=level, closed=level == 0)
            if flowable._toc:
                self.notify("TOCEntry", (level, esc(title), self.page, key))
            category = flowable._category
            if category:
                self.page_map[category][flowable._item_id] = self.page


def cover(audience):
    student = audience == "aluno"
    return [
        Spacer(1, 25 * mm),
        p("FORMAÇÃO MUSICAL · NOVEMBRO 2026", "eyebrow"),
        p("Violão Vivo", "cover"),
        p("Curso do aluno" if student else "Manual do professor", "subtitle"),
        p("Do primeiro acorde à autonomia musical", "h2"),
        Spacer(1, 8 * mm),
        p("13 módulos de repertório\n39 aulas progressivas\n27 estudos integrados às aulas\n9 eixos para consulta", "subtitle"),
        Spacer(1, 6 * mm),
        p("Uma formação que conecta escuta, execução, compreensão e prática. "
          + ("Cada estudo prepara uma decisão que você pode ouvir na música." if student else
             "Planos de aula, demonstrações, intervenções e critérios para observar a aprendizagem.")),
        Spacer(1, 10 * mm),
        p("Os arranjos, as aulas e os materiais integrais da edição 5 permanecem disponíveis neste volume. "
          "Os novos estudos são autorais e têm fontes identificadas. A sequência se ajusta às evidências de aprendizagem.", "small"),
        PageBreak(),
    ]


def opening(course, technique, lesson_extra, teacher_extra, audience):
    student = audience == "aluno"
    story = cover(audience)
    story += [heading("Como usar esta edição", anchor="how-to")]
    story += [p(lesson_extra["introduction"] if student else teacher_extra["introduction"])]
    story += box("Uma sequência para ouvir, entender e tocar", "Percorra as 39 aulas na ordem dos 13 módulos. "
                 "A técnica aparece dentro da aula em que começa a ser trabalhada, seguida da aplicação no repertório. "
                 "Nas retomadas, o foco da aula indica o que recuperar e fornece a página da explicação completa. "
                 "T1 a T9 organizam o índice de consulta; a ordem de aprendizagem é a das aulas.")
    story += bullets([
        "Escolha um objetivo observável, ouça o resultado esperado e tente uma passagem curta antes de aumentar a dificuldade.",
        "Após compreender um movimento, retome-o em outros dias e experimente sem consultar a resposta primeiro. Ajuste o intervalo ao que consegue lembrar e executar.",
        "Conte e mantenha a forma mesmo quando simplificar os ataques. Um andamento confortável é um ponto de partida, não uma nota ou uma comparação com outro aluno.",
        "Registre uma evidência e um próximo ajuste. Concluir uma leitura ou marcar uma aula não demonstra, por si só, domínio instrumental.",
    ])
    story += [p("A proposta semanal organiza o trabalho, mas a consolidação pode exigir mais encontros. "
                "Os estudos curtos ocupam parte da prática já planejada; não é necessário acrescentar todos à mesma semana.")]
    story += [heading("O que foi preservado", level=2)]
    story += bullets(course["principles"])
    story += [p("As durações de prática acima registram a organização original. Nesta proposta, use-as como referência flexível, "
                "com pausas e adaptações combinadas com o professor. Ao final do volume, o acervo integral V5 "
                "preserva suas páginas, diagramas e notas editoriais originais. A numeração impressa nesse acervo "
                "é a original; os marcadores do PDF levam diretamente a cada aula.")]
    if student:
        for principle in lesson_extra["practicePrinciples"]:
            story += [heading(principle["title"], level=3), p(principle["text"])]
    else:
        for principle in teacher_extra["teachingPrinciples"]:
            story += [heading(principle["title"], level=3), p(principle["text"])]
            if principle.get("sourceIds"):
                story += [p("Fontes: " + ", ".join(principle["sourceIds"]), "micro")]
        story += [heading("Rubrica para orientar a devolutiva", level=2)]
        for row in teacher_extra["assessment"]:
            story += [heading(row["dimension"], level=3)]
            story += [label("Começando.", row["beginning"]), label("Em desenvolvimento.", row["developing"]), label("Consistente.", row["secure"])]
        story += box("Evidência antes da decisão", "Registre trecho, andamento, apoio utilizado e comportamento observado. "
                     "Compare novas tentativas com registros do próprio aluno. O nível consistente deve aparecer em outra tentativa "
                     "e, quando possível, em outro dia; uma execução isolada não estabelece retenção.")
    story += [PageBreak(), heading("Sumário", anchor="contents", toc=False)]
    toc = TableOfContents()
    toc.levelStyles = [STYLES["toc0"], STYLES["toc1"], STYLES["toc2"]]
    toc.dotsMinLevel = 0
    story += [toc, PageBreak(), heading("Mapa de integração", anchor="integration")]
    story += [p(technique["introduction"])]
    rows = [[m["id"], m["title"], "M" + ", M".join(map(str, m["relatedModules"]))] for m in technique["modules"]]
    story += tabular(["Eixo", "Conteúdo técnico", "Módulos relacionados"], rows, [40, TEXT_W - 158, 118])
    story += [p("A pestana completa começa em M5-A1. Nas 12 primeiras aulas, inclusive F, cada dedo ocupa uma corda; "
                "o F inicial usa xx321x. CAGED e ornamentação aprofundam habilidades preparadas ao longo do repertório.")]
    return story


def tempo_note(song_id, lesson, chart, tempo_data):
    unit = chart["beat_unit"]
    result = f"Andamento de estudo da aula: {lesson['bpm']} BPM por {unit}."
    info = tempo_data.get(song_id)
    if info:
        reference = info.get("reference")
        if reference:
            units = {"quarter": "semínima", "dotted-quarter": "semínima pontuada", "eighth": "colcheia", "half": "mínima"}
            result += f" Referência {'estimada' if info['status'] == 'estimated' else 'documentada'}: {reference['bpm']} BPM por {units.get(reference['unit'], reference['unit'])}."
        result += " " + info.get("note", "")
        if info.get("useAsDefault"):
            result += " Esta referência foi escolhida como padrão de reprodução no aplicativo; o andamento pode ser reduzido para estudar."
    return result


def lesson_sections(course, lesson_extra, teacher_legacy, teacher_extra, technique, tempo_data, journey, audience, page_refs):
    student = audience == "aluno"
    enrichments = {x["lessonId"]: x for x in lesson_extra["lessons"]}
    teaching = {x["lessonId"]: x for x in teacher_extra["lessons"]}
    legacy = {x["lessonId"]: x for x in teacher_legacy["lessons"]}
    studies = {s["id"]: s for module in technique["modules"] for s in module["studies"]}
    journey_by_id = {x["lessonId"]: x for x in journey["lessons"]}
    story = []
    for module in course["modules"]:
        story += [PageBreak(), p(f"REPERTÓRIO · MÓDULO {module['n']:02}", "eyebrow"),
                  heading(module["title"], anchor=f"module-{module['n']}", category="modules", item_id=str(module["n"])),
                  p(module["goal"])]
        for index, lesson in enumerate(x for x in course["lessons"] if x["module"] == module["n"]):
            if index:
                story += [PageBreak()]
            extra, teacher = enrichments[lesson["id"]], teaching[lesson["id"]]
            song = course["songs"][lesson["song"]]
            chart = song["versions"][lesson["version"]]
            story += [heading(f"{lesson['display_id']}  {lesson['title']}", level=2, anchor=lesson["id"], category="lessons", item_id=lesson["id"]),
                      p(f"{song['title']} · {song['artist']} · Tom {chart['key']} · {chart['meter']}", "small")]
            story += box("Objetivo da aula", lesson["goal"])
            story += [p(tempo_note(lesson["song"], lesson, chart, tempo_data), "small")]
            story += [p(link("Abrir gravação identificada", song.get("recording_url", song["listen_url"]), True) + " · " +
                        link("Consultar letra e cifra na fonte", song["lyrics_chords_url"], True), "small", markup=True)]
            story += [p(link("Mapa harmônico completo desta versão", f"chart-{lesson['song']}-{lesson['version']}") + " · " +
                        "Foco: " + esc(lesson["focus"]), "small", markup=True)]
            entries = journey_by_id[lesson["id"]]["techniques"]
            if entries:
                refs = [study_link(studies[item["studyId"]], page_refs, with_title=False) +
                        (" (introdução)" if item["stage"] == "introducao" else " (retomada)") for item in entries]
                story += [p("<b>Técnica nesta aula:</b> " + "; ".join(refs), "small", markup=True)]
            if lesson["review"]:
                story += [heading("Retome antes de começar", level=3), p(lesson["review"])]
            story += [heading("Entenda na própria música", level=3), p(lesson["explain"])]
            if student:
                story += [heading("Aprofunde a compreensão", level=3)]
                story += [p(x) for x in extra["understanding"]]
                story += [heading(extra["workedExample"]["title"], level=3), p(extra["workedExample"]["text"])]
                story += [heading("Formas usadas nesta aula", level=3)]
                story += chord_grid(lesson["chords"], course["chords"])
                story += [p("Da esquerda para a direita: 6ª a 1ª corda. x = não tocar; o = corda solta. "
                            "Os números nos pontos indicam os dedos. O número lateral indica a primeira casa representada.", "micro")]
                story += lesson_technique(entries, studies, audience, page_refs)
                story += [heading("Percurso da aula", level=3)] + bullets(lesson["steps"], numbered=True)
                story += [heading("Experimente com atenção", level=3)] + bullets(extra["guidedPractice"], numbered=True)
                story += [heading("Recupere antes de consultar", level=3), p(lesson["question"]), p(extra["retrieval"]["question"])]
                story += [p(link("Conferir respostas ao final do volume", f"answer-{lesson['id']}"), "small", markup=True)]
                story += [heading("Organize a semana", level=3)]
                for day in extra["weeklyPlan"]:
                    story += [label(f"{day['day']} · {day['title']}.", day["task"])]
                story += [heading("Modelo de uma sessão de prática", level=3),
                          p("Use este modelo dentro do roteiro de quatro dias, ajustando o foco à tarefa do dia. "
                            "Os tempos são sugestões flexíveis; não representam uma carga adicional de estudo.", "small")]
                story += bullets(lesson["practice"])
                tail_start = len(story)
                story += [heading("Observe o que conseguiu", level=3)] + bullets(lesson["checks"] + extra["successCriteria"])
                story += [label("Próximo passo.", extra["nextStep"])]
                story += [p("Data __________  Andamento __________  Apoio utilizado ____________________\n"
                            "Evidência observada __________________________________________________\n"
                            "Ajuste para a próxima tentativa __________________________________________", "small")]
            else:
                story += [heading("Orientação musical da aula", level=3), p(legacy[lesson["id"]]["teacher"])]
                story += [heading("Base conceitual para explicar", level=3)]
                story += [p(x) for x in extra["understanding"]]
                story += [heading("Diagnóstico antes da explicação", level=3), p(teacher["diagnosis"]),
                          heading("Demonstração e escuta orientada", level=3), p(teacher["demonstration"])]
                story += [heading("Condução do encontro de 60 minutos", level=3)]
                story += tabular(["Tempo", "Etapa", "Ação docente"],
                                 [[f"{x['minutes']} min", x["title"], x["action"]] for x in teacher["sequence"]],
                                 [48, 105, TEXT_W - 153])
                story += [heading("Exemplo para explicar e tocar", level=3), p(extra["workedExample"]["title"]), p(extra["workedExample"]["text"])]
                story += lesson_technique(entries, studies, audience, page_refs)
                story += [heading("Tarefa instrumental do aluno", level=3)] + bullets(lesson["steps"], numbered=True)
                story += [heading("Prática guiada do aluno", level=3)] + bullets(extra["guidedPractice"], numbered=True)
                story += [heading("Intervenha sobre uma dificuldade", level=3),
                          label("Sinal a observar.", teacher["commonDifficulty"]), label("Intervenção.", teacher["intervention"]),
                          label("Se precisar de apoio.", teacher["easier"]), label("Se houver prontidão.", teacher["extension"])]
                story += [heading("Avaliação e devolutiva", level=3), p(teacher["observation"]),
                          label("Pergunta de devolutiva.", teacher["feedbackPrompt"]), label("Verificação posterior.", teacher["transferCheck"])]
                story += bullets(lesson["checks"] + extra["successCriteria"])
                story += [heading("Perguntas e respostas para mediação", level=3),
                          label("Pergunta da aula.", lesson["question"]), label("Resposta.", lesson["answer"]),
                          label("Recuperação.", extra["retrieval"]["question"]), label("Resposta esperada.", extra["retrieval"]["answer"])]
                tail_start = len(story)
                story += [heading("Prática entre os encontros", level=3)]
                for day in extra["weeklyPlan"]:
                    story += [label(f"{day['day']} · {day['title']}.", day["task"])]
                story += [p("Referências pedagógicas: " + ", ".join(teacher["sourceIds"]), "micro")]
            if lesson["theory_refs"]:
                story += [p("<b>Consultas:</b> " + " · ".join(link(ref, f"theory-{ref}") for ref in lesson["theory_refs"]), "small", markup=True)]
            pages = lesson["studentPages"] if student else legacy[lesson["id"]]["teacherPages"]
            story += [p("Acervo integral V5: páginas originais " + ", ".join(map(str, pages)) + ". Use os marcadores do PDF para abrir o material preservado.", "micro")]
            story[tail_start:] = [KeepTogether(story[tail_start:])]
    return story


def integrated_study(study, audience):
    """Print the complete study once, nested within its introductory lesson."""
    story = [heading(f"{study['id'].upper()}  {study['title']}", level=3,
                     anchor=study["id"], category="studies", item_id=study["id"],
                     toc_level=2, style="study"),
             label("Ao final do percurso deste estudo.", study["goal"]),
             label("Antes de praticar.", "; ".join(study["prerequisites"]))]
    story += [p(x) for x in study["explanation"]]
    example = study["workedExample"]
    story += [heading(example["title"], level=3), p(example["text"])]
    if example.get("tab"):
        max_line = max(len(x) for x in example["tab"].splitlines())
        mono_style = STYLES["mono"]
        if max_line > 90:
            mono_style = ParagraphStyle("long-tab", parent=mono_style, fontSize=7, leading=10)
        story += [XPreformatted(esc(example["tab"]), mono_style)]
    story += [heading("Prática guiada do estudo", level=3)] + bullets(study["steps"], numbered=True)
    story += [heading("Ajuste a dificuldade", level=3), label("Apoio.", study["easier"]), label("Ampliação.", study["harder"])]
    story += [heading("Escute o problema e ajuste", level=3)]
    for mistake in study["mistakes"]:
        story += [label(mistake["symptom"], mistake["adjustment"])]
    story += [heading("Critérios de execução do estudo", level=3)] + bullets(study["checks"])
    story += [heading("Lembre antes de abrir a resposta", level=3), p(study["retrieval"]["question"])]
    if audience == "professor":
        story += [label("Resposta esperada.", study["retrieval"]["answer"])]
    else:
        story += [p(link("Conferir resposta", f"answer-{study['id']}"), "small", markup=True)]
    tail_start = len(story)
    story += [heading("Retome em outros momentos", level=3)] + bullets(study["spacing"])
    if study["relatedLessons"]:
        story += [p("<b>Conexões no repertório:</b> " + " · ".join(link(x.upper(), x) for x in study["relatedLessons"]), "small", markup=True)]
    story += [p("Fontes de consulta: " + ", ".join(study["sourceIds"]), "micro")]
    story[tail_start:] = [KeepTogether(story[tail_start:])]
    return story


def lesson_technique(entries, studies, audience, page_refs):
    if not entries:
        return []
    story = [heading("Prepare a técnica e leve para a música", level=3),
             p("Siga o foco de cada etapa abaixo dentro do tempo de prática da aula. "
               "Na introdução, a explicação completa fica aqui para acompanhar as próximas retomadas; "
               "as ampliações entram conforme a prontidão e os pré-requisitos.", "small")]
    for item in entries:
        study = studies[item["studyId"]]
        story += [CondPageBreak(150), Spacer(1, 8)]
        if item["stage"] == "introducao":
            story += [p(f"INTRODUÇÃO · {study['id'].upper()}", "eyebrow"),
                      label("Foco nesta aula.", item["focus"])]
            story += integrated_study(study, audience)
        else:
            story += [heading(f"Retomada · {study['id'].upper()} · {study['title']}", level=3),
                      p(item["focus"]),
                      p("Tente recuperar o movimento ou a explicação antes de consultar. "
                        "Se precisar de apoio, volte ao estudo completo e depois repita o trecho musical.", "small"),
                      p(study_link(study, page_refs), "small", markup=True)]
    story += [heading("Aplique no repertório desta aula", level=3),
              p("Retome o trecho indicado e use a técnica no percurso a seguir. "
                "Compare o som com o objetivo da aula e escolha um ajuste observável.")]
    return story


def technical_index(technique, journey, page_refs):
    introductions = {item["studyId"]: lesson["lessonId"] for lesson in journey["lessons"]
                     for item in lesson["techniques"] if item["stage"] == "introducao"}
    story = [PageBreak(), heading("Índice de técnica e compreensão", anchor="technical-studies"),
             p("As explicações completas dos 27 estudos estão inseridas nas aulas em que são introduzidas. "
               "Use este índice para reencontrar o conceito, a primeira aplicação e as retomadas. "
               "As perguntas de recuperação aparecem antes do caderno de respostas; tente explicar ou tocar antes de conferir.")]
    for module in technique["modules"]:
        story += [CondPageBreak(230), heading(f"{module['id']}  {module['title']}", level=2, anchor=module["id"]),
                  p(module["introduction"])]
        story += box("Objetivo do eixo", module["goal"])
        story += [label("Preparação.", "; ".join(module["prerequisites"])),
                  p("Conexões: " + ", ".join(f"módulo {n}" for n in module["relatedModules"]), "small")]
        for study in module["studies"]:
            intro = introductions[study["id"]]
            reviews = [lesson["lessonId"] for lesson in journey["lessons"]
                       if any(x["studyId"] == study["id"] and x["stage"] == "retomada" for x in lesson["techniques"])]
            row = [p(study_link(study, page_refs), "small", markup=True),
                   p("<b>Introdução:</b> " + link(intro.upper(), intro) +
                     (". <b>Retomadas:</b> " + " · ".join(link(x.upper(), x) for x in reviews) if reviews else ""), "small", markup=True)]
            story += [KeepTogether(row)]
    return story


def chart_sections(course, tempo_data):
    story = [PageBreak(), heading("Mapas harmônicos do repertório", anchor="charts"),
             p("Cada caixa representa um compasso. O número entre parênteses indica pulsos de duração do acorde. "
               "Em 4/4, cada pulso é uma semínima; em 6/8, cada pulso é uma semínima pontuada com três subdivisões. "
               "As mudanças locais de compasso estão indicadas. Siga a ordem e execute as repetições escritas."),
             p("Estes mapas são os arranjos didáticos preservados do curso. As notas de adaptação explicam suas "
               "diferenças em relação à gravação. Letras e melodias comerciais devem ser consultadas nas fontes indicadas.")]
    for song_id, song in course["songs"].items():
        for version, chart in song["versions"].items():
            associated = [x for x in course["lessons"] if x["song"] == song_id and x["version"] == version]
            story += [PageBreak(), heading(f"{song['title']} · {version}", level=2, anchor=f"chart-{song_id}-{version}", category="charts", item_id=f"{song_id}:{version}"),
                      p(f"{song['artist']} · Tom {chart['key']} · {chart['meter']} · Pulso: {chart['beat_unit']}", "small")]
            story += [p("<b>Aulas:</b> " + " · ".join(link(x["display_id"], x["id"]) for x in associated), "small", markup=True)]
            order = " → ".join(f"{x['section']}" + (f" ({x['repeat']} vezes)" if x["repeat"] > 1 else "") for x in chart["order"])
            story += box("Ordem de execução", order)
            for section in chart["sections"]:
                story += [heading(f"{section['id']} · {section['title']}", level=3)]
                cells = []
                for i, bar in enumerate(section["bars"], 1):
                    events = "  ".join(f"{event['chord']} ({event['beats']})" for event in bar["events"])
                    meter = bar.get("meter", chart["meter"])
                    local = " · " + meter if meter != chart["meter"] else ""
                    cells.append(p(f"<b>{section['id']}{i}{local}</b><br/>{esc(events)}", "table", markup=True))
                rows = [cells[i:i + 4] for i in range(0, len(cells), 4)]
                if rows:
                    rows[-1] += [""] * (4 - len(rows[-1]))
                    table = Table(rows, colWidths=[TEXT_W / 4] * 4, hAlign="LEFT")
                    table.setStyle(TableStyle([
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("BOX", (0, 0), (-1, -1), .4, LINE),
                        ("INNERGRID", (0, 0), (-1, -1), .4, LINE),
                        ("BACKGROUND", (0, 0), (-1, -1), CREAM),
                        ("LEFTPADDING", (0, 0), (-1, -1), 7),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                        ("TOPPADDING", (0, 0), (-1, -1), 7),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                    ]))
                    story += [table, Spacer(1, 4)]
            tail_start = len(story)
            story += [heading("Nota da versão", level=3), p(chart["adaptations"], "small")]
            if associated:
                story += [p(tempo_note(song_id, associated[0], chart, tempo_data), "small")]
            story += [p(link("Gravação selecionada", song.get("recording_url", song["listen_url"]), True) + " · " +
                        link("Letra e cifra na fonte", song["lyrics_chords_url"], True), "small", markup=True)]
            story[tail_start:] = [KeepTogether(story[tail_start:])]
    return story


def theory_sections(course):
    story = [PageBreak(), heading("Consultas de teoria", anchor="theory"),
             p("Leia a consulta ligada à tarefa da aula, toque o exemplo e volte à música. "
               "As oito referências da edição anterior permanecem aqui completas.")]
    for reference in course["references"]:
        story += [PageBreak(), heading(f"{reference['id']}  {reference['title']}", level=2, anchor=f"theory-{reference['id']}", category="theory", item_id=reference["id"]),
                  p(reference["lead"])]
        for block in reference["blocks"]:
            story += [heading(block["heading"], level=3), p(block["text"])]
        if reference.get("table"):
            story += tabular(reference["table"]["headers"], reference["table"]["rows"])
        story += [heading("Experimente", level=3), p(reference["exercise"]),
                  p(link("Conferir resposta", f"answer-{reference['id']}"), "small", markup=True)]
        for source in reference["sources"]:
            story += [p(link(source["title"], source["url"], True) if source.get("url") else esc(source["title"]), "micro", markup=True)]
    story += [PageBreak(), heading("Atlas de acordes", anchor="chord-atlas"),
              p("As 52 posições originais permanecem nesta edição. As formas representam escolhas didáticas específicas; "
                "o atlas não autoriza antecipar pestanas nas aulas iniciais. Confira sempre quais cordas podem soar.")]
    for start in range(0, len(course["chords"]), 10):
        if start:
            story += [PageBreak()]
        names = list(course["chords"])[start:start + 10]
        story += chord_grid(names, course["chords"])
        for name in names:
            chord = course["chords"][name]
            story += [label(f"{name}.", f"Notas: {', '.join(chord['notes'])}. Baixo na {chord['bass_string']}ª corda. {chord['tip']}", "small")]
    return story


def answer_sections(course, lesson_extra, technique):
    story = [PageBreak(), heading("Caderno de respostas", anchor="answers"),
             p("Use depois de tentar recuperar a ideia ou executar o exemplo. Compare o raciocínio, "
               "não somente as palavras; leve dúvidas sobre o som ao professor.")]
    extra_by_id = {x["lessonId"]: x for x in lesson_extra["lessons"]}
    for module in course["modules"]:
        story += [heading(f"Respostas do módulo {module['n']}", level=2)]
        for lesson in [x for x in course["lessons"] if x["module"] == module["n"]]:
            story += [heading(lesson["display_id"], level=3, anchor=f"answer-{lesson['id']}", toc=False),
                      label("Aula.", lesson["answer"]), label("Aprofundamento.", extra_by_id[lesson["id"]]["retrieval"]["answer"])]
    story += [PageBreak(), heading("Respostas dos estudos técnicos", level=2)]
    for module in technique["modules"]:
        for study in module["studies"]:
            story += [heading(f"{study['id'].upper()}  {study['title']}", level=3, anchor=f"answer-{study['id']}", toc=False), p(study["retrieval"]["answer"])]
    story += [PageBreak(), heading("Respostas das consultas teóricas", level=2)]
    for reference in course["references"]:
        story += [heading(f"{reference['id']}  {reference['title']}", level=3, anchor=f"answer-{reference['id']}", toc=False), p(reference["answer"])]
    return story


def source_sections(course, technique, teacher_extra, tempo_data):
    story = [PageBreak(), heading("Fontes e critérios editoriais", anchor="sources"),
             p("A ementa pública de Violão do Zero ao Intermediário, de Fábio Lima, orientou a identificação de nove "
               "eixos para aprofundamento. Os textos, exemplos e exercícios complementares foram elaborados para o Violão Vivo; "
               "não constituem uma transcrição nem uma reprodução das aulas do curso de referência."),
             p(link("Ementa pública consultada em 15 de novembro de 2026", "https://promocao.fabiolimacursos.com.br/", True), "small", markup=True),
             p("As fontes musicais fundamentam conceitos e possibilidades de estudo. As pesquisas de aprendizagem "
               "orientam decisões de ensino; seus resultados não demonstram a eficácia deste curso nem garantem um "
               "prazo universal para atingir um nível. Cada fonte informa seu alcance e seus limites.")]
    for title, sources in [("Técnica e teoria musical", technique["sources"]), ("Aprendizagem e ensino", teacher_extra["sources"])]:
        story += [heading(title, level=2)]
        for source in sources:
            story += [heading(f"{source['id']}  {source['title']}", level=3)]
            if source.get("author"):
                story += [p(source["author"], "small")]
            story += [label("Aplicação.", source["scope"], "small"), label("Limite.", source["limitation"], "small")]
            story += [p(link(source["url"], source["url"], True), "micro", markup=True), p("Consulta: " + source["accessed"], "micro")]
    story += [heading("Gravações e andamentos", level=2)]
    for song_id, song in course["songs"].items():
        story += [heading(f"{song['title']} · {song['artist']}", level=3)]
        for source in song["sources"]:
            story += [p(link(source["title"], source["url"], True) if source.get("url") else esc(source["title"]), "small", markup=True)]
            if source.get("evidence"):
                story += [p(source["evidence"], "small")]
        info = tempo_data.get(song_id)
        if info:
            story += [p(info["note"], "small")]
            for source in info["sources"]:
                story += [p(link(source["title"], source["url"], True), "micro", markup=True)]
    return story


def load_archive(document):
    """Reuse the verified archive already embedded in the published book."""
    source = MATERIALS / document["filename"]
    data = source.read_bytes()
    if hashlib.sha256(data).hexdigest() != document["sha256"]:
        raise RuntimeError(f"Published PDF differs from its manifest: {source.name}")
    reader = PdfReader(BytesIO(data))
    start = document["legacyStartPage"] - 1
    count = document["legacyPages"]
    if not (start > 0 and count > 0 and start + count == len(reader.pages) == document["pages"]):
        raise RuntimeError(f"Invalid archive range: {source.name}")
    return {"reader": reader, "start": start, "count": count, "sha256": document["legacySha256"]}


def archive_intro(audience, archive):
    student = audience == "aluno"
    return [PageBreak(), heading("Acervo integral da edição 5", anchor="legacy-intro"),
            p(f"As próximas {archive['count']} páginas reproduzem integralmente o " + ("material do aluno" if student else "manual do professor") +
              " da edição 5, incluindo diagramas, cifras, guias, respostas e referências. "
              "A numeração que aparece nessas páginas é a original."),
            p("Os capítulos anteriores reorganizam a prática para o curso ampliado. Este acervo preserva "
              "todos os detalhes da edição anterior e permite conferir a origem de cada conteúdo. "
              "Os andamentos de referência e as orientações atuais estão nos capítulos atuais; valores antigos "
              "permanecem no acervo como registro da edição original."),
            p("Use os marcadores do PDF para abrir uma aula do acervo. Nas referências do curso, "
              "'página original' indica a numeração impressa no material V5, não a página absoluta deste volume.")]


def append_archive(main_path, target, audience, page_map, course, teacher_legacy, archive):
    student = audience == "aluno"
    main = PdfReader(main_path)
    legacy = archive["reader"]
    archive_start = archive["start"]
    writer = PdfWriter()
    writer.append(main)
    offset = len(writer.pages)
    writer.append(legacy, pages=(archive_start, archive_start + archive["count"]), import_outline=False)
    parent = writer.add_outline_item(title="Acervo V5 integral", page_number=offset)
    teacher_by_id = {x["lessonId"]: x for x in teacher_legacy["lessons"]}
    archive_lessons = {}
    for lesson in course["lessons"]:
        old_page = (lesson["studentPages"] if student else teacher_by_id[lesson["id"]]["teacherPages"])[0]
        absolute_page = offset + old_page
        archive_lessons[lesson["id"]] = absolute_page
        writer.add_outline_item(title=f"V5 {lesson['display_id']} · {lesson['title']}", page_number=absolute_page - 1, parent=parent)
    writer.add_metadata({
        "/Title": f"Violão Vivo - {'Curso do aluno' if student else 'Manual do professor'}",
        "/Author": "Violão Vivo",
        "/Subject": "13 módulos, 39 aulas e 27 estudos técnicos integrados",
        "/Keywords": "violão, educação musical, repertório, aprendizagem, técnica",
    })
    writer.page_mode = "/UseOutlines"
    with target.open("wb") as stream:
        writer.write(stream)
    check = PdfReader(target)
    assert len(check.pages) == offset + archive["count"]
    for index in range(archive["count"]):
        page = legacy.pages[archive_start + index]
        # Preservation is tested against decoded page streams, not serialization.
        assert check.pages[offset + index].get_contents().get_data() == page.get_contents().get_data(), (audience, index)
    return {
        "filename": target.name,
        "pages": len(check.pages),
        "mainPages": offset,
        "legacyStartPage": offset + 1,
        "legacyPages": archive["count"],
        "legacyLessons": archive_lessons,
        **page_map,
        "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
        "legacySha256": archive["sha256"],
    }


def build(audience, archive, work_dir):
    course = load("course-data")
    technique = load("technique-data")
    lesson_extra = load("lesson-enrichment")
    teacher_extra = load("teacher-enrichment")
    teacher_legacy = load("teacher-data")
    tempo_data = load("tempo-research")
    journey = load("lesson-journey")
    ids = {x["id"] for x in course["lessons"]}
    assert len(course["modules"]) == 13 and len(ids) == 39
    assert ids == {x["lessonId"] for x in lesson_extra["lessons"]}
    assert ids == {x["lessonId"] for x in teacher_extra["lessons"]}
    assert len(technique["modules"]) == 9
    assert sum(len(x["studies"]) for x in technique["modules"]) == 27
    assert ids == {x["lessonId"] for x in journey["lessons"]}
    assert len(journey["lessons"]) == 39
    study_ids = {s["id"] for module in technique["modules"] for s in module["studies"]}
    study_lessons = {}
    journey_by_id = {x["lessonId"]: x for x in journey["lessons"]}
    for lesson in course["lessons"]:
        entries = journey_by_id[lesson["id"]]["techniques"]
        assert len({x["studyId"] for x in entries}) == len(entries), lesson["id"]
        for item in entries:
            sid = item["studyId"]
            assert sid in study_ids and item["focus"].strip(), item
            if item["stage"] == "introducao":
                assert sid not in study_lessons, f"Repeated introduction: {sid}"
                study_lessons[sid] = lesson["id"]
            else:
                assert item["stage"] == "retomada" and sid in study_lessons, f"Review before introduction: {sid}"
    assert study_ids == set(study_lessons), "Every study must be introduced exactly once."
    for lesson in teacher_extra["lessons"]:
        assert sum(x["minutes"] for x in lesson["sequence"]) == 60, lesson["lessonId"]
    filename = "Curso_Aluno_Violao_Gospel_v6.pdf" if audience == "aluno" else "Manual_Professor_Violao_Gospel_v6.pdf"
    main_path = work_dir / f"{audience}-main.pdf"
    page_refs = {}
    # Printed page references can change wrapping; converge both them and the TOC.
    for _ in range(5):
        story = opening(course, technique, lesson_extra, teacher_extra, audience)
        story += lesson_sections(course, lesson_extra, teacher_legacy, teacher_extra, technique, tempo_data, journey, audience, page_refs)
        story += technical_index(technique, journey, page_refs)
        story += chart_sections(course, tempo_data)
        story += theory_sections(course)
        story += answer_sections(course, lesson_extra, technique)
        story += source_sections(course, technique, teacher_extra, tempo_data)
        story += archive_intro(audience, archive)
        doc = BookTemplate(str(main_path), audience, title=f"Violão Vivo - {audience}", author="Violão Vivo")
        doc.multiBuild(story)
        if doc.page_map == page_refs:
            break
        page_refs = doc.page_map
    else:
        raise RuntimeError("Printed page references did not converge.")
    result = append_archive(main_path, work_dir / filename, audience, doc.page_map, course, teacher_legacy, archive)
    assert len(result["lessons"]) == 39
    assert len(result["studies"]) == 27
    assert len(result["charts"]) == sum(len(song["versions"]) for song in course["songs"].values())
    ordered_lessons = [lesson["id"] for lesson in course["lessons"]]
    for sid, lesson_id in study_lessons.items():
        index = ordered_lessons.index(lesson_id)
        after = result["lessons"][ordered_lessons[index + 1]] if index + 1 < len(ordered_lessons) else result["mainPages"] + 1
        assert result["lessons"][lesson_id] <= result["studies"][sid] < after, (sid, lesson_id)
    result["studyLessons"] = study_lessons
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args()
    TMP.mkdir(parents=True, exist_ok=True)
    register_fonts()
    STYLES.update(styles())
    source_hashes = {
        name: hashlib.sha256((CONTENT / f"{name}.json").read_bytes()).hexdigest()
        for name in SOURCE_NAMES
    }
    manifest_path = CONTENT / "pdf-manifest.json"
    previous_manifest_bytes = manifest_path.read_bytes()
    previous_manifest = json.loads(previous_manifest_bytes)
    archives = {key: load_archive(previous_manifest[key]) for key in ["student", "teacher"]}
    with TemporaryDirectory(prefix="build-", dir=TMP) as temporary:
        work_dir = Path(temporary)
        manifest = {"edition": 6, "generatedOn": "2026-11-15"}
        for audience in ["aluno", "professor"]:
            key = "student" if audience == "aluno" else "teacher"
            manifest[key] = build(audience, archives[key], work_dir)
            print(f"{audience}: {manifest[key]['pages']} pages; archive begins at {manifest[key]['legacyStartPage']}", flush=True)
        manifest["sourceHashes"] = {
            name: hashlib.sha256((CONTENT / f"{name}.json").read_bytes()).hexdigest()
            for name in SOURCE_NAMES
        }
        if manifest["sourceHashes"] != source_hashes:
            raise RuntimeError("Course sources changed during PDF generation; rerun after editing finishes.")
        if manifest_path.read_bytes() != previous_manifest_bytes or any(
            hashlib.sha256((MATERIALS / previous_manifest[key]["filename"]).read_bytes()).hexdigest()
            != previous_manifest[key]["sha256"] for key in archives
        ):
            raise RuntimeError("Published PDFs or manifest changed during generation; rerun after editing finishes.")
        staged_manifest = work_dir / "pdf-manifest.json"
        staged_manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
        # Publish only after both books have built and passed their structural checks.
        for key in ["student", "teacher"]:
            filename = manifest[key]["filename"]
            (work_dir / filename).replace(MATERIALS / filename)
        staged_manifest.replace(manifest_path)


if __name__ == "__main__":
    main()
