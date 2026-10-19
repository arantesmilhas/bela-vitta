# Bela Vitta

Funil estático da Bela Vitta, reconstruído para uma oferta digital de receita caseira em área de membros.

## Páginas

- `/` — presell
- `/vsl/` — página principal da VSL e oferta
- `/calculadora/` — prévia do bônus digital

## Configuração

As integrações pendentes ficam centralizadas em `assets/config.js`:

- player e script do VTurb;
- tempo de liberação da oferta;
- preço;
- URL do checkout;
- URL da área de membros.

Enquanto VTurb, preço e checkout estiverem vazios, a página funciona em modo de revisão e não envia o visitante para uma compra inexistente.

## Desenvolvimento local

O projeto não exige build. Sirva a pasta com qualquer servidor HTTP estático.

```sh
python3 -m http.server 4173
```

Depois acesse `http://localhost:4173`.

