let participants = new Set();
let isListening = false;
let targetKeyword = "";
let observer = null;

function initOverlay() {
  let overlay = document.getElementById("yt-giveaway-overlay");
  
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "yt-giveaway-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 70px;
      left: 20px;
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 15px;
      border-radius: 8px;
      border-left: 5px solid #ff0000;
      font-family: 'Roboto', Arial, sans-serif;
      z-index: 999999;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      width: 260px;
    `;
    
    overlay.innerHTML = `
      <div id="yt-ga-header"></div>
      <button id="yt-ga-btn" style="width: 100%; margin-top: 10px; padding: 6px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; cursor: pointer; font-size: 13px;">Katılımcıları Göster ▼</button>
      <div id="yt-ga-list" style="display: none; max-height: 150px; overflow-y: auto; margin-top: 10px; font-size: 13px; background: rgba(255,255,255,0.1); padding: 5px; border-radius: 4px;"></div>
      <div id="yt-ga-winners" style="display: none; margin-top: 15px; border-top: 1px solid #555; padding-top: 10px;"></div>
    `;
    document.body.appendChild(overlay);

    document.getElementById("yt-ga-btn").onclick = () => {
      let list = document.getElementById("yt-ga-list");
      let btn = document.getElementById("yt-ga-btn");
      if (list.style.display === "none") {
        list.style.display = "block";
        btn.innerText = "Katılımcıları Gizle ▲";
      } else {
        list.style.display = "none";
        btn.innerText = "Katılımcıları Göster ▼";
      }
    };
  }

  // Yeni çekiliş başlatıldığında listeleri sıfırla
  document.getElementById("yt-ga-list").innerHTML = "";
  document.getElementById("yt-ga-winners").style.display = "none";
  document.getElementById("yt-ga-winners").innerHTML = "";
  updateCounter();
}

function updateCounter() {
  let header = document.getElementById("yt-ga-header");
  if (header) {
    header.innerHTML = `🎁 <b>Çekiliş Aktif</b><br><span style="font-size: 13px; color: #aaa;">Kelime: ${targetKeyword}</span><br><br>👥 Katılan: <span style="color: #00ff00; font-size: 20px; font-weight: bold;">${participants.size}</span>`;
  }
}

function addParticipant(author) {
  if (!participants.has(author)) {
    participants.add(author);
    updateCounter();
    
    let list = document.getElementById("yt-ga-list");
    if (list) {
      let p = document.createElement("div");
      p.style.cssText = "padding: 3px; border-bottom: 1px solid rgba(255,255,255,0.05); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;";
      p.textContent = "- " + author;
      list.appendChild(p);
    }
  }
}

function pickWinners(winnerCount) {
  isListening = false;
  
  let header = document.getElementById("yt-ga-header");
  if (header) {
    header.innerHTML = `🛑 <b>Çekiliş Bitti</b><br><br>👥 Toplam Katılan: <span style="color: #00ff00; font-size: 20px; font-weight: bold;">${participants.size}</span>`;
  }

  let array = Array.from(participants);
  if (array.length === 0) {
    alert("Çekilişe henüz kimse katılmadı!");
    return;
  }

  let count = Math.min(winnerCount, array.length);
  let winners = [];
  let tempArray = [...array];
  
  for(let i=0; i<count; i++){
    let randomIndex = Math.floor(Math.random() * tempArray.length);
    winners.push(tempArray[randomIndex]);
    tempArray.splice(randomIndex, 1);
  }

  let winnersDiv = document.getElementById("yt-ga-winners");
  winnersDiv.style.display = "block";
  winnersDiv.innerHTML = `<div style="color: #ffd700; font-size: 15px; font-weight: bold; margin-bottom: 8px;">🎉 KAZANANLAR (${count}):</div>`;
  
  winners.forEach(w => {
    let wDiv = document.createElement("div");
    wDiv.textContent = "🏆 " + w;
    wDiv.style.cssText = "color: white; font-size: 14px; font-weight: bold; margin-bottom: 5px; background: rgba(255, 0, 0, 0.4); padding: 6px; border-radius: 4px;";
    winnersDiv.appendChild(wDiv);
  });
}

function getChatDocument() {
  const iframe = document.getElementById("chatframe");
  return (iframe && iframe.contentDocument) ? iframe.contentDocument : document;
}

function startObserving() {
  if (observer) observer.disconnect();

  observer = new MutationObserver((mutations) => {
    if (!isListening) return;

    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.tagName === "YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER") {
          const authorElement = node.querySelector("#author-name");
          const messageElement = node.querySelector("#message");

          if (authorElement && messageElement) {
            const author = authorElement.textContent.trim();
            const message = messageElement.textContent.trim().toLowerCase();

            if (message.includes(targetKeyword)) {
              addParticipant(author);
            }
          }
        }
      });
    });
  });

  const chatDoc = getChatDocument();
  const chatContainer = chatDoc.querySelector("#item-scroller") || chatDoc.querySelector("yt-live-chat-item-list-renderer");
  
  if (chatContainer) {
    observer.observe(chatContainer, { childList: true, subtree: true });
  } else {
    setTimeout(startObserving, 2000);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "START") {
    targetKeyword = request.keyword.toLowerCase();
    participants.clear();
    isListening = true;
    initOverlay();
    startObserving();
  } 
  else if (request.action === "PICK") {
    pickWinners(request.winnerCount);
  }
});