"use strict";

// LiveSplit Websocket 遠端控制器類別
class LSRemoter {
    #ws;
    #connected = false;
    #latencyHistory = [];
    #averageLatency = 0;
    #pingStart;
    #url = `ws://${document.getElementById("ip").value}:16834/livesplit`;
    #maxHistory = 10;
    #latencyElem = document.getElementById("latency");
    #currentTime = document.getElementById("currentTime");
    #currentTimeRowElem = document.getElementById("currentTimeRow");

    constructor() {
        this.#initConnection();

        // 自動重連
        setInterval(() => {
            this.#reconnect();
        }, 5000);

        // 自動發送 ping，偵測延遲
        setInterval(() => {
            if (this.#ws.readyState === WebSocket.OPEN) {
                this.#pingStart = performance.now();
                this.#ws.send("ping");
            }
        }, 500);

        // 自動更新計時器現有時間
        setInterval(() => {
            if (this.#ws.readyState === WebSocket.OPEN) {
                this.#ws.send("getcurrenttime");
            }
        }, 250);
    }

    // 初始連線、綁定事件
    #initConnection() {
        this.#latencyElem.textContent = "正在連線...";
        this.#latencyElem.className = "green";

        // 處理不合法位址輸入的錯誤
        try {
            this.#ws = new WebSocket(this.#url);
        } catch (error) {
            console.error(`[error] 網址 ${this.#url} 錯誤，請檢查輸入的 IP 位址是否正確`);
            this.#latencyElem.textContent = `網址錯誤，請檢查輸入的 IP 位址是否正確`;
            this.#latencyElem.className = "red";
            this.#disableButton();
            this.#currentTimeRowElem.classList.add("hidden");
        }

        // 成功連線事件處理
        this.#ws.addEventListener("open", () => {
            this.#connected = true;
            console.log(`[open] 連線到 ${this.#url} 成功`);
            this.#enableButton();
            this.#currentTimeRowElem.classList.remove("hidden");
        });

        // 連線錯誤事件處理
        this.#ws.addEventListener("error", (err) => {
            this.#connected = false;
            console.log(`[error] 連線到 ${this.#url} 失敗，請檢查 LiveSplit 是否啟動 Websocket Server`);
            this.#latencyElem.textContent = "連線失敗，請檢查 LiveSplit 是否啟動 Websocket Server";
            this.#latencyElem.className = "red";
            this.#disableButton();
            this.#currentTimeRowElem.classList.add("hidden");
        });

        // 接收訊息事件處理，更新延遲和計時器現有時間
        this.#ws.addEventListener("message", (event) => {
            if (event.data === "pong") {
                const latencyNow = performance.now() - this.#pingStart;
                this.#latencyHistory.push(latencyNow);
                if (this.#latencyHistory.length > this.#maxHistory) {
                    this.#latencyHistory.shift();
                }
                this.#averageLatency = this.#latencyHistory.reduce((a, b) => a + b, 0) / this.#latencyHistory.length;
                this.#latencyElem.textContent = `${this.#averageLatency.toFixed(2)} ms，（${(this.#averageLatency / 1000).toFixed(3)} 秒）`;
                this.#latencyElem.className = "";
            } else {
                this.#currentTime.textContent = event.data.toString().substring(3, 11);
            }
        });

        // 連線關閉事件處理（未使用）
        this.#ws.addEventListener("close", () => {
        });
    }

    // 重新連線
    #reconnect() {
        if (this.#ws.readyState === WebSocket.CLOSED) {
            console.log(`正在嘗試重新連線...`);
            this.#initConnection();
        }
    }

    // 啟動按鈕
    #enableButton() {
        document.getElementById("startTimer").disabled = false;
        document.getElementById("resetTimer").disabled = false;
    }

    // 關閉按鈕
    #disableButton() {
        document.getElementById("startTimer").disabled = true;
        document.getElementById("resetTimer").disabled = true;
    }

    // 變更連線網址，重新連線
    changeURL(ip) {
        if (this.#ws.readyState === WebSocket.OPEN) {
            this.#ws.close();
        }
        this.#url = `ws://${ip}:16834/livesplit`;
        this.#initConnection();
    }

    // 開始計時
    startTimer() {
        if (this.#connected) {
            this.#ws.send("start");
        } else {
            console.log("尚未連線，無法發送指令");
        }
    }

    // 重設計時
    resetTimer() {
        if (this.#connected) {
            this.#ws.send("reset");
        } else {
            console.log("尚未連線，無法發送指令");
        }
    }
}

// 初始化物件
let remoter = new LSRemoter();