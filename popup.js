document.getElementById("start-btn").addEventListener("click", async () => {
  const keyword = document.getElementById("keyword").value.trim();
  if (!keyword) {
    alert("Lütfen bir anahtar kelime girin!");
    return;
  }

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: "START", keyword: keyword });
  window.close();
});

document.getElementById("pick-btn").addEventListener("click", async () => {
  let winnerCount = parseInt(document.getElementById("winner-count").value, 10) || 1;
  
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: "PICK", winnerCount: winnerCount });
  window.close();
});