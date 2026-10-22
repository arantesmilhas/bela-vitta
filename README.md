# Bela Vitta

Funil estático da Bela Vitta, reconstruído para uma oferta digital de receita caseira em área de membros.

## Páginas

- `/` — presell
- `/vsl/` — página principal da VSL e oferta
- `/pt/` — presell em português de Portugal
- `/pt/vsl/` — VSL e oferta para Portugal, com preços em euros
- `/entregavel/` — área de membros não indexada, com módulos, progresso, receita, jornada e biblioteca
- `/calculadora/` — bônus digital pós-compra para cálculo educativo de constância
- `/materiais/` — kit imprimível com lista de compras, planner de 30 dias e revisão anual
- `/acesso/` — ponte estável que redireciona para a área de membros em `/entregavel/`
- `/downloads/guia-bela-vitta.pdf` — PDF do guia com botão e QR code para `/acesso/`

A versão brasileira é publicada em `https://naturallvitttamais.zoomfitpro.com`, com a VSL em `/vsl`. A versão portuguesa permanece em `https://naturallvitttamais.astroluz.site`, também com a VSL em `/vsl`.

A Calculadora Digital Bela Vitta e o kit de organização são benefícios pós-compra divulgados somente dentro do entregável, sem aparecer na VSL principal. Checklist, calendário, preferências, anotações e histórico da calculadora ficam salvos localmente no navegador do cliente.

## Configuração

As integrações ficam centralizadas em `assets/config.js`:

- player e script do VTurb;
- tempo de liberação da oferta;
- preço;
- URL do checkout;
- URL da área de membros.

Na VSL, a oferta é liberada em `33:14` (`1994` segundos). Para revisão, cinco cliques ou toques rápidos no canto superior esquerdo do vídeo liberam a oferta antes e mantêm esse estado durante a sessão atual do navegador.

O player VTurb está configurado nas duas versões. Na versão brasileira, os links de checkout da Cakto estão ativos para as ofertas de 30 e 365 dias. Na versão portuguesa, os links da Hotmart estão ativos para as ofertas de 9,97 € e 29,97 €, configurados separadamente em `pt/config.js`.

O endereço `/acesso/` encaminha o cliente diretamente para a área de membros em `/entregavel/`. Assim, o link e o QR code já impressos no PDF não precisam ser alterados. Dentro do entregável, o botão do bônus abre `/calculadora/`.

A rota `/entregavel/` é apenas uma prévia com `noindex`. Este projeto não possui autenticação; o conteúdo pago definitivo deve ser copiado para a plataforma de membros antes do lançamento.

A versão de Portugal utiliza `pt/config.js`, com preços, links de checkout da Hotmart e VTurb independentes da versão brasileira.

## Desenvolvimento local

O projeto não exige build. Sirva a pasta com qualquer servidor HTTP estático.

```sh
python3 -m http.server 4173
```

Depois acesse `http://localhost:4173`.
