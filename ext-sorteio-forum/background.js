chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url.includes('ava.unesc.net/mod/forum/')) return
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const painel = document.getElementById('painel-sorteio-forum-ava')
        if (painel) {
          painel.remove()
          return 'removido'
        }
        return 'ausente'
      }
    })
    if (result[0].result === 'ausente') {
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['estilos.css']
      })
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      })
    }
  } catch (e) {
    console.error(e)
  }
})
