"use strict";

// 綁定 IP 輸入框 change 事件
document.getElementById("ip").addEventListener("change", (e) => {
    remoter.changeURL(`ws://${e.target.value}:16834/livesplit`);
});

// 綁定開始計時按鈕
document.getElementById("startTimer").addEventListener("click", () => {
    remoter.startTimer();
});

// 綁定重置計時按鈕
document.getElementById("resetTimer").addEventListener("click", () => {
    remoter.resetTimer();
});

// 綁定音量偵測按鈕
document.getElementById("startVolumeDetect").addEventListener("click", () => {
    startVolumeDetect();
});