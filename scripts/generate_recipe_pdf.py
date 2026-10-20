#!/usr/bin/env python3
"""Generate the Bela Vitta grape and chia recipe guide."""

from pathlib import Path

from PIL import Image
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
IMAGE_DIR = ROOT / "assets" / "images" / "receita"
TEMP_DIR = ROOT / "tmp" / "pdfs" / "recipe-images"
OUTPUT = ROOT / "output" / "pdf" / "bela-vitta-guia-da-receita.pdf"
MEMBER_URL = "https://zoomfitpro.com/acesso"

PAGE_W, PAGE_H = A4
MARGIN = 42

BRAND = colors.HexColor("#045578")
BRAND_LIGHT = colors.HexColor("#079DDE")
PURPLE = colors.HexColor("#684198")
PURPLE_DARK = colors.HexColor("#3F245F")
PURPLE_SOFT = colors.HexColor("#F4EEFC")
GREEN = colors.HexColor("#03C032")
INK = colors.HexColor("#17212B")
MUTED = colors.HexColor("#6B7280")
LINE = colors.HexColor("#E5E7EB")
SOFT = colors.HexColor("#F7F8FA")
WHITE = colors.white


def register_fonts():
    regular_candidates = [
        Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ]
    bold_candidates = [
        Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ]
    regular = next((p for p in regular_candidates if p.exists()), None)
    bold = next((p for p in bold_candidates if p.exists()), None)
    if regular and bold:
        pdfmetrics.registerFont(TTFont("BelaRegular", str(regular)))
        pdfmetrics.registerFont(TTFont("BelaBold", str(bold)))
        return "BelaRegular", "BelaBold"
    return "Helvetica", "Helvetica-Bold"


FONT_REGULAR, FONT_BOLD = register_fonts()


def make_preview_images():
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    prepared = {}
    for source in sorted(IMAGE_DIR.glob("passo-*.png")):
        target = TEMP_DIR / f"{source.stem}.jpg"
        with Image.open(source) as image:
            image = image.convert("RGB")
            image.thumbnail((1280, 960), Image.Resampling.LANCZOS)
            image.save(target, "JPEG", quality=86, optimize=True, progressive=True)
        prepared[source.stem] = target
    required = {f"passo-{number:02d}-{name}" for number, name in [
        (1, "ingredientes"),
        (2, "agua"),
        (3, "chia"),
        (4, "hidratar"),
        (5, "limao"),
        (6, "servir"),
    ]}
    missing = sorted(required - set(prepared))
    if missing:
        raise FileNotFoundError(f"Imagens da receita ausentes: {', '.join(missing)}")
    return prepared


def paragraph(c, text, x, top, width, size=10, leading=None, color=INK,
              font=FONT_REGULAR, align=TA_LEFT):
    style = ParagraphStyle(
        "inline",
        fontName=font,
        fontSize=size,
        leading=leading or size * 1.35,
        textColor=color,
        alignment=align,
        spaceAfter=0,
        spaceBefore=0,
    )
    p = Paragraph(text, style)
    _, height = p.wrap(width, PAGE_H)
    p.drawOn(c, x, top - height)
    return top - height


