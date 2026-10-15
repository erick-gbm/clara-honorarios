import { formatCurrency } from "../../utils/calculo/helpers"

const INTEGRACOES = [
  { key: "niboDocs", label: "Nibo (Docs + CC)" },
  { key: "niboGF", label: "Nibo (GF Plus)" },
  { key: "hubcount", label: "Hubcount" },
  { key: "bragaOnline", label: "Braga Online" },
  { key: "centroCustos", label: "Centro de Custos" },
  { key: "crfCompleto", label: "CRF Completo" },
  { key: "omieFit", label: "Omie Fit", semValor: true },
  { key: "omieCliente", label: "Omie Cliente", semValor: true },
  { key: "sistemaProprio", label: "Sistema Próprio", semValor: true },
  { key: "smartFin", label: "SmartFin", semValor: true },
]

const FREQ_MAP = {
  Anual: 0,
  Semestral: 0.15 / 5.8,
  Trimestral: 0.15 / 2.8,
  Bimestral: 0.15 / 1.8,
  Mensal: 0.15,
}

function TooltipInfo({ text, widthClass = "w-72" }) {
  return (
    <span className="group relative inline-flex">
      <span
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-500 transition-colors group-hover:border-blue-400 group-hover:text-blue-600"
        tabIndex={0}
      >
        ?
      </span>
      <span
        className={`pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-30 ${widthClass} -translate-x-1/2 whitespace-pre-line rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-normal leading-4 text-slate-600 opacity-0 shadow-lg transition-all duration-150 group-hover:opacity-100 group-focus-within:opacity-100`}
      >
        {text}
      </span>
    </span>
  )
}

function calcularValorIntegracao(itemKey, { imposto, salarioMinimo, regimeValor, segmentoValor }) {
  const arredondar = (valor) => Math.ceil(Number(valor || 0))

  if (itemKey === "niboDocs") {
    const divisor = 1 - imposto - 0.15
    return divisor > 0 ? arredondar(24.4 / divisor) : 0
  }

  if (itemKey === "niboGF") {
    const divisor = 1 - imposto - 0.15
    return divisor > 0 ? arredondar(47 / divisor) : 0
  }

  if (itemKey === "hubcount") {
    const divisor = 1 - imposto - 0.1
    return divisor > 0 ? arredondar(100 / divisor) : 0
  }

  if (itemKey === "bragaOnline") {
    const divisor = 1 - imposto - 0.15
    return divisor > 0 ? arredondar(15 / divisor) : 0
  }

  if (itemKey === "centroCustos") {
    const divisor = 1 - imposto
    return divisor > 0 ? arredondar(((regimeValor + segmentoValor) * 0.1) / divisor) : 0
  }

  if (itemKey === "crfCompleto") return arredondar(salarioMinimo * 0.12)

  return 0
}

export default function Variaveis({ dados, setDados, integracoes, setIntegracoes, resultado }) {
  const salarioMinimo = Number(dados.salarioMinimo || 0)
  const imposto = Number(dados.imposto || 0)
  const fatorBalancete = FREQ_MAP[dados.balancete] || 0
  const fatorReuniao = FREQ_MAP[dados.reuniao] || 0
  const regimeValor = Number(resultado?.regimeValor || 0)
  const segmentoValor = Number(resultado?.segmentoValor || 0)

  const balanceteTooltipText = `Calculo: ${formatCurrency(salarioMinimo)} x ${fatorBalancete.toFixed(4)} = ${formatCurrency(resultado?.balanceteValor)}`
  const reuniaoTooltipText = `Calculo: ${formatCurrency(salarioMinimo)} x ${fatorReuniao.toFixed(4)} = ${formatCurrency(resultado?.reuniaoValor)}`

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-xl font-semibold text-slate-900">Variáveis / Integrações</h2>
      </div>

      <p className="mb-4 flex items-center gap-2 text-sm text-slate-600">
        <span>Selecione as variáveis utilizadas pelo cliente para aplicar os ajustes no cálculo.</span>
      </p>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <span>Balancete</span>
            <TooltipInfo text={balanceteTooltipText} />
          </div>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30"
            value={dados.balancete}
            onChange={(e) => setDados({ ...dados, balancete: e.target.value })}
          >
            <option value="">Selecione a Frequência</option>
            <option value="Anual">Anual</option>
            <option value="Semestral">Semestral</option>
            <option value="Trimestral">Trimestral</option>
            <option value="Bimestral">Bimestral</option>
            <option value="Mensal">Mensal</option>
          </select>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <span>Reuniao</span>
            <TooltipInfo text={reuniaoTooltipText} />
          </div>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30"
            value={dados.reuniao}
            onChange={(e) => setDados({ ...dados, reuniao: e.target.value })}
          >
            <option value="">Selecione a Frequência</option>
            <option value="Anual">Anual</option>
            <option value="Semestral">Semestral</option>
            <option value="Trimestral">Trimestral</option>
            <option value="Bimestral">Bimestral</option>
            <option value="Mensal">Mensal</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {INTEGRACOES.map((item) => {
          const valorItem = calcularValorIntegracao(item.key, {
            imposto,
            salarioMinimo,
            regimeValor,
            segmentoValor,
          })

          return (
            <label
              key={item.key}
              className={`group relative flex min-h-24 items-center justify-center rounded-xl border-2 p-4 text-center text-sm font-semibold transition-all cursor-pointer ${
                integracoes[item.key]
                  ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-slate-50"
              }`}
            >
              <input
                checked={Boolean(integracoes[item.key])}
                className="sr-only"
                type="checkbox"
                onChange={(e) =>
                  setIntegracoes((atual) => ({ ...atual, [item.key]: e.target.checked }))
                }
              />
              <span
                className={`absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold transition-colors ${
                  integracoes[item.key]
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 bg-white text-transparent group-hover:border-blue-300"
                }`}
              >
                OK
              </span>
              <span className="flex flex-col items-center gap-1">
                <span>{item.label}</span>
                {!item.semValor && <span className="text-[11px] font-semibold text-slate-500">{formatCurrency(valorItem)}</span>}
              </span>
            </label>
          )
        })}
      </div>
    </section>
  )
}
