import Vue from 'vue'
import VueI18n from 'vue-i18n'
import ptBR from '../locales/pt-BR'
import ptBRRaiz from '../locales/pt-BR-raiz'
import en from '../locales/en'

Vue.use(VueI18n)

const CHAVE_IDIOMA = 'palpitezinho_idioma'

export const IDIOMA_PADRAO = 'pt-BR'

// Ordem em que os idiomas aparecem no seletor.
export const IDIOMAS = [
  { codigo: 'pt-BR', bandeira: '🇧🇷' },
  { codigo: 'pt-BR-raiz', bandeira: '🃏' },
  { codigo: 'en', bandeira: '🇺🇸' },
]

// O pt-BR-raiz é uma variante do pt-BR: só declara as frases que mudam (o
// nome do jogo e o tom de algumas mensagens). O merge recursivo aqui completa
// o resto com o pt-BR, então adicionar uma chave nova no idioma padrão já a
// deixa disponível na variante sem precisar duplicar nada.
function mesclarProfundo (base, sobreposicao) {
  const resultado = { ...base }
  for (const [chave, valor] of Object.entries(sobreposicao)) {
    const atual = resultado[chave]
    const ambosObjetos = (
      atual && typeof atual === 'object' && !Array.isArray(atual) &&
      valor && typeof valor === 'object' && !Array.isArray(valor)
    )
    resultado[chave] = ambosObjetos ? mesclarProfundo(atual, valor) : valor
  }
  return resultado
}

const messages = {
  'pt-BR': ptBR,
  'pt-BR-raiz': mesclarProfundo(ptBR, ptBRRaiz),
  en,
}

function idiomaSuportado (codigo) {
  return IDIOMAS.some((idioma) => idioma.codigo === codigo)
}

// Preferência salva > idioma do navegador > padrão. O navegador nunca aponta
// pra variante "raiz" (não é um código de idioma real), então quem chega pela
// primeira vez sempre cai na versão para todos os públicos.
function idiomaInicial () {
  try {
    const salvo = localStorage.getItem(CHAVE_IDIOMA)
    if (salvo && idiomaSuportado(salvo)) return salvo
  } catch (err) {
    // localStorage indisponível (modo privado etc.): segue pra detecção.
  }

  const doNavegador = (navigator.language || '').toLowerCase()
  if (doNavegador.startsWith('pt')) return 'pt-BR'
  if (doNavegador.startsWith('en')) return 'en'
  return IDIOMA_PADRAO
}

const i18n = new VueI18n({
  locale: idiomaInicial(),
  fallbackLocale: IDIOMA_PADRAO,
  silentFallbackWarn: true,
  messages,
})

// Mantém o <html lang> e o título da aba coerentes com o idioma escolhido —
// o nome do jogo muda entre as variantes, então o título precisa acompanhar.
export function aplicarIdiomaNoDocumento () {
  const lang = i18n.locale === 'en' ? 'en' : 'pt-BR'
  document.documentElement.setAttribute('lang', lang)
  document.title = i18n.t('jogo.nome')
}

export function definirIdioma (codigo) {
  if (!idiomaSuportado(codigo)) return
  i18n.locale = codigo
  try {
    localStorage.setItem(CHAVE_IDIOMA, codigo)
  } catch (err) {
    // sem persistência (modo privado etc.): a escolha vale só pra esta sessão.
  }
  aplicarIdiomaNoDocumento()
}

export default i18n
