// Templates genéricos UNREAL — versão de partida que o utilizador ajusta por sector
// antes de enviar. Não automatiza envio; só dá texto base.

export type UnrealBump = "BUMP1" | "BUMP2" | "BREAKUP";

export const TEMPLATES: Record<UnrealBump, string> = {
  BUMP1: `Olá [Nome],

Volto a este tema porque imagino que a primeira mensagem se possa
ter perdido entre os assuntos da semana.

Estamos a libertar equipas administrativas em [sector] de 70-80h/mês
de trabalho manual, sem alterar o ERP que já usam. Bastam 15 minutos
para mostrar números concretos do último caso comparável.

Faria sentido falarmos esta semana ou a próxima?

Cumprimentos,
Miguel`,

  BUMP2: `Olá [Nome],

Imagino que a agenda esteja particularmente densa - se preferir que
recue o tema para mais tarde, basta dizer.

Para tornar isto mais útil sem cobrar tempo: posso enviar-lhe um
breve resumo escrito com os números concretos do tipo de impacto
que temos visto em empresas com perfil próximo da vossa. Recebe, lê
quando puder, e decide se vale a pena uma conversa depois.

Tem um email para o qual prefere que envie?

Cumprimentos,
Miguel`,

  BREAKUP: `Olá [Nome],

Última mensagem da minha parte sobre este tema, prometo.

Sei que entre a primeira mensagem e agora a sua agenda terá passado
por várias fases - imagino que o tema não ficou no topo da lista.

Se ainda fizer sentido voltarmos a falar quando o tempo aliviar,
basta um sinal seu - mesmo que seja daqui a meses. Caso o tópico
tenha saído de cena, também é honesto dizê-lo e arrumo sem voltar
a incomodar.

Em qualquer dos casos, votos de excelente trabalho.

Um abraço,
Miguel`,
};

// Dias mínimos desde último out (na fase actual) para o lead aparecer na fila
export const DUE_DAYS: Record<UnrealBump, number> = {
  BUMP1: 0,   // qualquer 'novo' precisa de bump 1 — não há delay implícito
  BUMP2: 7,
  BREAKUP: 14,
};

// Próximo nextDate (em dias) após enviar
export const NEXT_DAYS_AFTER: Record<UnrealBump, number> = {
  BUMP1: 7,
  BUMP2: 14,
  BREAKUP: 7,
};

export const BUMP_LABEL: Record<UnrealBump, string> = {
  BUMP1: "Bump 1 (2ª mensagem)",
  BUMP2: "Bump 2 (3ª mensagem)",
  BREAKUP: "Break-up",
};
