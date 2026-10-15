/**
 * Soma os custos das integrações selecionadas, incluindo Braga Online e CRF Completo
 * (marcados por padrão, mas desmarcáveis), e conta também os sistemas sem cobrança selecionados.
 */
export function calcularIntegracoes(dados = {}, regimeValor, 
  segmentoValor, integracoes = {}) {

  const salarioMinimo = Number(dados.salarioMinimo)
  const imposto = Number(dados.imposto)

  const arredondar = (valor) => Math.ceil(valor)

  let total = 0
  let quantidade = 0

  if (integracoes.niboDocs) {
    total += arredondar(24.40 / (1 - imposto - 0.15))
    quantidade++
  }

  if (integracoes.niboGF) {
    total += arredondar(47 / (1 - imposto - 0.15))
    quantidade++
  }

  if (integracoes.hubcount) {
    total += arredondar(100 / (1 - imposto - 0.10))
    quantidade++
  }

  if (integracoes.bragaOnline) {
    total += arredondar(15 / (1 - imposto - 0.15))
    quantidade++
  }

  if (integracoes.centroCustos) {
    const valor = ((regimeValor + segmentoValor) * 0.10) / (1 - imposto)
    total += arredondar(valor)
    quantidade++
  }

  if (integracoes.crfCompleto) {
    total += arredondar(salarioMinimo * 0.12)
    quantidade++
  }

  for (const chave of ["omieFit", "omieCliente", "sistemaProprio", "smartFin"]) {
    if (integracoes[chave]) quantidade++
  }

  return {
    total,
    quantidade
  }
}
