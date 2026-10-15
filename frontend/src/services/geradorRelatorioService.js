import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
import saveAs from "file-saver"

import { PRESTADORAS } from "../data/prestadoras.js"
import { formatCurrency, parseLocalizedNumber } from "../utils/calculo/helpers.js"
import { digitosDoCnpj, formatarCnpj } from "../utils/empresa/formatarCnpj.js"
import { erroDeValidacaoRelatorio } from "../utils/relatorio/validarRelatorio.js"

const MODELO = "templates/Modelo de Ficha de Entrada - Contabilidade.docx"
const MIME_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

const NOMES_SERVICOS_ADICIONAIS = {
  hubcount: "Hubcount",
  bragaOnline: "Braga Online",
  centroCustos: "Centro de Custos",
}

const texto = (valor) => String(valor ?? "").trim()
const numeroInformado = (valor) => valor === "" || valor == null ? "" : String(valor)
const moedaSemSimbolo = (valor) => formatCurrency(valor).replace("R$", "").trim()
const moedaInformada = (valor) => valor === "" || valor == null ? "" : moedaSemSimbolo(valor)

export function dadosDoRelatorio({ empresa, dados, integracoes, resultado }) {
  const prestadora = PRESTADORAS.find((item) => item.razaoSocial === empresa.prestadoraServico)
  const servicosSelecionados = Object.entries(NOMES_SERVICOS_ADICIONAIS)
    .filter(([chave]) => integracoes[chave])
    .map(([, nome]) => nome)

  if (dados.consultoria === "sim") servicosSelecionados.push("Consultoria")

  const observacoes = (dados.observacoes || [])
    .filter((item) => texto(item?.nome) || texto(item?.valor))
    .map((item) => {
      const valor = texto(item.valor) ? formatCurrency(parseLocalizedNumber(item.valor)) : ""
      return [texto(item.nome), valor].filter(Boolean).join(" — ")
    })

  return {
    nome: texto(empresa.contatoNome),
    empresa: texto(empresa.nomeEmpresa),
    fantasia: texto(empresa.nomeFantasia),
    cnpj: digitosDoCnpj(empresa.cnpj).length === 14 ? formatarCnpj(empresa.cnpj) : "",
    data_inicio: texto(empresa.dataInicio).split("-").reverse().join("/"),
    atividades: texto(empresa.atividades),
    contratada_braga: prestadora?.campoContratada === "contratada_braga" ? "X" : "",
    contratada_eqpm: prestadora?.campoContratada === "contratada_eqpm" ? "X" : "",
    contratada_stc: prestadora?.campoContratada === "contratada_stc" ? "X" : "",
    plano_bm: prestadora?.plano === "plano_bm" ? "X" : "",
    plano_stc: prestadora?.plano === "plano_stc" ? "X" : "",
    sis_omiefit: integracoes.omieFit ? "X" : "",
    sis_omiecliente: integracoes.omieCliente ? "X" : "",
    sis_proprio: integracoes.sistemaProprio ? "X" : "",
    sis_smartfin: integracoes.smartFin ? "X" : "",
    sis_nibogf: integracoes.niboGF ? "X" : "",
    sis_ccnibo: integracoes.niboDocs ? "X" : "",
    sis_proprio_planil: "",
    sis_sem_movi: "",
    tributacao: texto(dados.regime),
    crf_basico: "",
    crf_completo: integracoes.crfCompleto ? "X" : "",
    crf_movim: "",
    faturamento: moedaInformada(dados.faturamento),
    pro_labore: moedaSemSimbolo(Number(resultado.funcionariosValor || 0) + Number(resultado.sociosValor || 0)),
    funcionarios: numeroInformado(dados.funcionarios),
    servicos_adicionais: [...servicosSelecionados, ...observacoes].join("\n"),
    honorario: moedaSemSimbolo(resultado.honorarioTotal),
    nome_contato: texto(empresa.contatoNome),
    celular_contato: texto(empresa.contatoCelular),
    email_contato: texto(empresa.contatoEmail),
    contabilidade_anterior: texto(empresa.contabilidadeAnterior),
  }
}

export async function gerarRelatorioHonorarios(simulacao) {
  const erroValidacao = erroDeValidacaoRelatorio(simulacao)
  if (erroValidacao) throw erroValidacao

  const url = encodeURI(`${import.meta.env.BASE_URL}${MODELO}`)
  const response = await fetch(url)
  if (!response.ok) throw new Error("Não foi possível carregar o modelo do relatório.")

  const zip = new PizZip(await response.arrayBuffer())
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })
  doc.render(dadosDoRelatorio(simulacao))

  const blob = doc.getZip().generate({ type: "blob", mimeType: MIME_DOCX })
  const nomeEmpresa = texto(simulacao.empresa.nomeEmpresa)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "Empresa"

  saveAs(blob, `Relatorio_Honorarios_${nomeEmpresa}.docx`)
}
