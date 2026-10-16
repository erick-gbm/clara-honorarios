import { calcularBase } from "./baseCalculo"
import { calcularFaturamento } from "./faturamentoCalculo"
import { calcularFiliais } from "./filiaisCalculo"
import { calcularFuncionarios } from "./funcionariosCalculo"
import { calcularIntegracoes } from "./integracoesCalculo"
import { calcularRegime } from "./regimeCalculo"
import { calcularSegmento } from "./segmentoCalculo"
import { calcularBalancete, calcularReuniao } from "./variaveisCalculo"
import { calcularSocios } from "./sociosCalculo"
import { calculoConsultoria } from "./calculoConsultoria"
import { arredondar, parseLocalizedNumber } from "./helpers"

export const PERCENTUAL_LUCRO_MINIMO = 0.3

/**
 * Consolida todas as regras de cálculo de honorários e retorna os detalhamentos.
 */
export function calcularHonorario(dados = {}, integracoes = {}) {
  const preBase = calcularBase(dados)
  const consultoria = calculoConsultoria(dados, preBase)
  const valorBase = arredondar(preBase + consultoria) 
  const regimeValor = calcularRegime(valorBase, dados.regime)
  const segmentoValor = calcularSegmento(valorBase, dados.segmento)
  const sociosValor = calcularSocios(dados.socios)
  const funcionariosValor = calcularFuncionarios(dados, sociosValor)
  const acresFaturamento = calcularFaturamento(dados.faturamento, dados.porcFaturamento)
  const filiaisValor = calcularFiliais(valorBase, dados.filiais, dados.porcFiliais)
  const balanceteValor = calcularBalancete(dados.salarioMinimo, dados.balancete)
  const reuniaoValor = calcularReuniao(dados.salarioMinimo, dados.reuniao)

  const { total: integracoesValor, quantidade: integracoesQuantidade } = calcularIntegracoes(
    dados,
    regimeValor,
    segmentoValor,
    integracoes,
  )

  const piso = Number(dados.pisoPersonalizado || 0)
  const observacoesValor = Array.isArray(dados.observacoes)
    ? dados.observacoes.reduce((acumulado, observacao) => {
        return acumulado + parseLocalizedNumber(observacao?.valor)
      }, 0)
    : 0

  const subtotal =
    regimeValor +
    segmentoValor +
    funcionariosValor +
    sociosValor +
    acresFaturamento +
    balanceteValor +
    reuniaoValor +
    integracoesValor +
    filiaisValor
  const percLucroInformado = Number(dados.percLucro ?? PERCENTUAL_LUCRO_MINIMO)
  const percLucro = Number.isFinite(percLucroInformado)
    ? Math.max(PERCENTUAL_LUCRO_MINIMO, percLucroInformado)
    : PERCENTUAL_LUCRO_MINIMO
  const lucroValor = subtotal * percLucro
  let honorarioTotal = subtotal + lucroValor

  if (piso > honorarioTotal) honorarioTotal = piso
  honorarioTotal += observacoesValor

  return {
    honorarioTotal: honorarioTotal || 0,
    valorBase: valorBase || 0,
    regimeValor: regimeValor || 0,
    segmentoValor: segmentoValor || 0,
    funcionariosValor: funcionariosValor || 0,
    acresFaturamento: acresFaturamento || 0,
    balanceteValor: balanceteValor || 0,
    reuniaoValor: reuniaoValor || 0,
    integracoesValor: integracoesValor || 0,
    variaveisSelecionadas: integracoesQuantidade || 0,
    piso: piso || 0,
    observacoesValor: observacoesValor || 0,
    filiaisValor: filiaisValor || 0,
    sociosValor: sociosValor || 0,
    percLucro,
    subtotal: subtotal || 0,
    lucroValor: lucroValor || 0,
    regime: dados.regime || "",
    segmento: dados.segmento || [],
    balancete: dados.balancete || "",
    reuniao: dados.reuniao || "",
  }
}
