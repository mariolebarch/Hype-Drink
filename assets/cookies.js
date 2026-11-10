const CK = "hype_cookies_v1", status = document.getElementById("ckStatus");
document.getElementById("ckSave").addEventListener("click", () => {
  try { localStorage.setItem(CK, JSON.stringify({essenciais:true, analise:false, em:new Date().toISOString()})); status.textContent = "Preferências salvas."; }
  catch (e) { status.textContent = "Não foi possível salvar neste navegador."; }
});
document.getElementById("ckClear").addEventListener("click", () => {
  try { localStorage.removeItem("hype_bag_v1"); localStorage.removeItem("hype_pending_v1"); localStorage.removeItem(CK); status.textContent = "Pronto: sacola e preferências apagadas deste navegador."; }
  catch (e) { status.textContent = "Não foi possível apagar neste navegador."; }
});
