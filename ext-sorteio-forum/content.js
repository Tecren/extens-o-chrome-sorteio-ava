const idPainel = 'painel-sorteio-forum-ava'
const THROTTLE_MS = 800
let ultimaAtualizacao = 0
let autoresAtuais = []

if (!window.sorteioForumAvaCarregado) {
  window.sorteioForumAvaCarregado = true
  console.log('[Sorteio Fórum] Primeira carga do script.')
} else {
  console.log('[Sorteio Fórum] Reinjeção detectada, verificando painel.')
}

if (!document.getElementById(idPainel)) {
  inicializar()
} else {
  console.log('[Sorteio Fórum] Painel já presente, não recriado.')
}

function inicializar() {
  if (document.getElementById(idPainel)) return
  const painel = document.createElement('div')
  painel.id = idPainel
  const titulo = document.createElement('div')
  titulo.className = 'psf-titulo'
  titulo.textContent = 'Sorteio de Autores do Fórum'
  const barraAtualizar = document.createElement('div')
  barraAtualizar.className = 'psf-barra-atualizar'
  const botaoAtualizar = criarBotao('Atualizar Autores', () => atualizarAutoresProfundo())
  botaoAtualizar.className = 'psf-btn-atualizar'
  barraAtualizar.appendChild(botaoAtualizar)
  const barraSorteios = document.createElement('div')
  barraSorteios.className = 'psf-barra-sorteios'
  const botaoMeio = criarBotao('Meio a Meio', () => executarSorteio('meio'))
  const botao3 = criarBotao('Dividir em 3', () => executarSorteio('tres'))
  const botao4 = criarBotao('Dividir em 4', () => executarSorteio('quatro'))
  const botaoDuplas = criarBotao('Dividir em Duplas', () => executarSorteio('duplas'))
  barraSorteios.appendChild(botaoMeio)
  barraSorteios.appendChild(botao3)
  barraSorteios.appendChild(botao4)
  barraSorteios.appendChild(botaoDuplas)
  const autoresLista = document.createElement('div')
  autoresLista.className = 'psf-autores'
  const resultados = document.createElement('div')
  resultados.className = 'psf-resultados'
  painel.appendChild(titulo)
  painel.appendChild(barraAtualizar)
  painel.appendChild(barraSorteios)
  painel.appendChild(autoresLista)
  painel.appendChild(resultados)
  document.body.appendChild(painel)
  setTimeout(() => atualizarAutoresProfundo(), 400)
}

function criarBotao(texto, acao) {
  const b = document.createElement('button')
  b.type = 'button'
  b.textContent = texto
  b.addEventListener('click', acao)
  return b
}

function textoLimpo(t) {
  return t.replace(/\s+/g, ' ').replace(/^(por|by|autor)\s*/i, '').replace(/Autor:\s*/i, '').replace(/Imagem de\s*/gi, '').replace(/\d{1,2}\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s+\d{4}/gi, '').replace(/\([^)]*moodle[^)]*\)/i, '').replace(/\.\s*$/,'').trim()
}

function coletarAutores() {
  if (document.querySelector('form#login') || document.body.textContent.includes('Você ainda não se identificou')) return []
  const nomes = new Map()
  const seletores = [
    'a[href*="user/view.php"]',
    '.discussionname a',
    'td.topic.starter a',
    'td.author a',
    '.author a',
    'header.row a[href*="user/view.php"]',
    '.forumpost .author a',
    'div.author a[href*="user/view.php"]',
    'tr.discussion td.author a',
    'div.author.role a[href*="user/view.php"]'
  ]
  console.log('[Sorteio Fórum] Coletando autores...')
  seletores.forEach(sel => {
    document.querySelectorAll(sel).forEach(link => {
      const n = textoLimpo(link.textContent)
      if (n && /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(n) && n.length > 2 && n.length < 80) {
        const chave = n.toLowerCase().replace(/\s+/g,'')
        if (!nomes.has(chave)) {
          nomes.set(chave, n)
          console.log('[Sorteio Fórum] Autor encontrado:', n)
        }
      }
    })
  })
  console.log('[Sorteio Fórum] Total de autores encontrados:', nomes.size)
  return Array.from(nomes.values())
}

function atualizarAutores(forcado) {
  const agora = Date.now()
  if (!forcado && agora - ultimaAtualizacao < THROTTLE_MS) return
  ultimaAtualizacao = agora
  const autores = coletarAutores()
  const area = document.querySelector('#' + idPainel + ' .psf-autores')
  if (!autores.length) area.textContent = 'Nenhum autor identificado ou precisa autenticar.'
  else area.textContent = 'Autores (' + autores.length + '): ' + autores.join(', ')
  limparResultados()
}

function limparResultados() {
  const r = document.querySelector('#' + idPainel + ' .psf-resultados')
  r.innerHTML = ''
}

function embaralhar(lista) {
  return lista.map(v => ({ v, r: Math.random() })).sort((a, b) => a.r - b.r).map(o => o.v)
}

