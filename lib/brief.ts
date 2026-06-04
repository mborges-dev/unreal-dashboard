// Gerador de briefs auto-contidos para drafting de conteúdo / pitches / outreach
// por qualquer LLM (Claude, ChatGPT, etc.). O brief inclui contexto completo,
// tom de voz, casos reais e a tarefa específica.

const CONTEXTO_EMPRESA = `## Contexto da empresa

UNREAL Performance — boutique técnica de IA e automação operacional sediada em
Lisboa. Implementamos infraestruturas de orquestração cognitiva que automatizam
processamento documental e integração entre sistemas (ERP/CRM/facturação) em
PMEs e grupos portugueses. Foco em soberania de dados (on-premise / VPC privado),
implementação rápida (15-30 dias) e ROI mensurável (tipicamente <3 meses).

TheFacio — produto separado, automatização de WhatsApp para restaurantes
(reservas + Q&A 24/7). 397€ setup + 127€/mês.

Fundador: Miguel Borges.

Site UNREAL: unrealperformance.co
Site TheFacio: thefacio.com`;

const TOM_DE_VOZ = `## Tom de voz

- PT-PT (não brasileiro). Usa "à vossa equipa", "na vossa operação", "directamente", "facturação".
- Formal-directo. Sem hype, sem "estamos aqui para servir-vos".
- Números concretos > adjectivos. Em vez de "ganhos enormes", "9 dias úteis/mês → 6 horas".
- Verbos no passado activo: "implementámos", "construímos", "fizemos", não "implementamos soluções".
- Frases curtas. Quebra parágrafos com frequência.
- Vocabulário técnico quando relevante (API, ERP, OCR, validação, payload) mas explica para leigos quando necessário.
- Sem emojis em texto B2B, excepto 1-2 num post de LinkedIn em pontos de destaque.
- Em pitches a imprensa: tom de analista, não de vendedor.
- Em mensagens directas (LinkedIn/email): primeira frase reconhece o contexto do destinatário, segunda diz o que fazemos, terceira propõe acção concreta.`;

const CASOS_REAIS = `## Tipos de caso disponíveis para referência (sempre anonimizados)

Estes perfis representam intervenções típicas. Quando ilustrarem um post ou
pitch, mantém-nos genéricos: nunca nomeies o cliente, localidades específicas
ou valores contratuais exactos.

- Distribuidor FMCG: 60h/semana → 4h/semana em reconciliação guias × facturas. Detecção de desvios de margem na recepção da mercadoria.
- Cadeia de retalho: 4 dias úteis/mês → <4h em introdução de facturas de fornecedores. Sem migração de sistemas.
- Operação alimentar industrial: 9 dias/mês → 6h em processamento de guias, notas de devolução, certificados sanitários. Auditoria de qualidade em tempo real (HACCP).
- Grupo logístico EMEA: complexidade cross-border de documentação, 2-3 dias/mês de PM time libertados.

**Financiamento referenciável:**
- Vale Digitalização Portugal 2030 — até 20.000€, taxa 75%, candidaturas abertas em 2026.
- Linha IA nas PME (PRR/IFIC) — até 300.000€, taxa até 75%.`;

const TEMPLATES_DISPONIVEIS = `## Templates disponíveis (estruturas testadas)

**Case Study Anonimizado** (post LinkedIn):
🎯 Caso real de {sector}:
- O problema: {descricao}
- O que estavam a fazer: {processo manual actual}
- O que construímos: {solucao}
- O resultado: {metricas}
- A parte interessante: {insight}
Quem tiver o mesmo problema — escrevam-me.

**Análise Técnica** (post LinkedIn):
{titulo provocador}
{contexto 3 linhas}
O que muita gente não percebe: {insight principal}
{detalhe técnico}
{conclusao ou pergunta}

**Contra-Narrativa** (post LinkedIn):
Toda a gente diz que {opiniao comum}.
Eu discordo.
{3 argumentos}
{conclusao}

**Artigo de Opinião** (imprensa):
Título → Subtítulo → Abertura → Contexto → Análise (3 pontos) → Aplicação prática → Conclusão → Bio.

**Pitch para Podcast**:
Olá {nome}, {cumprimento contextual ao podcast}.
Sou Miguel Borges, fundador da UNREAL Performance.
Tema concreto: {...}
Pontos: {3 bullets}
Tenho casos reais (anonimizados). Faz sentido?`;

