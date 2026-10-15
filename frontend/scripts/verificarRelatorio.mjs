import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import Docxtemplater from "docxtemplater"
import PizZip from "pizzip"
import { PRESTADORAS } from "../src/data/prestadoras.js"
import { dadosDoRelatorio, gerarRelatorioHonorarios } from "../src/services/geradorRelatorioService.js"
import { formatarCnpj } from "../src/utils/empresa/formatarCnpj.js"
import { calcularIntegracoes } from "../src/utils/calculo/integracoesCalculo.js"
import { dataValida, validarRelatorio } from "../src/utils/relatorio/validarRelatorio.js"

{
  const simulacao = {
    empresa: {
      nomeEmpresa: "Cliente & Filhos",
      prestadoraServico: PRESTADORAS[0].razaoSocial,
      nomeFantasia: "Loja Exemplo",
      cnpj: "12345678000190",
      dataInicio: "2020-01-01",
      atividades: "Comércio de livros",
      contatoNome: "Ana",
      contatoCelular: "(11) 99999-9999",
      contatoEmail: "ana@exemplo.com",
      contabilidadeAnterior: "",
    },
    dados: {
      salarioMinimo: 1518,
      funcionarios: 4,
      regime: "Simples Nacional",
      faturamento: 10000,
      segmento: ["Comércio"],
      balancete: "Mensal",
      socios: 2,
      filiais: 0,
      reuniao: "Trimestral",
      observacoes: [{ nome: "Serviço extra", valor: "25,20" }],
    },
    integracoes: {
      bragaOnline: true,
      crfCompleto: true,
      niboDocs: true,
      niboGF: true,
      omieFit: true,
      omieCliente: true,
      sistemaProprio: true,
      smartFin: true,
    },
    resultado: { honorarioTotal: 1234.56, funcionariosValor: 200.25, sociosValor: 92.75 },
  }
  const valores = dadosDoRelatorio(simulacao)

  assert.equal(formatarCnpj("1234567800019"), "1234567800019")
  assert.equal(formatarCnpj("12345678000190"), "12.345.678/0001-90")
  assert.equal(formatarCnpj("12.345.678/0001-9"), "1234567800019")
  assert.equal(valores.empresa, "Cliente & Filhos")
  assert.equal(valores.cnpj, "12.345.678/0001-90")
  assert.equal(valores.contratada_stc, "X")
  assert.equal(valores.contratada_braga, "")
  assert.equal(valores.contratada_eqpm, "")
  assert.equal(valores.plano_stc, "X")
  assert.equal(valores.plano_bm, "")
  assert.equal(valores.crf_basico, "")
  assert.equal(valores.crf_completo, "X")
  for (const campo of ["sis_omiefit", "sis_omiecliente", "sis_proprio", "sis_smartfin", "sis_nibogf", "sis_ccnibo"]) {
    assert.equal(valores[campo], "X", `Marcação ausente: ${campo}`)
  }
  const semBragaECrf = dadosDoRelatorio({ ...simulacao, integracoes: { niboGF: true } })
  assert.equal(semBragaECrf.crf_completo, "")
  assert.ok(!semBragaECrf.servicos_adicionais.includes("Braga Online"))
  const somenteNiboGF = dadosDoRelatorio({ ...simulacao, integracoes: { niboGF: true } })
  assert.equal(somenteNiboGF.sis_nibogf, "X")
  assert.equal(somenteNiboGF.sis_ccnibo, "")
  const somenteNiboDocs = dadosDoRelatorio({ ...simulacao, integracoes: { niboDocs: true } })
  assert.equal(somenteNiboDocs.sis_nibogf, "")
  assert.equal(somenteNiboDocs.sis_ccnibo, "X")
  assert.ok(!Object.hasOwn(valores, "sis_nibogt"))
  assert.deepEqual(
    valores.servicos_adicionais.split("\n").map((item) => item.replace(/\s+/g, " ")),
    ["Braga Online", "Serviço extra — R$ 25,20"],
  )
  const comOutrosServicos = dadosDoRelatorio({
    ...simulacao,
    integracoes: { ...simulacao.integracoes, hubcount: true, centroCustos: true },
  })
  assert.ok(comOutrosServicos.servicos_adicionais.includes("Hubcount"))
  assert.ok(comOutrosServicos.servicos_adicionais.includes("Centro de Custos"))
  const padrao = { bragaOnline: true, crfCompleto: true }
  const custoFixo = calcularIntegracoes(simulacao.dados, 100, 50, padrao)
  const semPadrao = calcularIntegracoes(simulacao.dados, 100, 50, {})
  assert.equal(semPadrao.total, 0)
  assert.equal(semPadrao.quantidade, 0)
  const custoComSistemasSemValor = calcularIntegracoes(simulacao.dados, 100, 50, {
    ...padrao,
    omieFit: true, omieCliente: true, sistemaProprio: true, smartFin: true,
  })
  assert.equal(custoComSistemasSemValor.total, custoFixo.total)
  assert.equal(custoComSistemasSemValor.quantidade, custoFixo.quantidade + 4)
  assert.equal(custoFixo.quantidade, 2)
  assert.equal(valores.faturamento, "10.000,00")
  assert.equal(valores.honorario, "1.234,56")
  assert.equal(valores.data_inicio, simulacao.empresa.dataInicio.split("-").reverse().join("/"))
  assert.equal(valores.pro_labore, "293,00")
  assert.deepEqual(validarRelatorio(simulacao), { empresa: [], calculo: [] })
  assert.equal(dataValida("2020-01-01"), true)
  assert.equal(dataValida("2026-10-02"), true)
  assert.equal(dataValida("2026-02-30"), false)
  const incompleta = validarRelatorio({
    empresa: { ...simulacao.empresa, nomeEmpresa: "", dataInicio: "2026-02-30" },
    dados: { ...simulacao.dados, regime: "", segmento: [], funcionarios: "" },
  })
  assert.deepEqual(incompleta.empresa, ["Nome da Empresa", "Data de Início (data válida)"])
  assert.deepEqual(incompleta.calculo, ["Regime Tributário", "Segmento", "Funcionários"])
  for (const prestadora of PRESTADORAS) {
    const campos = dadosDoRelatorio({
      ...simulacao,
      empresa: { ...simulacao.empresa, prestadoraServico: prestadora.razaoSocial },
    })
    for (const campo of ["contratada_braga", "contratada_eqpm", "contratada_stc"]) {
      assert.equal(campos[campo], campo === prestadora.campoContratada ? "X" : "")
    }
    assert.equal(campos.plano_stc, prestadora.plano === "plano_stc" ? "X" : "")
    assert.equal(campos.plano_bm, prestadora.plano === "plano_bm" ? "X" : "")
  }
  await assert.rejects(
    gerarRelatorioHonorarios({ ...simulacao, empresa: { ...simulacao.empresa, cnpj: "1234567800019" } }),
    (error) => error.pendencias?.empresa.includes("CNPJ da Empresa (14 dígitos)"),
  )
  await assert.rejects(
    gerarRelatorioHonorarios({ ...simulacao, empresa: { ...simulacao.empresa, dataInicio: "2026-02-30" } }),
    (error) => error.pendencias?.empresa.includes("Data de Início (data válida)"),
  )

  const modelo = path.resolve("public/templates/Modelo de Ficha de Entrada - Contabilidade.docx")
  const zipModelo = new PizZip(fs.readFileSync(modelo))
  const textoModelo = [...zipModelo.file("word/document.xml").asText().matchAll(/<w:t(?:\s[^>]*)?>(.*?)<\/w:t>/gs)]
    .map((match) => match[1])
    .join("")
  for (const [, campo] of textoModelo.matchAll(/\{([a-z_]+)\}/gi)) {
    assert.ok(Object.hasOwn(valores, campo), `Campo sem correspondência: ${campo}`)
  }

  const doc = new Docxtemplater(zipModelo, {
    paragraphLoop: true,
    linebreaks: true,
  })
  doc.render(valores)
  const saida = new PizZip(doc.getZip().generate({ type: "nodebuffer" }))
  const xml = saida.file("word/document.xml").asText()

  for (const esperado of ["Cliente &amp; Filhos", "12.345.678/0001-90", "Simples Nacional", "Comércio de livros", "1.234,56", valores.data_inicio, "293,00", "Serviço extra"]) {
    assert.ok(xml.includes(esperado), `Não encontrou ${esperado} no documento`)
  }
  const textoDocumento = [...xml.matchAll(/<w:t(?:\s[^>]*)?>(.*?)<\/w:t>/gs)]
    .map((match) => match[1])
    .join("")
  assert.ok(!/\{[a-z_]+\}/i.test(textoDocumento), "Há marcadores sem preenchimento")
  for (const arquivo of Object.keys(new PizZip(fs.readFileSync(modelo)).files)) {
    if (arquivo.startsWith("word/media/")) assert.ok(saida.file(arquivo), `Imagem perdida: ${arquivo}`)
  }
  console.log("Relatório DOCX preenchido e validado.")
  if (process.argv.includes("--salvar-exemplo")) {
    const diretorio = fs.mkdtempSync(path.join(os.tmpdir(), "relatorio-honorarios-"))
    const arquivo = path.join(diretorio, "relatorio-exemplo.docx")
    fs.writeFileSync(arquivo, saida.generate({ type: "nodebuffer" }))
    console.log(arquivo)
  }
}