async function atualizarAutoresProfundo() {
  const area = document.querySelector('#' + idPainel + ' .psf-autores')
  area.textContent = 'Coletando autores...'
  limparResultados()
  try {
    const autores = await coletarAutoresProfundo()
    if (!autores.length) {
      area.textContent = 'Nenhum autor encontrado.'
    } else {
      area.textContent = 'Autores ' + autores.length + ': ' + autores.join(', ')
    }
    autoresAtuais = autores
  } catch (e) {
    console.error('[Sorteio Fórum] Erro coleta', e)
    area.textContent = 'Erro na coleta: ' + e.message
  }
}

async function coletarAutoresProfundo() {
  const discussionLinks = Array.from(document.querySelectorAll('a[href*="mod/forum/discuss.php?d="]'))
    .map(a => a.href)
  const unicos = Array.from(new Set(discussionLinks))
  console.log('[Sorteio Fórum] Links de discussões encontrados:', unicos.length)
  if (!unicos.length) return []
  const nomes = new Map()
  const MAX_CONC = 6
  async function processar(url) {
    try {
      const resp = await fetch(url, { credentials: 'same-origin' })
      if (!resp.ok) throw new Error('HTTP ' + resp.status)
      const html = await resp.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')
      doc.querySelectorAll('a[href*="user/view.php"]').forEach(a => {
        const n = textoLimpo(a.textContent)
        if (n && /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(n) && n.length > 2 && n.length < 80) {
          const chave = n.toLowerCase().replace(/\s+/g,'')
          if (!nomes.has(chave)) {
            nomes.set(chave, n)
            console.log('[Sorteio Fórum] Autor:', n, 'em', url)
          }
        }
      })
    } catch (e) {
      console.warn('[Sorteio Fórum] Falha ao ler discussão', url, e)
    }
  }
  let i = 0
  async function proximoLote() {
    const lote = unicos.slice(i, i + MAX_CONC)
    i += MAX_CONC
    await Promise.all(lote.map(l => processar(l)))
    if (i < unicos.length) await proximoLote()
  }
  await proximoLote()
  console.log('[Sorteio Fórum] Coleta finalizou. Total autores:', nomes.size)
  return Array.from(nomes.values())
}

function executarSorteio(tipo) {
  const autores = autoresAtuais.length ? autoresAtuais : coletarAutores()
  if (!autores.length) {
    const rAviso = document.querySelector('#' + idPainel + ' .psf-resultados')
    if (rAviso) {
      rAviso.innerHTML = '<div class="psf-grupo"><div class="psf-grupo-titulo">Aviso</div><div class="psf-grupo-lista">Sem autores para sortear. Clique em "Atualizar Autores" primeiro.</div></div>'
    }
    return
  }
  const r = document.querySelector('#' + idPainel + ' .psf-resultados')
  r.innerHTML = ''
  const sorteados = embaralhar(autores)
  let grupos = []
  if (tipo === 'meio') grupos = agruparEquilibrado(sorteados, 2)
  else if (tipo === 'tres') grupos = agruparEquilibrado(sorteados, 3)
  else if (tipo === 'quatro') grupos = agruparEquilibrado(sorteados, 4)
  else if (tipo === 'duplas') grupos = agruparDuplas(sorteados)
  exibirGrupos(grupos, tipo, sorteados.length)
}

function agruparEquilibrado(lista, qtd) {
  const grupos = Array.from({ length: qtd }, () => [])
  lista.forEach((nome, i) => grupos[i % qtd].push(nome))
  if (qtd === 2 && grupos[0].length > grupos[1].length) {
    while (grupos[0].length - grupos[1].length > 1) grupos[1].push(grupos[0].pop())
  }
  return grupos
}

function agruparDuplas(lista) {
  const grupos = []
  for (let i = 0; i < lista.length; i += 2) grupos.push(lista.slice(i, i + 2))
  return grupos
}

function exibirGrupos(grupos, tipo, total) {
  const r = document.querySelector('#' + idPainel + ' .psf-resultados')
  const cabecalho = document.createElement('div')
  cabecalho.className = 'psf-cabecalho'
  cabecalho.textContent = 'Resultado (' + total + ' autores)'
  r.appendChild(cabecalho)
  grupos.forEach((g, i) => {
    const bloco = document.createElement('div')
    bloco.className = 'psf-grupo'
    const titulo = document.createElement('div')
    titulo.className = 'psf-grupo-titulo'
    titulo.textContent = 'Grupo ' + (i + 1) + ' (' + g.length + ')'
    const lista = document.createElement('div')
    lista.className = 'psf-grupo-lista'
    lista.textContent = g.join(', ')
    bloco.appendChild(titulo)
    bloco.appendChild(lista)
    r.appendChild(bloco)
  })
  const rodape = document.createElement('div')
  rodape.className = 'psf-rodape'
  rodape.textContent = 'Tipo: ' + tipo
  r.appendChild(rodape)
}

