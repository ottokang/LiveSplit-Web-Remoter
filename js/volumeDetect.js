"use strict";

// 初始化音量偵測相關變數和元素參考
let audioContext;
let analyser;
let dataArray;
let isCoolingDown = false;
let threshold;
let thresholdElem = document.getElementById("threshold");
let volumeElem = document.getElementById("volume");

// 開始音量偵測，請求麥克風權限並處理可能的錯誤
async function startVolumeDetect() {
    try {
        audioContext = new AudioContext();
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const micSource = audioContext.createMediaStreamSource(micStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        micSource.connect(analyser);
        dataArray = new Float32Array(analyser.fftSize);
    } catch (err) {
        let errorMessage;
        if (err.name === "NotAllowedError") {
            errorMessage = "錯誤：使用者拒絕了麥克風權限，請允許存取。";
        } else if (err.name === "NotFoundError") {
            errorMessage = "錯誤：找不到麥克風裝置，請檢查硬體連線";
        } else if (err.name === "NotReadableError") {
            errorMessage = "錯誤：麥克風被其他程式佔用中";
        } else if (err.name === "SecurityError") {
            errorMessage = "錯誤：瀏覽器安全性限制，需透過 localhost 或 HTTPS 執行）。";
        } else {
            errorMessage = `未知錯誤：${err.message}`;
        }

        volumeElem.innerText = errorMessage;
        volumeElem.className = "red";
        return;
    }


    const onFrame = () => {
        analyser.getFloatTimeDomainData(dataArray);
        let squares = 0;
        for (let i = 0; i < dataArray.length; i++) {
            squares += dataArray[i] * dataArray[i];
        }
        const mean = squares / dataArray.length;
        const rms = (Math.sqrt(mean) * 100).toFixed(4);
        volumeElem.innerText = rms;
        threshold = parseInt(thresholdElem.value, 10);

        // 超過音量閾值，觸發計時
        if (rms > threshold && !isCoolingDown) {
            triggerTimer(rms);
        }

        requestAnimationFrame(onFrame);
    };
    requestAnimationFrame(onFrame);
}

// 觸發計時器，並啟動冷卻時間 1 秒避免重複觸發
function triggerTimer(rms) {
    if (remoter) {
        remoter.startTimer();
        console.log(`音量 ${rms} 超過閾值 ${parseInt(thresholdElem.value, 10)}，已啟動計時`);
        isCoolingDown = true;
        setTimeout(() => { isCoolingDown = false; }, 1000);
    }
}