function header(title: string): string {
  return `# Brief de produção: ${title}\n\nObjectivo: produzir o output final em PT-PT, no tom UNREAL, pronto a publicar/enviar sem mais edição. Não inclui meta-comentários sobre o processo, não pede confirmação — entrega o texto final.\n\n${CONTEXTO_EMPRESA}\n\n${TOM_DE_VOZ}\n\n${CASOS_REAIS}\n\n${TEMPLATES_DISPONIVEIS}`;
}

export function briefForContent(idea: {
  title: string;
  hook?: string | null;
  angle?: string | null;
  pillar?: string | null;
  format?: string;
  body?: string | null;
  scheduledFor?: Date | string | null;
}): string {
  const pillarMap: Record<string, string> = {
    auditoria: "Auditoria documental e validação automática",
    integracao: "Integração entre sistemas (ERP/CRM/facturação)",
    distribuicao: "Captura e digitalização documental no terreno",
    autoridade: "Análise de mercado, política pública, financiamento",
  };
  const formatMap: Record<string, string> = {
    post_linkedin: "Post LinkedIn (250-400 palavras, hook nas 2 primeiras linhas, 1-2 emojis máximo, terminar com CTA suave)",
    artigo_longo: "Artigo de opinião para imprensa (700-1000 palavras, estrutura formal, sem emojis, bio no fim)",
    case_study: "Case study LinkedIn (estrutura template Case Study Anonimizado)",
    twitter_thread: "Thread Twitter (5-8 tweets, ≤280 chars cada)",
    pitch_externo: "Pitch externo (estrutura template Pitch para Podcast)",
  };

  return `${header(`peça de conteúdo "${idea.title}"`)}

---

## A tarefa concreta

**Título da peça:** ${idea.title}
**Pilar:** ${idea.pillar || "(não definido)"} — ${pillarMap[idea.pillar || ""] || ""}
**Format:** ${formatMap[idea.format || "post_linkedin"]}
${idea.hook ? `**Hook sugerido:** ${idea.hook}` : ""}
${idea.angle ? `**Ângulo único:** ${idea.angle}` : ""}
${idea.scheduledFor ? `**Data de publicação:** ${new Date(idea.scheduledFor).toLocaleDateString("pt-PT")}` : ""}

${idea.body ? `**Rascunho actual (refinar/melhorar):**\n${idea.body}` : "**Sem rascunho** — escrever de raiz."}

## Output

Devolve apenas o texto final pronto a publicar. Sem cabeçalho, sem comentários, sem opções. Em PT-PT. Usa pelo menos um número concreto dos casos reais acima. Se referires um cliente UNREAL nominalmente, confirma plausibilidade pelo brief; senão anonimiza ("uma operação alimentar com perfil próximo de X").`;
}

