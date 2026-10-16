import { useState } from "react"
import React from "react"

import BaseCalculo from "../components/calculo/BaseCalculo"
import DadosCliente from "../components/calculo/DadosCliente"
import DadosEmpresa from "../components/calculo/DadosEmpresa"
import Observacoes from "../components/calculo/Observacoes"
import ResumoHonorario from "../components/calculo/ResumoHonorario"
import Variaveis from "../components/calculo/Variaveis"
import {
  calcularHonorario,
  PERCENTUAL_LUCRO_MINIMO,
} from "../utils/calculo/calcularHonorario"
import Header from "../components/general/Header"

export default function Calculo() {
  const [abaAtiva, setAbaAtiva] = useState("empresa")
  const [empresa, setEmpresa] = useState({
    prestadoraServico: "",
    nomeEmpresa: "",
    nomeFantasia: "",
    cnpj: "",
    dataInicio: "",
    atividades: "",
    contabilidadeAnterior: "",
    contatoNome: "",
    contatoCelular: "",
    contatoEmail: "",
  })

  const [dados, setDados] = useState({
    salarioMinimo: 1621,
    percentual: 1.0,
    imposto: 0.12,
    porcFiliais: 0.25,
    porcFaturamento: 0.25,
    pisoPersonalizado: "",

    regime: "",
    segmento: [],

    faturamento: "",
    funcionarios: "",
    filiais: "",
    socios: "",

    balancete: "",
    reuniao: "",
    observacoes: [{ nome: "", valor: "" }],

    percLucro: PERCENTUAL_LUCRO_MINIMO,
  })

  const [integracoes, setIntegracoes] = useState({
    niboDocs: false,
    niboGF: false,
    hubcont: false,
    bragaOnline: true,
    centroCustos: false,
    crfCompleto: true,
    omieFit: false,
    omieCliente: false,
    sistemaProprio: false,
    smartFin: false,
  })

  const resultado = calcularHonorario(dados, integracoes)

  const moverAba = (event) => {
    const ordem = ["empresa", "calculo"]
    const indiceAtual = ordem.indexOf(abaAtiva)
    let proximoIndice

    if (event.key === "ArrowRight") proximoIndice = (indiceAtual + 1) % ordem.length
    else if (event.key === "ArrowLeft") proximoIndice = (indiceAtual - 1 + ordem.length) % ordem.length
    else if (event.key === "Home") proximoIndice = 0
    else if (event.key === "End") proximoIndice = ordem.length - 1
    else return

    event.preventDefault()
    setAbaAtiva(ordem[proximoIndice])
    event.currentTarget.parentElement.children[proximoIndice].focus()
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Cálculo de Honorários</h1>
          <p className="mt-2 text-slate-600">
            Informe os dados da empresa e simule os honorários contábeis.
          </p>
        </div>

        <div aria-label="Etapas da simulação" className="mb-8 flex gap-2 border-b border-slate-200" role="tablist">
          {[
            { id: "empresa", texto: "Empresa" },
            { id: "calculo", texto: "Cálculo" },
          ].map((aba) => (
            <button
              key={aba.id}
              aria-controls={`painel-${aba.id}`}
              aria-selected={abaAtiva === aba.id}
              className={`border-b-2 px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                abaAtiva === aba.id
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900"
              }`}
              id={`aba-${aba.id}`}
              role="tab"
              tabIndex={abaAtiva === aba.id ? 0 : -1}
              type="button"
              onClick={() => setAbaAtiva(aba.id)}
              onKeyDown={moverAba}
            >
              {aba.texto}
            </button>
          ))}
        </div>

        <div aria-labelledby="aba-empresa" hidden={abaAtiva !== "empresa"} id="painel-empresa" role="tabpanel" tabIndex={0}>
          <DadosEmpresa empresa={empresa} setEmpresa={setEmpresa} />
        </div>

        <div aria-labelledby="aba-calculo" hidden={abaAtiva !== "calculo"} id="painel-calculo" role="tabpanel" tabIndex={0}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="flex flex-col gap-6 lg:col-span-8">
              <section className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-blue-700">Empresa da simulação</p>
                <h3 className="mt-1 text-lg font-semibold text-blue-900">
                  {empresa.nomeEmpresa.trim() || "Empresa não informada"}
                </h3>
                <p className="mt-1 text-sm text-blue-800">
                  Prestadora do serviço: {empresa.prestadoraServico || "Não informada"}
                </p>
              </section>

              <BaseCalculo dados={dados} resultado={resultado} setDados={setDados} />
              <DadosCliente dados={dados} resultado={resultado} setDados={setDados} />
              <Variaveis
                dados={dados}
                integracoes={integracoes}
                resultado={resultado}
                setDados={setDados}
                setIntegracoes={setIntegracoes}
              />
              <Observacoes dados={dados} setDados={setDados} />
            </div>

            <div className="lg:col-span-4">
              <ResumoHonorario empresa={empresa} dados={dados} integracoes={integracoes} resultado={resultado} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
