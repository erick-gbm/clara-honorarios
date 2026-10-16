import { useState } from "react"

import { formatCurrency, parseLocalizedNumber } from "../../utils/calculo/helpers"
import { PERCENTUAL_LUCRO_MINIMO } from "../../utils/calculo/calcularHonorario"

const NOMES_INTEGRACOES = {
  niboDocs: "Nibo (Docs + CC)",
  niboGF: "Nibo (GF Plus)",
  hubcount: "Hubcount",
  bragaOnline: "Braga Online",
  centroCustos: "Centro de Custos",
  crfCompleto: "CRF Completo",
  omieFit: "Omie Fit",
  omieCliente: "Omie Cliente",
  sistemaProprio: "Sistema Próprio",
  smartFin: "SmartFin",
}

const preenchido = (valor) => {
  if (Array.isArray(valor)) return valor.length > 0
  return valor !== null && valor !== undefined && valor !== "" && Number(valor) !== 0
}

function Linha({ rotulo, detalhe, valor, destaque }) {
  return (
    <li className="flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-700">{rotulo}</p>
        {detalhe && <p className="mt-0.5 break-words text-xs text-slate-500">{detalhe}</p>}
      </div>
      <span className={`shrink-0 text-sm font-semibold tabular-nums ${destaque || "text-slate-900"}`}>
        {valor}
      </span>
    </li>
  )
}

function Secao({ titulo, children }) {
  return (
    <div>
      <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{titulo}</h4>
      <ul className="divide-y divide-slate-100">{children}</ul>
    </div>
  )
}