def draw_brand(c, light=False):
    text_color = WHITE if light else BRAND
    box_color = colors.Color(1, 1, 1, alpha=.18) if light else BRAND_LIGHT
    c.setFillColor(box_color)
    c.roundRect(MARGIN, PAGE_H - 58, 28, 28, 7, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont(FONT_BOLD, 9)
    c.drawCentredString(MARGIN + 14, PAGE_H - 48.5, "BV")
    c.setFillColor(text_color)
    c.setFont(FONT_BOLD, 12)
    c.drawString(MARGIN + 36, PAGE_H - 49, "BELA VITTA")


def footer(c, page_number, light=False):
    color = colors.Color(1, 1, 1, alpha=.72) if light else MUTED
    c.setFillColor(color)
    c.setFont(FONT_REGULAR, 7.5)
    c.drawString(MARGIN, 24, "Conteúdo culinário e educativo - não é medicamento")
    c.drawRightString(PAGE_W - MARGIN, 24, f"{page_number} / 5")


def draw_image(c, image_path, x, y, width, height):
    c.setFillColor(WHITE)
    c.roundRect(x - 2, y - 2, width + 4, height + 4, 10, fill=1, stroke=0)
    c.drawImage(ImageReader(str(image_path)), x, y, width, height,
                preserveAspectRatio=True, anchor="c", mask="auto")


def bullet(c, text, x, top, width, dot_color=PURPLE, size=9.6):
    c.setFillColor(dot_color)
    c.circle(x + 4, top - 6, 3, fill=1, stroke=0)
    return paragraph(c, text, x + 16, top, width - 16, size=size,
                     leading=size * 1.35, color=INK)


def cover_page(c, images):
    c.setFillColor(PURPLE_DARK)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(PURPLE)
    c.circle(PAGE_W + 50, PAGE_H - 80, 190, fill=1, stroke=0)
    c.setFillColor(BRAND)
    c.circle(-40, 90, 150, fill=1, stroke=0)

    draw_brand(c, light=True)
    c.setFillColor(colors.HexColor("#BFEAFF"))
    c.setFont(FONT_BOLD, 9)
    c.drawString(MARGIN, PAGE_H - 108, "GUIA VISUAL DE PREPARO")

    y = paragraph(c, "Bebida Roxa de<br/>Uva e Chia", MARGIN, PAGE_H - 132,
                  PAGE_W - 2 * MARGIN, size=32, leading=34, color=WHITE,
                  font=FONT_BOLD)
    paragraph(c, "Uma receita caseira com chia hidratada, suco integral de uva e um toque opcional de limão.",
              MARGIN, y - 15, 430, size=12, leading=17,
              color=colors.Color(1, 1, 1, alpha=.82))

    image_w = PAGE_W - 2 * MARGIN
    image_h = image_w * .75
    draw_image(c, images["passo-06-servir"], MARGIN, 104, image_w, image_h)

    c.setFillColor(colors.Color(1, 1, 1, alpha=.12))
    c.roundRect(MARGIN, 62, image_w, 27, 10, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont(FONT_BOLD, 8.5)
    c.drawCentredString(PAGE_W / 2, 71, "1 COPO  |  15-20 MINUTOS  |  6 PASSOS")
    footer(c, 1, light=True)
    c.showPage()


def ingredients_page(c, images):
    draw_brand(c)
    c.setFillColor(PURPLE)
    c.setFont(FONT_BOLD, 9)
    c.drawString(MARGIN, PAGE_H - 98, "ANTES DE COMEÇAR")
    paragraph(c, "Ingredientes e cuidados essenciais", MARGIN, PAGE_H - 116,
              PAGE_W - 2 * MARGIN, size=23, leading=27, font=FONT_BOLD)

    image_w = 215
    image_h = image_w * .75
    draw_image(c, images["passo-01-ingredientes"], MARGIN, 490, image_w, image_h)

    x = 280
    top = 664
    items = [
        "<b>200 ml</b> de água filtrada",
        "<b>100 ml</b> de suco integral de uva roxa 100%, sem açúcar adicionado",
        "<b>1 colher de sopa rasa</b> de chia, aproximadamente 10 g",
        "<b>1/4 de limão</b>, opcional",
        "<b>3 a 4 pedras de gelo</b>, opcionais",
    ]
    for item in items:
        top = bullet(c, item, x, top, PAGE_W - MARGIN - x, size=9.3) - 12

    c.setFillColor(PURPLE_SOFT)
    c.roundRect(MARGIN, 310, PAGE_W - 2 * MARGIN, 138, 14, fill=1, stroke=0)
    c.setFillColor(PURPLE)
    c.setFont(FONT_BOLD, 13)
    c.drawString(MARGIN + 20, 419, "Por que a bebida fica roxa?")
    paragraph(c,
              "A cor vem do <b>suco integral de uva roxa</b>. Ele é misturado à água antes da chia para criar uma base uniforme. A proposta é culinária: não acrescente corante, cápsulas ou produtos medicinais.",
              MARGIN + 20, 400, PAGE_W - 2 * MARGIN - 40, size=10, leading=14,
              color=PURPLE_DARK)

    c.setFillColor(colors.HexColor("#FFF8E7"))
    c.roundRect(MARGIN, 125, PAGE_W - 2 * MARGIN, 150, 14, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#9A5B00"))
    c.setFont(FONT_BOLD, 13)
    c.drawString(MARGIN + 20, 246, "Não pule a hidratação")
    paragraph(c,
              "A chia deve permanecer no líquido até formar um gel leve e uniforme. <b>Não engula sementes secas e depois tome água.</b> Quem não está acostumado a consumir fibras pode começar com meia colher e observar a tolerância.",
              MARGIN + 20, 225, PAGE_W - 2 * MARGIN - 40, size=10, leading=14,
              color=colors.HexColor("#7A4700"))
    paragraph(c,
              "Use um copo ou jarra limpos com capacidade mínima de 400 ml para misturar sem derramar.",
              MARGIN + 20, 165, PAGE_W - 2 * MARGIN - 40, size=8.5, leading=12,
              color=colors.HexColor("#7A4700"))
    footer(c, 2)
    c.showPage()


def steps_page(c, images, page_number, step_data, title):
    draw_brand(c)
    c.setFillColor(PURPLE)
    c.setFont(FONT_BOLD, 9)
    c.drawString(MARGIN, PAGE_H - 98, "PREPARO VISUAL")
    paragraph(c, title, MARGIN, PAGE_H - 116, PAGE_W - 2 * MARGIN,
              size=23, leading=27, font=FONT_BOLD)

    row_top = 672
    row_h = 172
    image_w = 200
    image_h = 150
    text_x = MARGIN + image_w + 28
    text_w = PAGE_W - MARGIN - text_x

    for number, image_key, heading, body in step_data:
        row_y = row_top - row_h
        c.setFillColor(SOFT)
        c.roundRect(MARGIN, row_y, PAGE_W - 2 * MARGIN, row_h - 10, 14, fill=1, stroke=0)
        draw_image(c, images[image_key], MARGIN + 7, row_y + 6, image_w, image_h)

        c.setFillColor(PURPLE)
        c.circle(text_x + 16, row_top - 34, 16, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont(FONT_BOLD, 11)
        c.drawCentredString(text_x + 16, row_top - 38, str(number))
        c.setFillColor(INK)
        c.setFont(FONT_BOLD, 13)
        c.drawString(text_x + 42, row_top - 39, heading)
        paragraph(c, body, text_x, row_top - 67, text_w, size=9.3,
                  leading=13, color=MUTED)
        row_top -= row_h + 14

    footer(c, page_number)
    c.showPage()


def access_page(c):
    draw_brand(c)
    c.setFillColor(PURPLE)
    c.setFont(FONT_BOLD, 9)
    c.drawString(MARGIN, PAGE_H - 98, "DEPOIS DO PREPARO")
    paragraph(c, "Conservação, segurança e próximos conteúdos", MARGIN,
              PAGE_H - 116, PAGE_W - 2 * MARGIN, size=23, leading=27,
              font=FONT_BOLD)

    c.setFillColor(SOFT)
    c.roundRect(MARGIN, 555, PAGE_W - 2 * MARGIN, 112, 14, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont(FONT_BOLD, 12)
    c.drawString(MARGIN + 18, 637, "Conservação")
    paragraph(c,
              "Prefira consumir logo após o preparo. Se precisar guardar, mantenha em recipiente limpo, tampado e refrigerado por no máximo 24 horas. Mexa novamente antes de servir e descarte se houver mudança incomum de cheiro, sabor ou aparência.",
              MARGIN + 18, 617, PAGE_W - 2 * MARGIN - 36, size=9.2,
              leading=13, color=MUTED)

    c.setFillColor(colors.HexColor("#FFF8E7"))
    c.roundRect(MARGIN, 410, PAGE_W - 2 * MARGIN, 125, 14, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#9A5B00"))
    c.setFont(FONT_BOLD, 12)
    c.drawString(MARGIN + 18, 505, "Aviso importante")
    paragraph(c,
              "Este material é culinário e educativo. A bebida não é medicamento, não trata doenças, não substitui refeições completas, acompanhamento profissional ou medicamentos prescritos. Pessoas com dificuldade para engolir, alergias, condições gastrointestinais, gestantes, lactantes, crianças ou quem usa medicamentos contínuos devem buscar orientação individual.",
              MARGIN + 18, 485, PAGE_W - 2 * MARGIN - 36, size=8.7,
              leading=12, color=colors.HexColor("#7A4700"))

    c.setFillColor(PURPLE_DARK)
    c.roundRect(MARGIN, 144, PAGE_W - 2 * MARGIN, 236, 18, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#BFEAFF"))
    c.setFont(FONT_BOLD, 8.5)
    c.drawString(MARGIN + 20, 351, "CONTEÚDO PÓS-COMPRA")
    paragraph(c, "Continue na área de membros", MARGIN + 20, 330, 330,
              size=19, leading=22, color=WHITE, font=FONT_BOLD)
    paragraph(c,
              "Acesse variações culinárias, lista de compras, materiais de organização e a Calculadora Digital Bela Vitta.",
              MARGIN + 20, 281, 318, size=9.5, leading=13,
              color=colors.Color(1, 1, 1, alpha=.82))

    button_x, button_y, button_w, button_h = MARGIN + 20, 193, 300, 42
    c.setFillColor(GREEN)
    c.roundRect(button_x, button_y, button_w, button_h, 10, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont(FONT_BOLD, 10)
    c.drawCentredString(button_x + button_w / 2, button_y + 15, "ACESSAR MINHA ÁREA DE MEMBROS")
    c.linkURL(MEMBER_URL, (button_x, button_y, button_x + button_w, button_y + button_h), relative=0)

    qr = QrCodeWidget(MEMBER_URL)
    bounds = qr.getBounds()
    qr_size = 108
    drawing = Drawing(qr_size, qr_size, transform=[qr_size / (bounds[2] - bounds[0]), 0,
                                                   0, qr_size / (bounds[3] - bounds[1]), 0, 0])
    drawing.add(qr)
    drawing.drawOn(c, PAGE_W - MARGIN - 130, 215)
    c.setFillColor(colors.Color(1, 1, 1, alpha=.78))
    c.setFont(FONT_REGULAR, 6.8)
    c.drawCentredString(PAGE_W - MARGIN - 76, 199, "Escaneie para acessar")
    c.setFillColor(WHITE)
    c.setFont(FONT_REGULAR, 7.5)
    c.drawString(MARGIN + 20, 166, MEMBER_URL)

    paragraph(c,
              "Referências de segurança: Ministério da Saúde - Desmistificando dúvidas sobre alimentação e nutrição; MedlinePlus - Dietary fiber; Ebserh - orientações sobre dificuldade para engolir.",
              MARGIN, 105, PAGE_W - 2 * MARGIN, size=6.8, leading=9, color=MUTED)
    footer(c, 5)
    c.showPage()


def build_pdf():
    images = make_preview_images()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
    c.setTitle("Bela Vitta - Bebida Roxa de Uva e Chia")
    c.setAuthor("Bela Vitta")
    c.setSubject("Guia visual culinário de bebida de uva e chia hidratada")
    c.setKeywords("Bela Vitta, receita, chia, uva, guia culinário")

    cover_page(c, images)
    ingredients_page(c, images)
    steps_page(c, images, 3, [
        (1, "passo-01-ingredientes", "Organize os ingredientes",
         "Higienize as mãos, o copo e os utensílios. Meça tudo antes de começar."),
        (2, "passo-02-agua", "Monte a base roxa",
         "Coloque 200 ml de água e 100 ml de suco integral de uva no copo ou na jarra."),
        (3, "passo-03-chia", "Adicione a chia",
         "Acrescente uma colher de sopa rasa aos poucos e mexa para evitar que as sementes formem grumos."),
    ], "Passos 1 a 3 - monte a base")
    steps_page(c, images, 4, [
        (4, "passo-04-hidratar", "Hidrate por completo",
         "Misture por 30 segundos. Aguarde 10 minutos, mexa novamente e deixe repousar por mais 5 minutos."),
        (5, "passo-05-limao", "Finalize, se desejar",
         "Quando o gel estiver uniforme, adicione o suco de 1/4 de limão e misture bem."),
        (6, "passo-06-servir", "Sirva com calma",
         "Adicione gelo, mexa uma última vez e consuma devagar. A textura deve estar leve e uniforme."),
    ], "Passos 4 a 6 - hidrate e sirva")
    access_page(c)
    c.save()
    return OUTPUT


if __name__ == "__main__":
    result = build_pdf()
    print(result)