export function briefForPitch(outlet: {
  name: string;
  type: string;
  audienceSize?: string | null;
  host?: string | null;
  editorialContact?: string | null;
  url?: string | null;
  notes?: string | null;
}, pitch: { topic: string; message?: string | null }): string {
  const isPodcast = outlet.type === "podcast";

  return `${header(`pitch para ${outlet.name} (${outlet.type})`)}

---

## A tarefa concreta

**Outlet:** ${outlet.name}${outlet.url ? ` (${outlet.url})` : ""}
**Tipo:** ${outlet.type}
**Audiência:** ${outlet.audienceSize || "desconhecida"}
${isPodcast && outlet.host ? `**Host:** ${outlet.host}` : ""}
${!isPodcast && outlet.editorialContact ? `**Contacto editorial:** ${outlet.editorialContact}` : ""}
${outlet.notes ? `**Notas internas sobre o outlet:** ${outlet.notes}` : ""}

**Tópico do pitch:** ${pitch.topic}

${pitch.message ? `**Rascunho actual (refinar):**\n${pitch.message}` : "**Sem rascunho** — escrever de raiz."}

## Output esperado

${isPodcast
  ? `Pitch para podcast (segue estrutura template "Pitch para Podcast"):
- Saudação personalizada que mostra que conheces o podcast (e.g. cita um tema recente)
- Quem és em 1 frase (Miguel Borges, fundador UNREAL)
- Tópico concreto do episódio
- 3 bullets do que se pode discutir
- Menção de casos reais que tens (anonimizáveis)
- CTA suave a perguntar se faz sentido
- ≤200 palavras
- Sem hype, tom analista`
  : `Pitch para publicação (email para redacção / contacto editorial):
- Linha de assunto curta e específica (não "Pitch UNREAL Performance")
- Abertura que reconhece a linha editorial actual do outlet
- Proposta de tópico em 2-3 linhas com ângulo único defendível
- Por que TU para escrever este artigo (autoridade: 1 frase com prova)
- O que entregas (artigo de X palavras, exclusividade, fotografias se aplicável)
- Disponibilidade para entrevista alternativa
- ≤250 palavras
- Tom analista, formal`}

Devolve apenas o texto final pronto a enviar. Em PT-PT.`;
}

export function briefForPartner(partner: {
  name: string;
  contactName: string;
  contactRole?: string | null;
  type: string;
  email?: string | null;
  linkedinUrl?: string | null;
  notes?: string | null;
}, interaction: { type: string; summary?: string | null; nextStep?: string | null }): string {
  const typeMap: Record<string, string> = {
    consultora: "consultora de tecnologia/digital — provavelmente fazem projectos grandes onde subcontratam camadas técnicas específicas. Ângulo: somos o seu fornecedor preferencial de orquestração IA + integração documental.",
    software_house: "software house — provavelmente constroem produto próprio mas precisam de componentes técnicos para projectos custom. Ângulo: parceria de tecnologia (white-label ou co-delivery).",
    lean_processos: "consultora lean / optimização de processos — diagnosticam ineficiências, raramente entregam tecnologia. Ângulo: nós somos a perna técnica da recomendação deles.",
    outro: "tipo não classificado",
  };

  return `${header(`primeiro contacto com parceiro ${partner.name}`)}

---

## A tarefa concreta

**Empresa:** ${partner.name}
**Contacto:** ${partner.contactName}${partner.contactRole ? ` (${partner.contactRole})` : ""}
**Tipo de parceiro:** ${partner.type} — ${typeMap[partner.type] || ""}
${partner.email ? `**Email:** ${partner.email}` : ""}
${partner.linkedinUrl ? `**LinkedIn:** ${partner.linkedinUrl}` : ""}
${partner.notes ? `**Notas internas:** ${partner.notes}` : ""}

**Canal:** ${interaction.type}
**Próximo passo planeado:** ${interaction.nextStep || "(primeira abordagem)"}
${interaction.summary ? `**Rascunho actual:** ${interaction.summary}` : "**Sem rascunho** — escrever de raiz."}

## Output esperado

${interaction.type === "linkedin"
  ? `Mensagem LinkedIn de abordagem:
- ≤150 palavras (limite prático LinkedIn)
- Linha 1: reconhece a actividade actual do parceiro (algo concreto e recente, sem inventar)
- Linha 2: posiciona UNREAL e o ângulo da parceria conforme o tipo
- Linha 3: propõe 15-20 min de conversa exploratória, sem agenda comercial
- Tom horizontal entre pares, não pedido de favor`
  : `Email de abordagem inicial:
- Assunto curto: "[tema concreto] — UNREAL × ${partner.name}"
- Abertura que mostra que conheces a empresa
- Quem é UNREAL em 1 parágrafo (foco no que complementa o trabalho deles)
- Proposta concreta de colaboração (não vaga "ver sinergias")
- 1 caso real para credibilidade
- Convite a 20 min de conversa exploratória
- ≤200 palavras
- Tom horizontal de pares`}

Devolve apenas o texto final pronto a enviar. Em PT-PT.`;
}