export default function ResumoHonorario({ empresa, dados, integracoes, resultado }) {
  const [gerando, setGerando] = useState(false)
  const [mensagemRelatorio, setMensagemRelatorio] = useState("")
  const [pendencias, setPendencias] = useState(null)

  const baixarRelatorio = async () => {
    setGerando(true)
    setMensagemRelatorio("")
    setPendencias(null)
    try {
      const { gerarRelatorioHonorarios } = await import("../../services/geradorRelatorioService")
      await gerarRelatorioHonorarios({ empresa, dados, integracoes, resultado })
      setMensagemRelatorio("Download do relatório iniciado.")
    } catch (error) {
      console.error("Erro ao gerar relatório de honorários:", error)
      setMensagemRelatorio(error.message || "Não foi possível gerar o relatório. Tente novamente.")
      setPendencias(error.pendencias || null)
    } finally {
      setGerando(false)
    }
  }

  const integracoesSelecionadas = Object.entries(NOMES_INTEGRACOES)
    .filter(([chave]) => integracoes?.[chave])
    .map(([, nome]) => nome)

  const observacoesAdicionais = Array.isArray(dados.observacoes)
    ? dados.observacoes.filter((observacao) => {
        const nomePreenchido = String(observacao?.nome || "").trim() !== ""
        const valorPreenchido = parseLocalizedNumber(observacao?.valor) !== 0
        return nomePreenchido || valorPreenchido
      })
    : []

  const composicao = [
    preenchido(dados.regime) && {
      rotulo: "Regime",
      detalhe: dados.regime,
      valor: formatCurrency(resultado?.regimeValor),
    },
    preenchido(dados.segmento) && {
      rotulo: "Segmento",
      detalhe: Array.isArray(dados.segmento) ? dados.segmento.join(", ") : dados.segmento,
      valor: formatCurrency(resultado?.segmentoValor),
    },
    Number(dados.faturamento || 0) > 0 && {
      rotulo: "Faturamento",
      detalhe: formatCurrency(dados.faturamento),
      valor: formatCurrency(resultado?.acresFaturamento),
    },
    preenchido(dados.socios) && {
      rotulo: "Sócios",
      detalhe: `${dados.socios} sócio(s)`,
      valor: formatCurrency(resultado?.sociosValor),
    },
    preenchido(dados.funcionarios) && {
      rotulo: "Funcionários",
      detalhe: `${dados.funcionarios} funcionário(s)`,
      valor: formatCurrency(resultado?.funcionariosValor),
    },
    preenchido(dados.filiais) && {
      rotulo: "Filiais",
      detalhe: `${dados.filiais} filial(is)`,
      valor: formatCurrency(resultado?.filiaisValor),
    },
    preenchido(dados.balancete) && {
      rotulo: "Balancete",
      detalhe: dados.balancete,
      valor: formatCurrency(resultado?.balanceteValor),
    },
    preenchido(dados.reuniao) && {
      rotulo: "Reunião",
      detalhe: dados.reuniao,
      valor: formatCurrency(resultado?.reuniaoValor),
    },
    integracoesSelecionadas.length > 0 && {
      rotulo: "Variáveis / Integrações",
      detalhe: integracoesSelecionadas.join(", "),
      valor: formatCurrency(resultado?.integracoesValor),
    },
  ].filter(Boolean)

  const subtotal = Number(resultado?.subtotal || 0)
  const lucroValor = Number(resultado?.lucroValor || 0)
  const percLucro = Number(
    (Number(resultado?.percLucro ?? PERCENTUAL_LUCRO_MINIMO) * 100).toFixed(2),
  )
  const ajustePiso = Math.max(0, Number(resultado?.piso || 0) - (subtotal + lucroValor))
  const observacoesValor = Number(resultado?.observacoesValor || 0)

  return (
    <div className="sticky top-24 overflow-hidden rounded-xl shadow-lg">
      <div className="bg-blue-600 p-6 text-center text-white">
        <p className="mb-2 text-sm font-medium uppercase tracking-wider text-blue-100">
          Honorário Mensal Estimado
        </p>
        <div className="text-4xl font-bold tracking-tight">{formatCurrency(resultado?.honorarioTotal)}</div>
      </div>

      <div className="space-y-5 border border-slate-200 bg-white p-6">
        <h3 className="border-b border-slate-100 pb-2 font-semibold text-slate-900">Resumo da Simulação</h3>

        <Secao titulo="Composição do valor">
          {composicao.length === 0 ? (
            <li className="py-3 text-sm text-slate-400">Preencha os dados para ver a composição.</li>
          ) : (
            composicao.map((item) => <Linha key={item.rotulo} {...item} />)
          )}
        </Secao>

        <div className="rounded-lg bg-slate-50 p-4">
          <ul className="divide-y divide-slate-200/70">
            <Linha rotulo="Subtotal dos itens" valor={formatCurrency(subtotal)} />
            <Linha
              rotulo="Margem de Lucro"
              detalhe={`${percLucro}% sobre o subtotal`}
              valor={`+ ${formatCurrency(lucroValor)}`}
              destaque="text-emerald-600"
            />
            {ajustePiso > 0 && (
              <Linha
                rotulo="Ajuste ao piso"
                detalhe={`Piso de ${formatCurrency(resultado?.piso)}`}
                valor={`+ ${formatCurrency(ajustePiso)}`}
                destaque="text-amber-600"
              />
            )}
            {observacoesAdicionais.length > 0 && (
              <Linha
                rotulo="Observações"
                detalhe={`${observacoesAdicionais.length} adicional(is)`}
                valor={`+ ${formatCurrency(observacoesValor)}`}
                destaque="text-emerald-600"
              />
            )}
          </ul>
          <div className="mt-1 flex items-center justify-between border-t border-slate-300 pt-3">
            <span className="text-sm font-semibold text-slate-900">Total mensal</span>
            <span className="text-lg font-bold tabular-nums text-blue-700">
              {formatCurrency(resultado?.honorarioTotal)}
            </span>
          </div>
        </div>

        <button
          className="flex w-full items-center justify-center rounded-lg bg-blue-600 py-4 font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
          disabled={gerando}
          type="button"
          onClick={baixarRelatorio}
        >
          {gerando ? "Gerando relatório..." : "Gerar Relatório de Honorários"}
        </button>
        {mensagemRelatorio && (
          <div aria-live="polite" className={`text-sm ${pendencias ? "text-red-700" : "text-slate-600"}`}>
            <p>{mensagemRelatorio}</p>
            {pendencias && Object.entries(pendencias).map(([grupo, campos]) => campos.length > 0 && (
              <div key={grupo} className="mt-2">
                <p className="font-semibold">{grupo === "empresa" ? "Empresa" : "Cálculo"}</p>
                <ul className="ml-5 list-disc">
                  {campos.map((campo) => <li key={campo}>{campo}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
